"""
Background worker for processing website audits.
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models import Audit, AuditStatus, Competitor, CompetitorStatus, AuditSchedule, ScheduleFrequency, AuditTask, TaskPriority
from app.config import settings
from app.services import screaming_frog, lighthouse, ai_analysis, senuto
from app.services import ai_execution_plan
from app.services import technical_seo_extras
from app.services.page_classifier import classify_pages
from app.services.health_index import (
    compute_content_quality_index,
    compute_technical_health_index,
    compute_traffic_estimation,
    compute_visibility_momentum,
)
from app.services.rag_service import index_audit_for_rag

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


def _summarize_result_shapes(results: Dict[str, Any]) -> Dict[str, Any]:
    """Return lightweight shape summary for AI checkpoints."""
    ai_contexts = results.get("ai_contexts", {}) if isinstance(results, dict) else {}
    context_summary: Dict[str, Any] = {}
    if isinstance(ai_contexts, dict):
        for area, payload in ai_contexts.items():
            if isinstance(payload, dict):
                context_summary[area] = {
                    "key_findings": len(payload.get("key_findings", []) or []),
                    "recommendations": len(payload.get("recommendations", []) or []),
                    "quick_wins": len(payload.get("quick_wins", []) or []),
                    "priority_issues": len(payload.get("priority_issues", []) or []),
                }
            else:
                context_summary[area] = {"invalid_payload": True}

    return {
        "top_level_keys": sorted(results.keys()) if isinstance(results, dict) else [],
        "has_cross_tool": "cross_tool" in results if isinstance(results, dict) else False,
        "has_roadmap": "roadmap" in results if isinstance(results, dict) else False,
        "has_executive_summary": "executive_summary" in results if isinstance(results, dict) else False,
        "ai_contexts": context_summary,
    }


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
            crawl_data = await screaming_frog.crawl_url(
                audit.url,
                user_agent=getattr(audit, "crawler_user_agent", None) or None,
            )
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

            # 3. Senuto Analysis
            audit.processing_step = "senuto:start"
            await add_audit_log(audit, "senuto", "running", "Starting Senuto visibility & backlinks analysis...")
            await db.commit()

            step_start = datetime.utcnow()
            try:
                senuto_data = await senuto.analyze_domain(
                    domain=audit.url,
                    country_id=audit.senuto_country_id or settings.SENUTO_DEFAULT_COUNTRY_ID,
                    fetch_mode=audit.senuto_fetch_mode or settings.SENUTO_DEFAULT_FETCH_MODE,
                )
                duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
                audit.processing_step = "senuto:done"
                await add_audit_log(audit, "senuto", "success", "Senuto analysis completed", duration)
                senuto_meta = (senuto_data or {}).get("_meta", {})
                await add_audit_log(
                    audit,
                    "senuto_extended",
                    "success",
                    (
                        "Extended Senuto payload collected "
                        f"(positions={senuto_meta.get('positions_count', 0)}"
                        f"/{senuto_meta.get('positions_total', 0)}, "
                        f"wins={senuto_meta.get('wins_count', 0)}, "
                        f"losses={senuto_meta.get('losses_count', 0)}, "
                        f"backlinks={senuto_meta.get('backlinks_count', 0)}, "
                        f"aio_keywords={senuto_meta.get('ai_overviews_keywords_count', 0)})"
                    ),
                )
            except Exception as e:
                logger.warning(f"Senuto analysis failed (non-fatal): {e}")
                senuto_data = {}
                await add_audit_log(audit, "senuto", "warning", f"Senuto skipped: {str(e)}")
            await db.commit()

            # 4. Competitor Analysis
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

            # 4a. Technical SEO Extras (structured data, robots.txt, sitemap, semantic HTML)
            audit.processing_step = "technical_extras:start"
            await add_audit_log(audit, "technical_extras", "running", "Collecting structured data, robots.txt and sitemap analysis...")
            await db.commit()

            step_start = datetime.utcnow()
            try:
                all_page_urls = [p.get("url", "") for p in crawl_data.get("all_pages", [])]
                extras = await technical_seo_extras.collect_technical_extras(
                    url=audit.url,
                    crawled_urls=all_page_urls,
                    sitemap_url=crawl_data.get("sitemap_url"),
                    user_agent=getattr(audit, "crawler_user_agent", None) or None,
                    sf_raw_tabs=crawl_data.get("sf_raw_tabs"),
                    all_pages=crawl_data.get("all_pages"),
                )
                crawl_data["structured_data"] = extras.get("structured_data") or {}
                crawl_data["structured_data_v2"] = extras.get("structured_data_v2") or {}
                crawl_data["robots_txt"] = extras.get("robots_txt") or {}
                crawl_data["sitemap_analysis"] = extras.get("sitemap_analysis") or {}
                crawl_data["domain_config"] = extras.get("domain_config") or {}
                crawl_data["semantic_html"] = extras.get("semantic_html") or {}
                crawl_data["render_nojs"] = extras.get("render_nojs") or {}
                crawl_data["soft_404"] = extras.get("soft_404") or {}
                crawl_data["directives_hreflang"] = extras.get("directives_hreflang") or {}
                crawl_data["ai_readiness"] = extras.get("ai_readiness") or {}
                duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
                audit.processing_step = "technical_extras:done"
                await add_audit_log(audit, "technical_extras", "success", "Technical extras collected", duration)
            except Exception as e:
                logger.warning("Technical extras collection failed (non-fatal): %s", e)
                await add_audit_log(audit, "technical_extras", "warning", f"Technical extras skipped: {str(e)}")
            await db.commit()

            # 4b. Page Classification
            audit.processing_step = "page_classification:start"
            await add_audit_log(audit, "page_classification", "running", "Classifying pages by type...")
            await db.commit()

            step_start = datetime.utcnow()
            try:
                page_class_result = classify_pages(
                    crawl_data.get("all_pages", []),
                    audit.url,
                    structured_data_v2=crawl_data.get("structured_data_v2"),
                )
                crawl_data["page_classifications"] = page_class_result.get("classifications", {})
                crawl_data["page_type_stats"] = page_class_result.get("page_type_stats", {})
                crawl_data["sample_urls_by_type"] = page_class_result.get("sample_urls_by_type", {})
                duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
                audit.processing_step = "page_classification:done"
                stats_summary = ", ".join(
                    f"{k}={v}" for k, v in sorted(
                        page_class_result.get("page_type_stats", {}).items(),
                        key=lambda x: -x[1],
                    )
                )
                await add_audit_log(audit, "page_classification", "success", f"Pages classified: {stats_summary}", duration)
            except Exception as e:
                logger.warning("Page classification failed (non-fatal): %s", e)
                await add_audit_log(audit, "page_classification", "warning", f"Page classification skipped: {str(e)}")
            await db.commit()

            # 4c. Lighthouse Subpages (representative pages per type)
            lighthouse_subpages = {}
            if crawl_data.get("page_classifications"):
                audit.processing_step = "lighthouse_subpages:start"
                await add_audit_log(audit, "lighthouse_subpages", "running", "Running Lighthouse on representative subpages...")
                await db.commit()

                step_start = datetime.utcnow()
                try:
                    from app.services.page_classifier import select_representative_pages
                    subpage_urls = select_representative_pages(
                        crawl_data.get("all_pages", []),
                        crawl_data.get("page_classifications", {}),
                        max_per_type=2,
                        max_total=8,
                    )
                    if subpage_urls:
                        lighthouse_subpages = await lighthouse.audit_subpages(subpage_urls, max_concurrent=2)
                        crawl_data["lighthouse_subpages"] = lighthouse_subpages
                    duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
                    successful = sum(1 for r in lighthouse_subpages.values() if "error" not in r)
                    audit.processing_step = "lighthouse_subpages:done"
                    await add_audit_log(
                        audit, "lighthouse_subpages", "success",
                        f"Subpage Lighthouse: {successful}/{len(subpage_urls)} OK", duration,
                    )
                except Exception as e:
                    logger.warning("Lighthouse subpages failed (non-fatal): %s", e)
                    await add_audit_log(audit, "lighthouse_subpages", "warning", f"Subpage LH skipped: {str(e)}")
                await db.commit()

            # 4d. Calculate Technical Scores
            desktop_data = lighthouse_data.get("desktop", {})
            seo_score = calculate_seo_score(crawl_data, desktop_data)
            performance_score = desktop_data.get("performance_score", 0)
            partial_results = {
                "crawl": crawl_data,
                "lighthouse": lighthouse_data,
                "senuto": senuto_data,
            }
            technical_health_index = compute_technical_health_index(partial_results)
            visibility_momentum = compute_visibility_momentum(senuto_data)
            traffic_estimation = compute_traffic_estimation(senuto_data)
            content_quality_index = compute_content_quality_index(partial_results)

            # Persist crawl_blocked so frontend and Phase 2/3 can skip AI when site blocked crawler
            audit.crawl_blocked = crawl_data.get("crawl_blocked", False)
            
            # Save partial results
            audit.seo_score = seo_score
            audit.performance_score = performance_score
            audit.results = {
                **partial_results,
                "technical_health_index": technical_health_index,
                "visibility_momentum": visibility_momentum,
                "traffic_estimation": traffic_estimation,
                "content_quality_index": content_quality_index,
            }
            await db.commit()
            
            return {
                "crawl": crawl_data,
                "lighthouse": lighthouse_data,
                "senuto": senuto_data,
                "technical_health_index": technical_health_index,
                "visibility_momentum": visibility_momentum,
                "traffic_estimation": traffic_estimation,
                "content_quality_index": content_quality_index,
            }

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

        # Load business context if linked
        bc_dict = None
        if audit.business_context_id:
            from app.models import BusinessContext
            bc_result = await db.execute(select(BusinessContext).where(BusinessContext.id == audit.business_context_id))
            bc = bc_result.scalar_one_or_none()
            if bc:
                bc_dict = {
                    "business_type": bc.business_type,
                    "industry": bc.industry,
                    "target_audience": bc.target_audience,
                    "geographic_focus": bc.geographic_focus,
                    "business_goals": bc.business_goals,
                    "priorities": bc.priorities,
                    "key_products_services": bc.key_products_services,
                    "competitors_context": bc.competitors_context,
                    "current_challenges": bc.current_challenges,
                    "budget_range": bc.budget_range,
                    "team_capabilities": bc.team_capabilities,
                }
                logger.info("Business context loaded for audit %s: type=%s, industry=%s", audit_id, bc.business_type, bc.industry)

        crawl_data = tech_data.get("crawl", {})
        if crawl_data.get("crawl_blocked"):
            audit.ai_status = "skipped_blocked"
            await add_audit_log(
                audit,
                "ai_analysis",
                "skipped",
                "Crawl blocked by target site (HTTP 403/4xx). AI analysis skipped to avoid misleading recommendations.",
            )
            audit.status = AuditStatus.COMPLETED
            audit.completed_at = datetime.utcnow()
            audit.processing_step = "completed"
            await db.commit()
            logger.warning("AI analysis skipped for audit %s: crawl blocked (403/4xx)", audit_id)
            return

        audit.ai_status = "processing"
        await db.commit()
        logger.info(
            "run_ai_analysis started (audit_id=%s, tech_keys=%s, run_ai_pipeline=%s)",
            audit_id,
            sorted(list(tech_data.keys())),
            audit.run_ai_pipeline,
        )

        try:
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
            await db.commit()

            # 4. Contextual AI analyses (per-area insights for split layout)
            audit.processing_step = "ai_contexts:start"
            await add_audit_log(audit, "ai_contexts", "running", "Running contextual AI analyses per area...")
            await db.commit()
            
            step_start = datetime.utcnow()
            
            senuto_data = results.get("senuto", {})
            from app.services.global_context import build_global_snapshot
            global_snapshot = build_global_snapshot(
                crawl=crawl_data,
                lighthouse=lighthouse_data,
                senuto=senuto_data,
                extra={"phase": "ai_contexts"},
                business_context=bc_dict,
            )
            
            # Helper to call AI with sequential context to avoid duplication
            ai_contexts = {}
            
            async def _call_sequentially(name, func, *args, **kwargs):
                # Add existing findings to global snapshot to avoid repetition
                current_findings = []
                for ctx in ai_contexts.values():
                    current_findings.extend(ctx.get("key_findings", []))
                
                if kwargs.get("global_snapshot"):
                    kwargs["global_snapshot"]["previous_findings"] = current_findings[:20]
                
                res = await func(*args, **kwargs)
                ai_contexts[name] = res

            # Some can still be parallel if they are very different areas, 
            # but let's do main ones in a way that they see each other
            await _call_sequentially("seo", ai_analysis.analyze_seo_context, crawl_data, lighthouse_data, senuto_data, global_snapshot=global_snapshot)
            
            # Now run others in parallel but with SEO findings in context
            context_tasks = {
                "performance": ai_analysis.analyze_performance_context(
                    lighthouse_data.get("desktop", {}),
                    lighthouse_data.get("mobile", {}),
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "links": ai_analysis.analyze_links_context(crawl_data, global_snapshot=global_snapshot),
                "images": ai_analysis.analyze_images_context(crawl_data, global_snapshot=global_snapshot),
                "schema": ai_analysis.analyze_schema_context(
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "content_quality": ai_analysis.analyze_content_quality_context(
                    results.get("content_quality_index", {}),
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "ai_readiness": ai_analysis.analyze_ai_readiness_context(
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "architecture": ai_analysis.analyze_architecture_context(
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "security": ai_analysis.analyze_security_context(
                    results.get("security", {}),
                    crawl_data,
                    global_snapshot=global_snapshot,
                ),
                "ux": ai_analysis.analyze_ux_context(
                    results.get("ux", {}),
                    lighthouse_data,
                    global_snapshot=global_snapshot,
                ),
            }
            
            # Add Senuto-dependent contexts only if data exists
            if senuto_data.get("visibility"):
                context_tasks["visibility"] = ai_analysis.analyze_visibility_context(
                    senuto_data["visibility"],
                    crawl_data,
                    ai_overviews_data=senuto_data.get("visibility", {}).get("ai_overviews", {}),
                    global_snapshot=global_snapshot,
                )
            if senuto_data.get("backlinks"):
                context_tasks["backlinks"] = ai_analysis.analyze_backlinks_context(
                    senuto_data["backlinks"],
                    crawl_data,
                    global_snapshot=global_snapshot,
                )
            if (
                senuto_data.get("visibility", {}).get("ai_overviews", {}).get("keywords")
                or senuto_data.get("visibility", {}).get("ai_overviews", {}).get("statistics")
            ):
                context_tasks["ai_overviews"] = ai_analysis.analyze_ai_overviews_context(
                    senuto_data["visibility"].get("ai_overviews", {}),
                    crawl_data,
                    global_snapshot=global_snapshot,
                )
            
            ctx_names = list(context_tasks.keys())
            ctx_results = await asyncio.gather(
                *[context_tasks[n] for n in ctx_names],
                return_exceptions=True
            )
            
            for name, res in zip(ctx_names, ctx_results):
                if isinstance(res, Exception):
                    logger.error(f"Context AI {name} failed: {res}")
                    ai_contexts[name] = {}
                else:
                    ai_contexts[name] = res
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            audit.processing_step = "ai_contexts:done"
            await add_audit_log(audit, "ai_contexts", "success", f"Contextual analyses completed ({len(ctx_names)} areas)", duration)
            
            results = dict(audit.results)
            results["ai_contexts"] = ai_contexts
            
            # Validate cross-module consistency
            consistency_report = ai_analysis.validate_cross_module_consistency(ai_contexts)
            results["consistency_report"] = consistency_report
            
            if not consistency_report.get("is_consistent"):
                logger.warning(f"Cross-module inconsistencies detected for audit {audit_id}: {len(consistency_report.get('conflicts', []))} conflicts")
                for conflict in consistency_report.get("conflicts", []):
                    logger.warning(f"  - {conflict['issue']} (modules: {conflict['modules']})")
            
            # Ensure SQLAlchemy sees JSONB mutation as a new value.
            from sqlalchemy.orm.attributes import flag_modified
            audit.results = dict(results)
            flag_modified(audit, "results")
            await db.commit()
            logger.info(
                "AI checkpoint after ai_contexts (audit_id=%s): %s",
                audit_id,
                json.dumps(_summarize_result_shapes(results), ensure_ascii=True),
            )

            # 5. Cross-tool analysis + Roadmap + Executive Summary
            audit.processing_step = "ai_strategy:start"
            await add_audit_log(audit, "ai_strategy", "running", "Generating strategy, roadmap, executive summary...")
            await db.commit()
            
            step_start = datetime.utcnow()
            
            strategy_snapshot = build_global_snapshot(
                crawl=crawl_data,
                lighthouse=lighthouse_data,
                senuto=results.get("senuto", {}),
                extra={"phase": "ai_strategy"},
                business_context=bc_dict,
            )
            strategy_tasks = {
                "cross_tool": ai_analysis.analyze_cross_tool(results, global_snapshot=strategy_snapshot),
                "roadmap": ai_analysis.generate_roadmap(results, global_snapshot=strategy_snapshot),
                "executive_summary": ai_analysis.generate_executive_summary(results, global_snapshot=strategy_snapshot),
            }
            
            strat_names = list(strategy_tasks.keys())
            strat_results = await asyncio.gather(
                *[strategy_tasks[n] for n in strat_names],
                return_exceptions=True
            )
            
            for name, res in zip(strat_names, strat_results):
                if isinstance(res, Exception):
                    logger.error(f"Strategy AI {name} failed: {res}")
                    results[name] = {}
                else:
                    results[name] = res

            # Build a unified quick wins list from all AI modules.
            results["quick_wins"] = ai_analysis.aggregate_quick_wins_from_results(results, max_items=24)
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            audit.processing_step = "ai_strategy:done"
            await add_audit_log(audit, "ai_strategy", "success", "Strategy generation completed", duration)
            
            # IMPORTANT: `results` was previously assigned to audit.results. Mutating it in-place may not be persisted
            # unless we reassign a fresh dict / flag_modified for JSONB.
            from sqlalchemy.orm.attributes import flag_modified
            audit.results = dict(results)
            flag_modified(audit, "results")
            audit.ai_status = "completed"
            audit.status = AuditStatus.COMPLETED
            audit.completed_at = datetime.utcnow()
            audit.processing_step = "completed"
            
            await add_audit_log(audit, "finalizing", "success", "Audit completed successfully")
            await db.commit()
            logger.info(
                "AI checkpoint after ai_strategy (audit_id=%s): %s",
                audit_id,
                json.dumps(_summarize_result_shapes(results), ensure_ascii=True),
            )

            # RAG indexing is best-effort and must not block audit completion.
            async def _rag_index_bg(aid: str) -> None:
                try:
                    async with AsyncSessionLocal() as rag_db:
                        await index_audit_for_rag(rag_db, aid)
                        await rag_db.commit()
                except Exception as e:
                    logger.warning("RAG indexing failed (audit_id=%s): %s", aid, e)

            asyncio.create_task(_rag_index_bg(audit_id))

        except Exception as e:
            logger.error(f"AI Analysis failed for audit {audit_id}: {e}")
            audit.ai_status = "failed"
            await add_audit_log(audit, "ai_analysis", "error", f"AI Analysis failed: {str(e)}")
            # Even if AI fails, we mark the audit as COMPLETED because Phase 1 succeeded
            audit.status = AuditStatus.COMPLETED
            audit.completed_at = datetime.utcnow()
            audit.processing_step = "completed"
            await db.commit()


async def run_execution_plan(audit_id: str, tech_data: Dict[str, Any]) -> None:
    """
    Phase 3: Execution Plan Generation
    Generates concrete, actionable tasks from audit results.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Audit).where(Audit.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            raise Exception(f"Audit {audit_id} not found")
        
        try:
            crawl_data = tech_data.get("crawl", {})
            if crawl_data.get("crawl_blocked"):
                audit.execution_plan_status = "skipped"
                await add_audit_log(
                    audit,
                    "execution_plan",
                    "skipped",
                    "Crawl blocked by target site. Execution plan skipped to avoid misleading tasks.",
                )
                await db.commit()
                logger.warning("Execution plan skipped for audit %s: crawl blocked", audit_id)
                return

            audit.execution_plan_status = "processing"
            audit.processing_step = "execution_plan:start"
            await add_audit_log(audit, "execution_plan", "running", "Starting execution plan generation...")
            await db.commit()
            
            step_start = datetime.utcnow()
            
            # Get Phase 1 and Phase 2 results
            lighthouse_data = tech_data.get("lighthouse", {})
            senuto_data = tech_data.get("senuto", {})
            
            results = audit.results or {}
            ai_contexts = results.get("ai_contexts", {})
            
            # Run all module task generators in parallel
            tasks_futures = []
            
            # SEO
            tasks_futures.append(
                ai_execution_plan.generate_seo_tasks(
                    crawl_data,
                    lighthouse_data,
                    senuto_data,
                    ai_contexts.get("seo")
                )
            )
            
            # Performance
            tasks_futures.append(
                ai_execution_plan.generate_performance_tasks(
                    lighthouse_data,
                    crawl_data,
                    ai_contexts.get("performance")
                )
            )
            
            # Visibility (if Senuto data exists)
            if senuto_data.get("visibility"):
                tasks_futures.append(
                    ai_execution_plan.generate_visibility_tasks(
                        senuto_data,
                        crawl_data,
                        ai_contexts.get("visibility")
                    )
                )
            
            # AI Overviews (if data exists)
            if senuto_data.get("visibility", {}).get("ai_overviews"):
                tasks_futures.append(
                    ai_execution_plan.generate_ai_overviews_tasks(
                        senuto_data["visibility"]["ai_overviews"],
                        crawl_data,
                        ai_contexts.get("ai_overviews")
                    )
                )
            
            # Links
            tasks_futures.append(
                ai_execution_plan.generate_links_tasks(
                    crawl_data,
                    senuto_data.get("backlinks"),
                    ai_contexts.get("links")
                )
            )
            
            # Images
            tasks_futures.append(
                ai_execution_plan.generate_images_tasks(
                    crawl_data,
                    ai_contexts.get("images")
                )
            )

            # Schema
            tasks_futures.append(
                ai_execution_plan.generate_schema_tasks(
                    crawl_data,
                    ai_contexts.get("schema")
                )
            )

            # Content Quality
            tasks_futures.append(
                ai_execution_plan.generate_content_quality_tasks(
                    results.get("content_quality_index", {}),
                    crawl_data,
                    ai_contexts.get("content_quality")
                )
            )

            # AI Readiness
            tasks_futures.append(
                ai_execution_plan.generate_ai_readiness_tasks(
                    crawl_data,
                    ai_contexts.get("ai_readiness")
                )
            )

            # Architecture
            tasks_futures.append(
                ai_execution_plan.generate_architecture_tasks(
                    crawl_data,
                    ai_contexts.get("architecture")
                )
            )
            
            # UX
            tasks_futures.append(
                ai_execution_plan.generate_ux_tasks(
                    lighthouse_data,
                    results.get("ux")
                )
            )
            
            # Security
            tasks_futures.append(
                ai_execution_plan.generate_security_tasks(
                    crawl_data,
                    results.get("security")
                )
            )
            
            # Execute all in parallel
            all_module_tasks = await asyncio.gather(*tasks_futures, return_exceptions=True)
            
            # Flatten results
            all_tasks = []
            for module_result in all_module_tasks:
                if isinstance(module_result, Exception):
                    logger.error(f"Task generation failed: {module_result}")
                elif isinstance(module_result, list):
                    all_tasks.extend(module_result)
            
            # Synthesize execution plan (dedup, tag quick wins, sort)
            synthesized_tasks = ai_execution_plan.synthesize_execution_plan(all_tasks)
            
            # Persist tasks to database (bulk insert)
            # If plan is regenerated, replace existing tasks for this audit.
            await db.execute(delete(AuditTask).where(AuditTask.audit_id == audit.id))

            task_objects = []
            for task_data in synthesized_tasks:
                # Normalize enums coming from LLM (it sometimes returns uppercase).
                priority_raw = task_data.get("priority", "medium")
                priority_value = str(priority_raw).strip().lower()
                if priority_value not in ("critical", "high", "medium", "low"):
                    priority_value = "medium"

                impact_raw = task_data.get("impact", "medium")
                impact_value = str(impact_raw).strip().lower()
                if impact_value not in ("high", "medium", "low"):
                    impact_value = "medium"

                effort_raw = task_data.get("effort", "medium")
                effort_value = str(effort_raw).strip().lower()
                if effort_value not in ("easy", "medium", "hard"):
                    effort_value = "medium"

                task_obj = AuditTask(
                    audit_id=audit.id,
                    module=task_data.get("module", "unknown"),
                    title=task_data.get("title", "Untitled task"),
                    description=task_data.get("description", ""),
                    category=task_data.get("category", "technical"),
                    priority=TaskPriority(priority_value),
                    impact=impact_value,
                    effort=effort_value,
                    is_quick_win=task_data.get("is_quick_win", False),
                    fix_data=task_data.get("fix_data"),
                    source=task_data.get("source", "execution_plan"),
                    sort_order=task_data.get("sort_order", 0),
                )
                task_objects.append(task_obj)
            
            # Bulk insert
            db.add_all(task_objects)
            # Force flush to catch enum/constraint issues before we set status=completed.
            await db.flush()
            
            duration = int((datetime.utcnow() - step_start).total_seconds() * 1000)
            
            audit.execution_plan_status = "completed"
            audit.processing_step = "execution_plan:done"
            await add_audit_log(
                audit,
                "execution_plan",
                "success",
                f"Generated {len(task_objects)} tasks ({sum(1 for t in task_objects if t.is_quick_win)} quick wins)",
                duration
            )
            
            await db.commit()

            # Re-index for RAG to include execution plan tasks (best-effort).
            async def _rag_index_bg(aid: str) -> None:
                try:
                    async with AsyncSessionLocal() as rag_db:
                        await index_audit_for_rag(rag_db, aid)
                        await rag_db.commit()
                except Exception as e:
                    logger.warning(
                        "RAG indexing failed after execution plan (audit_id=%s): %s",
                        aid,
                        e,
                    )

            asyncio.create_task(_rag_index_bg(audit_id))
            
            logger.info(f"✅ Phase 3 completed for audit {audit_id}: {len(task_objects)} tasks")
            
        except Exception as e:
            # If flush/commit failed, the session is in rollback-only state.
            await db.rollback()
            logger.error(f"❌ Phase 3 failed for audit {audit_id}: {e}")
            audit.execution_plan_status = "failed"
            audit.processing_step = "execution_plan:failed"
            await add_audit_log(audit, "execution_plan", "error", f"Execution plan generation failed: {str(e)}")
            await db.commit()


async def process_audit(audit_id: str) -> None:
    """Main entry point for processing an audit."""
    try:
        # Check if this is a resumed audit (Phase 1 already done, context saved/skipped)
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Audit).where(Audit.id == audit_id))
            audit = result.scalar_one_or_none()
            if not audit:
                logger.error(f"Audit {audit_id} not found")
                return

            phase1_done = audit.processing_step in ("context:saved", "context:skipped")
            should_run_ai = audit.run_ai_pipeline if audit else True
            should_run_execution_plan = audit.run_execution_plan if audit else True

        if phase1_done:
            # Resuming after context step — load tech data from saved results
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                tech_data = {
                    "crawl": (audit.results or {}).get("crawl", {}),
                    "lighthouse": (audit.results or {}).get("lighthouse", {}),
                    "senuto": (audit.results or {}).get("senuto", {}),
                    "technical_health_index": (audit.results or {}).get("technical_health_index"),
                    "visibility_momentum": (audit.results or {}).get("visibility_momentum"),
                    "traffic_estimation": (audit.results or {}).get("traffic_estimation"),
                    "content_quality_index": (audit.results or {}).get("content_quality_index"),
                }
                audit.status = AuditStatus.PROCESSING
                audit.processing_step = "phase2:resume"
                await add_audit_log(audit, "context", "success", "Resuming after business context step")
                await db.commit()
            logger.info(f"Resuming audit {audit_id} after context step (Phase 2+3)")
        else:
            # Fresh audit — run Phase 1 first
            tech_data = await run_technical_analysis(audit_id)

            # After Phase 1: pause for business context
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                if audit and not audit.crawl_blocked:
                    audit.status = AuditStatus.AWAITING_CONTEXT
                    audit.processing_step = "awaiting_context"
                    await add_audit_log(audit, "context", "waiting", "Awaiting business context from user (or skip)")
                    await db.commit()
                    logger.info(f"Audit {audit_id} paused for business context (status=awaiting_context)")
                    return  # Exit — worker will pick it up again after user saves/skips context

            # Re-read flags after Phase 1
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                should_run_ai = audit.run_ai_pipeline if audit else True
                should_run_execution_plan = audit.run_execution_plan if audit else True
        
        if should_run_ai:
            await run_ai_analysis(audit_id, tech_data)
        else:
            # Mark as completed without AI
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                if audit:
                    audit.ai_status = "skipped"
                    audit.status = AuditStatus.COMPLETED
                    audit.completed_at = datetime.utcnow()
                    audit.processing_step = "completed"
                    await add_audit_log(audit, "ai", "skipped", "AI pipeline disabled by user")
                    await db.commit()
        
        # Phase 3: Execution Plan (runs after Phase 2, unless disabled)
        if should_run_execution_plan:
            # HARD BLOCK: Phase 3 MUST NOT run if Phase 2 (AI Analysis) did not complete successfully
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                
                if audit and audit.ai_status != "completed":
                    # Block Phase 3 - AI Analysis did not complete
                    audit.execution_plan_status = "blocked"
                    await add_audit_log(
                        audit, 
                        "execution_plan", 
                        "blocked", 
                        f"Execution plan blocked: AI Analysis status is '{audit.ai_status}' (must be 'completed')"
                    )
                    await db.commit()
                    logger.warning(f"⛔ Phase 3 blocked for audit {audit_id}: AI status is '{audit.ai_status}', not 'completed'")
                else:
                    # AI completed successfully - proceed with Phase 3
                    await db.commit()
                    await run_execution_plan(audit_id, tech_data)
        else:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                if audit:
                    audit.execution_plan_status = "skipped"
                    await add_audit_log(audit, "execution_plan", "skipped", "Execution plan disabled by user")
                    await db.commit()
        
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
                    # Check credits before creating scheduled audit
                    from app.services.credit_service import check_credits, deduct_credits, calculate_audit_cost
                    competitors_count = len(schedule.competitors_urls or []) if schedule.include_competitors else 0
                    audit_cost = calculate_audit_cost(True, competitors_count)
                    has_credits = await check_credits(db, str(schedule.workspace_id), audit_cost)
                    if not has_credits:
                        logger.warning("Insufficient credits for scheduled audit %s (workspace %s, need %d kr)", schedule.id, schedule.workspace_id, audit_cost)
                        schedule.last_run_at = now
                        freq_map = {ScheduleFrequency.DAILY: timedelta(days=1), ScheduleFrequency.WEEKLY: timedelta(weeks=1), ScheduleFrequency.MONTHLY: timedelta(days=30)}
                        schedule.next_run_at = now + freq_map.get(schedule.frequency, timedelta(days=7))
                        await db.commit()
                        continue

                    new_audit = Audit(workspace_id=schedule.workspace_id, user_id=schedule.user_id, url=schedule.url, status=AuditStatus.PENDING)
                    db.add(new_audit)
                    await db.flush()
                    if schedule.include_competitors and schedule.competitors_urls:
                        for c_url in schedule.competitors_urls:
                            db.add(Competitor(audit_id=new_audit.id, url=c_url))

                    # Deduct credits
                    user_id = str(schedule.user_id) if schedule.user_id else "00000000-0000-0000-0000-000000000000"
                    await deduct_credits(db, str(schedule.workspace_id), user_id, audit_cost, "deduct_audit", {"audit_id": str(new_audit.id), "scheduled": True})

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
