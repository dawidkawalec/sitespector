"""
Background worker for processing website audits.
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models import Audit, AuditStatus, Competitor, CompetitorStatus, AuditSchedule, ScheduleFrequency
from app.config import settings
from app.services import screaming_frog, lighthouse, ai_analysis

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def add_audit_log(audit: Audit, step: str, status: str, message: str, duration_ms: Optional[int] = None) -> None:
    """Add a log entry to the audit's processing_logs."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "step": step,
        "status": status,
        "message": message,
        "duration_ms": duration_ms
    }
    if audit.processing_logs is None:
        audit.processing_logs = []
    
    # SQLAlchemy JSONB mutation tracking
    logs = list(audit.processing_logs)
    logs.append(log_entry)
    audit.processing_logs = logs


async def run_technical_analysis(audit_id: str) -> Dict[str, Any]:
    """
    Phase 1: Technical Analysis (Crawl + Lighthouse + Competitors)
    Saves results and scores to DB immediately.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Audit).where(Audit.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            raise Exception(f"Audit {audit_id} not found")

        try:
            # 1. Screaming Frog Crawl
            audit.processing_step = "crawl:start"
            await add_audit_log(audit, "crawl", "running", "Starting Screaming Frog crawl...")
            await db.commit()
            
            step_start = datetime.utcnow()
            crawl_data = await screaming_frog.crawl_url(audit.url)
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            
            audit.processing_step = "crawl:done"
            await add_audit_log(audit, "crawl", "success", f"Crawl completed ({len(crawl_data.get('all_pages', []))} pages)", duration)
            await db.commit()

            # 2. Lighthouse Audits (Desktop & Mobile in parallel)
            audit.processing_step = "lighthouse:start"
            await add_audit_log(audit, "lighthouse", "running", "Starting Lighthouse audits (Desktop & Mobile)...")
            await db.commit()
            
            step_start = datetime.utcnow()
            lighthouse_data = await lighthouse.audit_both(audit.url)
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            
            audit.processing_step = "lighthouse:done"
            await add_audit_log(audit, "lighthouse", "success", "Lighthouse audits completed", duration)
            await db.commit()

            # 3. Competitor Analysis
            audit.processing_step = "competitors:start"
            await add_audit_log(audit, "competitors", "running", "Starting competitor analysis...")
            await db.commit()
            
            step_start = datetime.utcnow()
            result = await db.execute(select(Competitor).where(Competitor.audit_id == audit_id))
            competitors = result.scalars().all()
            
            if competitors:
                competitor_tasks = [process_competitor(comp, db) for comp in competitors]
                await asyncio.gather(*competitor_tasks, return_exceptions=True)
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            audit.processing_step = "competitors:done"
            await add_audit_log(audit, "competitors", "success", f"Processed {len(competitors)} competitors", duration)
            await db.commit()

            # 4. Calculate Technical Scores
            desktop_data = lighthouse_data.get("desktop", {})
            seo_score = calculate_seo_score(crawl_data, desktop_data)
            performance_score = desktop_data.get("performance_score", 0)
            
            # Save partial results
            audit.seo_score = seo_score
            audit.performance_score = performance_score
            audit.results = {
                "crawl": crawl_data,
                "lighthouse": lighthouse_data
            }
            await db.commit()
            
            return {"crawl": crawl_data, "lighthouse": lighthouse_data}

        except Exception as e:
            await add_audit_log(audit, audit.processing_step or "technical", "error", str(e))
            audit.status = AuditStatus.FAILED
            audit.error_message = str(e)
            await db.commit()
            raise


async def run_ai_analysis(audit_id: str, tech_data: Dict[str, Any]) -> None:
    """
    Phase 2: AI Analysis (Content, UX, Strategic)
    Enriches existing audit results.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Audit).where(Audit.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            return

        audit.ai_status = "processing"
        await db.commit()

        try:
            crawl_data = tech_data["crawl"]
            lighthouse_data = tech_data["lighthouse"]
            
            # 1. AI Content Analysis
            audit.processing_step = "ai_content:start"
            await add_audit_log(audit, "ai_content", "running", "Analyzing content quality with AI...")
            await db.commit()
            
            step_start = datetime.utcnow()
            content_analysis = await ai_analysis.analyze_content(crawl_data)
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            
            audit.processing_step = "ai_content:done"
            await add_audit_log(audit, "ai_content", "success", "Content analysis completed", duration)
            await db.commit()

            # 2. Parallel AI Analysis (Performance, UX, Security, Local SEO, Content Deep)
            audit.processing_step = "ai_parallel:start"
            await add_audit_log(audit, "ai_parallel", "running", "Running parallel AI analyses (UX, Security, SEO)...")
            await db.commit()
            
            step_start = datetime.utcnow()
            
            # Grouping remaining AI tasks to run in parallel
            tasks = {
                "performance": ai_analysis.analyze_performance(lighthouse_data),
                "tech_stack": ai_analysis.detect_tech_stack(audit.url, crawl_data),
                "ux": ai_analysis.analyze_ux(lighthouse_data),
                "local_seo": ai_analysis.analyze_local_seo(crawl_data),
                "security": ai_analysis.analyze_security(audit.url, crawl_data),
                "content_deep": ai_analysis.analyze_content_deep(crawl_data.get("all_pages", []))
            }
            
            # Use asyncio.gather to run all AI tasks in parallel
            task_names = list(tasks.keys())
            task_results = await asyncio.gather(*[tasks[name] for name in task_names], return_exceptions=True)
            
            # Map results back to names
            results_map = {}
            for name, res in zip(task_names, task_results):
                if isinstance(res, Exception):
                    logger.error(f"AI Task {name} failed: {res}")
                    results_map[name] = {} # Fallback to empty dict
                else:
                    results_map[name] = res
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            audit.processing_step = "ai_parallel:done"
            await add_audit_log(audit, "ai_parallel", "success", "Parallel AI analyses completed", duration)
            await db.commit()

            # 3. Strategic AI Analysis (Competitive)
            audit.processing_step = "ai_strategic:start"
            await add_audit_log(audit, "ai_strategic", "running", "Running strategic competitive analysis...")
            await db.commit()
            
            step_start = datetime.utcnow()
            
            # Reload competitors for competitive analysis
            res = await db.execute(select(Competitor).where(Competitor.audit_id == audit_id))
            competitors = res.scalars().all()
            comp_data = [c.results for c in competitors if c.results]
            
            competitive_analysis = await ai_analysis.analyze_competitive(
                {"crawl": crawl_data, "lighthouse": lighthouse_data},
                comp_data
            )
            industry_benchmarks = await ai_analysis.get_industry_benchmarks("general")
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            audit.processing_step = "ai_strategic:done"
            await add_audit_log(audit, "ai_strategic", "success", "Strategic analysis completed", duration)
            await db.commit()

            # Update final scores and results
            content_score = content_analysis.get("quality_score", 0)
            audit.content_score = content_score
            audit.overall_score = (audit.seo_score + audit.performance_score + content_score) / 3
            audit.is_local_business = results_map["local_seo"].get("is_local_business", False)
            
            # Merge AI results into existing results
            results = dict(audit.results)
            results.update({
                "content_analysis": content_analysis,
                "content_deep": results_map["content_deep"],
                "tech_stack": results_map["tech_stack"],
                "security": results_map["security"],
                "ux": results_map["ux"],
                "benchmarks": industry_benchmarks,
                "local_seo": results_map["local_seo"],
                "performance_analysis": results_map["performance"],
                "competitive_analysis": competitive_analysis,
            })
            audit.results = results
            audit.ai_status = "completed"
            audit.status = AuditStatus.COMPLETED
            audit.completed_at = datetime.utcnow()
            audit.processing_step = "completed"
            
            await add_audit_log(audit, "finalizing", "success", "Audit completed successfully")
            await db.commit()

        except Exception as e:
            logger.error(f"AI Analysis failed for audit {audit_id}: {e}")
            audit.ai_status = "failed"
            await add_audit_log(audit, "ai_analysis", "error", f"AI Analysis failed: {str(e)}")
            # Even if AI fails, we mark the audit as COMPLETED because Phase 1 succeeded
            audit.status = AuditStatus.COMPLETED
            audit.completed_at = datetime.utcnow()
            audit.processing_step = "completed"
            await db.commit()


async def process_audit(audit_id: str) -> None:
    """Main entry point for processing an audit."""
    try:
        # Phase 1: Technical
        tech_data = await run_technical_analysis(audit_id)
        
        # Phase 2: AI (runs after Phase 1)
        await run_ai_analysis(audit_id, tech_data)
        
    except Exception as e:
        logger.error(f"Audit {audit_id} failed: {e}")


async def process_competitor(competitor: Competitor, db: AsyncSession) -> None:
    """Process a single competitor."""
    try:
        logger.info(f"Processing competitor: {competitor.url}")
        lighthouse_data = await lighthouse.audit_url(competitor.url, "desktop")
        competitor.results = {"lighthouse": lighthouse_data}
        competitor.status = CompetitorStatus.COMPLETED
        await db.commit()
    except Exception as e:
        logger.error(f"❌ Error processing competitor {competitor.url}: {e}")
        competitor.status = CompetitorStatus.FAILED
        await db.commit()


def calculate_seo_score(crawl_data: dict, lighthouse_seo: dict) -> float:
    """Calculate overall SEO score."""
    score = 100.0
    if not crawl_data.get("title"): score -= 20
    elif crawl_data.get("title_length", 0) < 30 or crawl_data.get("title_length", 0) > 70: score -= 10
    if not crawl_data.get("meta_description"): score -= 15
    elif crawl_data.get("meta_description_length", 0) < 120 or crawl_data.get("meta_description_length", 0) > 170: score -= 8
    h1_count = crawl_data.get("h1_count", 0)
    if h1_count == 0: score -= 15
    elif h1_count > 1: score -= 10
    total_images = crawl_data.get("total_images", 0)
    images_without_alt = crawl_data.get("images_without_alt", 0)
    if total_images > 0 and images_without_alt > 0:
        penalty = min(10, (images_without_alt / total_images) * 10)
        score -= penalty
    if not crawl_data.get("has_sitemap"): score -= 10
    lh_seo_score = lighthouse_seo.get("seo_score", 0)
    score = (score * 0.7) + (lh_seo_score * 0.3)
    return max(0.0, min(100.0, score))


async def worker_loop() -> None:
    """Main worker loop."""
    logger.info("🚀 Starting SiteSpector worker...")
    processing_audits = set()
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # 1. Scheduled audits
                now = datetime.utcnow()
                res = await db.execute(select(AuditSchedule).where(AuditSchedule.is_active == True).where(AuditSchedule.next_run_at <= now))
                for schedule in res.scalars().all():
                    new_audit = Audit(workspace_id=schedule.workspace_id, user_id=schedule.user_id, url=schedule.url, status=AuditStatus.PENDING)
                    db.add(new_audit)
                    await db.flush()
                    if schedule.include_competitors and schedule.competitors_urls:
                        for c_url in schedule.competitors_urls:
                            db.add(Competitor(audit_id=new_audit.id, url=c_url))
                    schedule.last_run_at = now
                    freq_map = {ScheduleFrequency.DAILY: timedelta(days=1), ScheduleFrequency.WEEKLY: timedelta(weeks=1), ScheduleFrequency.MONTHLY: timedelta(days=30)}
                    schedule.next_run_at = now + freq_map.get(schedule.frequency, timedelta(days=7))
                    await db.commit()

                # 2. Pending audits
                res = await db.execute(select(Audit).where(Audit.status == AuditStatus.PENDING).order_by(Audit.created_at).limit(settings.WORKER_MAX_CONCURRENT_AUDITS))
                for audit in res.scalars().all():
                    if audit.id not in processing_audits:
                        processing_audits.add(audit.id)
                        asyncio.create_task(process_audit_with_cleanup(audit.id, processing_audits))
                
                # 3. Timeouts
                timeout_threshold = datetime.utcnow() - timedelta(minutes=settings.AUDIT_TIMEOUT_MINUTES)
                res = await db.execute(select(Audit).where(Audit.status == AuditStatus.PROCESSING).where(Audit.started_at < timeout_threshold))
                for audit in res.scalars().all():
                    audit.status = AuditStatus.FAILED
                    audit.error_message = "Audit timed out"
                    audit.completed_at = datetime.utcnow()
                await db.commit()
        except Exception as e:
            logger.error(f"Worker loop error: {e}", exc_info=True)
        await asyncio.sleep(settings.WORKER_POLL_INTERVAL)


async def process_audit_with_cleanup(audit_id: str, processing_set: set) -> None:
    try:
        await process_audit(audit_id)
    finally:
        processing_set.discard(audit_id)

if __name__ == "__main__":
    asyncio.run(worker_loop())
