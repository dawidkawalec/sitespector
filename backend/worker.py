"""
Background worker for processing website audits.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models import Audit, AuditStatus, Competitor, CompetitorStatus
from app.config import settings
from app.services import screaming_frog, lighthouse, ai_analysis

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def process_audit(audit_id: str) -> None:
    """
    Process a single audit end-to-end.
    
    Steps:
    1. Update status to 'processing'
    2. Run Screaming Frog crawl
    3. Run Lighthouse audits (desktop + mobile)
    4. Process competitors (parallel)
    5. Run AI analysis
    6. Calculate scores
    7. Update status to 'completed'
    
    Args:
        audit_id: Audit UUID to process
    """
    async with AsyncSessionLocal() as db:
        try:
            # Load audit
            result = await db.execute(
                select(Audit).where(Audit.id == audit_id)
            )
            audit = result.scalar_one_or_none()
            
            if not audit:
                logger.error(f"Audit {audit_id} not found")
                return
            
            logger.info(f"Processing audit {audit_id} for URL: {audit.url}")
            
            # Update status to processing
            audit.status = AuditStatus.PROCESSING
            audit.started_at = datetime.utcnow()
            await db.commit()
            
            # Step 1: Screaming Frog crawl
            logger.info(f"[{audit_id}] Running Screaming Frog crawl...")
            crawl_data = await screaming_frog.crawl_url(audit.url)
            
            # Step 2: Lighthouse audits
            logger.info(f"[{audit_id}] Running Lighthouse audits...")
            lighthouse_data = await lighthouse.audit_both(audit.url)
            
            # Step 3: Process competitors (parallel)
            result = await db.execute(
                select(Competitor).where(Competitor.audit_id == audit_id)
            )
            competitors = result.scalars().all()
            
            if competitors:
                logger.info(f"[{audit_id}] Processing {len(competitors)} competitors...")
                competitor_tasks = []
                for comp in competitors:
                    competitor_tasks.append(process_competitor(comp, db))
                await asyncio.gather(*competitor_tasks, return_exceptions=True)
            
            # Step 4: AI Analysis
            logger.info(f"[{audit_id}] Running AI analysis...")
            
            content_analysis = await ai_analysis.analyze_content(crawl_data)
            local_seo_analysis = await ai_analysis.analyze_local_seo(crawl_data)
            performance_analysis = await ai_analysis.analyze_performance(lighthouse_data)
            content_deep_analysis = await ai_analysis.analyze_content_deep(crawl_data.get("all_pages", []))
            tech_stack = await ai_analysis.detect_tech_stack(audit.url, crawl_data)
            security_analysis = await ai_analysis.analyze_security(audit.url, crawl_data)
            ux_analysis = await ai_analysis.analyze_ux(lighthouse_data)
            
            # Reload competitors with results
            result = await db.execute(
                select(Competitor).where(Competitor.audit_id == audit_id)
            )
            competitors_with_results = result.scalars().all()
            competitor_data = [c.results for c in competitors_with_results if c.results]
            
            competitive_analysis = await ai_analysis.analyze_competitive(
                {"crawl": crawl_data, "lighthouse": lighthouse_data},
                competitor_data
            )
            
            # Step 5: Calculate scores
            desktop_data = lighthouse_data.get("desktop", {})
            seo_score = calculate_seo_score(crawl_data, desktop_data)
            performance_score = desktop_data.get("performance_score", 0)
            content_score = content_analysis.get("quality_score", 0)
            
            overall_score = (seo_score + performance_score + content_score) / 3
            
            # Step 6: Compile results
            results = {
                "crawl": crawl_data,
                "lighthouse": lighthouse_data,
                "content_analysis": content_analysis,
                "content_deep": content_deep_analysis,
                "tech_stack": tech_stack,
                "security": security_analysis,
                "ux": ux_analysis,
                "local_seo": local_seo_analysis,
                "performance_analysis": performance_analysis,
                "competitive_analysis": competitive_analysis,
            }
            
            # Step 7: Update audit with results
            audit.status = AuditStatus.COMPLETED
            audit.overall_score = overall_score
            audit.seo_score = seo_score
            audit.performance_score = performance_score
            audit.content_score = content_score
            audit.is_local_business = local_seo_analysis.get("is_local_business", False)
            audit.results = results
            audit.completed_at = datetime.utcnow()
            
            await db.commit()
            
            logger.info(f"✅ Audit {audit_id} completed successfully (score: {overall_score:.1f})")
            
        except Exception as e:
            logger.error(f"❌ Error processing audit {audit_id}: {e}", exc_info=True)
            
            # Update audit to failed
            try:
                audit.status = AuditStatus.FAILED
                audit.error_message = str(e)
                audit.completed_at = datetime.utcnow()
                await db.commit()
            except Exception as commit_error:
                logger.error(f"Failed to update audit status: {commit_error}")


async def process_competitor(competitor: Competitor, db: AsyncSession) -> None:
    """
    Process a single competitor.
    
    Args:
        competitor: Competitor object to process
        db: Database session
    """
    try:
        logger.info(f"Processing competitor: {competitor.url}")
        
        # Run basic checks (simplified for competitors)
        lighthouse_data = await lighthouse.audit_url(competitor.url, "desktop")
        
        competitor.results = {
            "lighthouse": lighthouse_data,
        }
        competitor.status = CompetitorStatus.COMPLETED
        
        await db.commit()
        
        logger.info(f"✅ Competitor {competitor.url} processed")
        
    except Exception as e:
        logger.error(f"❌ Error processing competitor {competitor.url}: {e}")
        competitor.status = CompetitorStatus.FAILED
        await db.commit()


def calculate_seo_score(crawl_data: dict, lighthouse_seo: dict) -> float:
    """
    Calculate overall SEO score from crawl and Lighthouse data.
    
    Args:
        crawl_data: Screaming Frog crawl data
        lighthouse_seo: Lighthouse SEO data
        
    Returns:
        SEO score (0-100)
    """
    score = 100.0
    
    # Title tag (20 points)
    if not crawl_data.get("title"):
        score -= 20
    elif crawl_data.get("title_length", 0) < 30 or crawl_data.get("title_length", 0) > 70:
        score -= 10
    
    # Meta description (15 points)
    if not crawl_data.get("meta_description"):
        score -= 15
    elif crawl_data.get("meta_description_length", 0) < 120 or crawl_data.get("meta_description_length", 0) > 170:
        score -= 8
    
    # H1 tag (15 points)
    h1_count = crawl_data.get("h1_count", 0)
    if h1_count == 0:
        score -= 15
    elif h1_count > 1:
        score -= 10
    
    # Images with ALT (10 points)
    total_images = crawl_data.get("total_images", 0)
    images_without_alt = crawl_data.get("images_without_alt", 0)
    if total_images > 0 and images_without_alt > 0:
        penalty = min(10, (images_without_alt / total_images) * 10)
        score -= penalty
    
    # Sitemap (10 points)
    if not crawl_data.get("has_sitemap"):
        score -= 10
    
    # Lighthouse SEO score (30 points)
    lighthouse_seo_score = lighthouse_seo.get("seo_score", 0)
    score = (score * 0.7) + (lighthouse_seo_score * 0.3)
    
    return max(0.0, min(100.0, score))


async def worker_loop() -> None:
    """
    Main worker loop that polls for pending audits.
    """
    logger.info("🚀 Starting SiteSpector worker...")
    logger.info(f"Poll interval: {settings.WORKER_POLL_INTERVAL}s")
    logger.info(f"Max concurrent audits: {settings.WORKER_MAX_CONCURRENT_AUDITS}")
    
    processing_audits = set()
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # Find pending audits
                result = await db.execute(
                    select(Audit)
                    .where(Audit.status == AuditStatus.PENDING)
                    .order_by(Audit.created_at)
                    .limit(settings.WORKER_MAX_CONCURRENT_AUDITS)
                )
                pending_audits = result.scalars().all()
                
                # Process audits
                for audit in pending_audits:
                    if audit.id not in processing_audits:
                        processing_audits.add(audit.id)
                        asyncio.create_task(
                            process_audit_with_cleanup(audit.id, processing_audits)
                        )
                
                # Check for timeout audits
                timeout_threshold = datetime.utcnow() - timedelta(
                    minutes=settings.AUDIT_TIMEOUT_MINUTES
                )
                
                result = await db.execute(
                    select(Audit)
                    .where(Audit.status == AuditStatus.PROCESSING)
                    .where(Audit.started_at < timeout_threshold)
                )
                timeout_audits = result.scalars().all()
                
                for audit in timeout_audits:
                    logger.warning(f"Audit {audit.id} timed out")
                    audit.status = AuditStatus.FAILED
                    audit.error_message = "Audit timed out"
                    audit.completed_at = datetime.utcnow()
                
                await db.commit()
            
        except Exception as e:
            logger.error(f"Worker loop error: {e}", exc_info=True)
        
        # Wait before next poll
        await asyncio.sleep(settings.WORKER_POLL_INTERVAL)


async def process_audit_with_cleanup(audit_id: str, processing_set: set) -> None:
    """
    Process audit and remove from processing set when done.
    
    Args:
        audit_id: Audit ID to process
        processing_set: Set of currently processing audit IDs
    """
    try:
        await process_audit(audit_id)
    finally:
        processing_set.discard(audit_id)


if __name__ == "__main__":
    asyncio.run(worker_loop())

