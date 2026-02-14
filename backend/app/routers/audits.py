"""
Audit endpoints: CRUD operations for website audits.

Version: 2.0 (Workspace-based)
- Audits now belong to workspaces (not users)
- Subscription limits enforced per workspace
- RLS-like access control via Supabase
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Audit, Competitor, AuditStatus
from app.schemas import (
    AuditCreate,
    AuditResponse,
    AuditListResponse,
    AuditStatusResponse,
    AuditUpdate,
    FixSuggestionRequest,
    FixSuggestionResponse,
    PageAnalysisRequest,
    PageAnalysisResponse,
    AltTextRequest,
    AltTextResponse,
)
from app.auth_supabase import get_current_user, verify_workspace_access
from app.lib.supabase import supabase, get_workspace_subscription, increment_audit_usage, check_audit_limit
from app.services.pdf_generator import generate_pdf
from app.services.data_exporter import export_raw_data
from app.services.ai_analysis import (
    generate_fix_suggestion, analyze_single_page, generate_quick_wins, generate_alt_text,
    analyze_seo_context, analyze_performance_context, analyze_visibility_context,
    analyze_backlinks_context, analyze_links_context, analyze_images_context,
    analyze_cross_tool, generate_roadmap, generate_executive_summary, analyze_ai_overviews_context,
    aggregate_quick_wins_from_results,
)
from app.services.screaming_frog import _detect_sitemaps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audits", tags=["Audits"])

def _normalize_senuto_for_response(results: Any) -> None:
    """Patch Senuto payload shape for backwards compatibility in API responses."""
    if not isinstance(results, dict):
        return
    senuto = results.get("senuto")
    if not isinstance(senuto, dict):
        return

    backlinks = senuto.get("backlinks")
    if not isinstance(backlinks, dict):
        return

    stats = backlinks.get("statistics")
    if not isinstance(stats, dict):
        stats = {}

    bl_list = backlinks.get("list")
    if not isinstance(bl_list, list):
        bl_list = []

    ref_domains = backlinks.get("ref_domains")
    if not isinstance(ref_domains, list):
        ref_domains = []

    stats.setdefault("backlinks_count", len(bl_list))
    stats.setdefault("domains_count", len(ref_domains))
    stats.setdefault("ref_domains_count", len(ref_domains))
    backlinks["statistics"] = stats


async def _normalize_crawl_for_response(results: Any, audit_url: str, audit_status: AuditStatus) -> None:
    """Enrich crawl payload for completed audits (sitemap detection)."""
    if audit_status != AuditStatus.COMPLETED:
        return
    if not isinstance(results, dict):
        return
    crawl = results.get("crawl")
    if not isinstance(crawl, dict):
        return

    # If crawl says "no sitemap", double-check via robots + common endpoints.
    if crawl.get("has_sitemap") or crawl.get("sitemap_url") or crawl.get("sitemaps"):
        return

    try:
        info = await _detect_sitemaps(audit_url)
        crawl["has_sitemap"] = bool(info.get("has_sitemap"))
        if info.get("sitemap_url"):
            crawl["sitemap_url"] = info.get("sitemap_url")
        if info.get("sitemaps") is not None:
            crawl["sitemaps"] = info.get("sitemaps")
    except Exception:
        # Never fail audit fetch due to best-effort enrichment.
        return


@router.post("", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(
    audit_data: AuditCreate,
    workspace_id: str = Query(..., description="Workspace ID to create audit in"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Audit:
    """
    Create a new website audit in a workspace.
    
    - **url**: Website URL to audit (required)
    - **competitors**: List of up to 3 competitor URLs (optional)
    - **workspace_id**: Workspace to create audit in (required query param)
    
    The audit will be processed asynchronously by the worker.
    
    Returns:
        Created audit object with status='pending'
    
    Raises:
        403: If user is not a member of the workspace
        402: If workspace audit limit reached
    """
    # 1. Verify workspace membership
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # 2. Check subscription limits
    can_create = await check_audit_limit(workspace_id)
    if not can_create:
        subscription = await get_workspace_subscription(workspace_id)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Audit limit reached ({subscription['audit_limit']} audits/month). Upgrade to Pro for more audits."
        )
    
    # 3. Create audit
    new_audit = Audit(
        workspace_id=workspace_id,
        user_id=None,  # Legacy field, not used for workspace-based audits
        url=audit_data.url,
        status=AuditStatus.PENDING,
        senuto_country_id=audit_data.senuto_country_id,
        senuto_fetch_mode=audit_data.senuto_fetch_mode,
        run_ai_pipeline=audit_data.run_ai_pipeline if audit_data.run_ai_pipeline is not None else True,
        run_execution_plan=audit_data.run_execution_plan if audit_data.run_execution_plan is not None else True,
    )
    
    db.add(new_audit)
    await db.flush()  # Get audit ID
    
    # 4. Create competitor records
    for competitor_url in audit_data.competitors:
        competitor = Competitor(
            audit_id=new_audit.id,
            url=competitor_url,
        )
        db.add(competitor)
    
    await db.commit()
    await db.refresh(new_audit)
    
    # 5. Increment workspace audit usage
    await increment_audit_usage(workspace_id)
    
    # 6. Load competitors relationship
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == new_audit.id)
    )
    audit_with_competitors = result.scalar_one()
    
    logger.info(f"✅ Created audit {new_audit.id} for workspace {workspace_id}")
    
    return audit_with_competitors


@router.get("", response_model=AuditListResponse)
async def list_audits(
    workspace_id: str = Query(..., description="Workspace ID to list audits from"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[AuditStatus] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all audits for a workspace with pagination.
    
    - **workspace_id**: Workspace ID (required query param)
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    - **status**: Filter by audit status (optional)
    
    Returns:
        Paginated list of audits
    
    Raises:
        403: If user is not a member of the workspace
    """
    # Verify workspace membership
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Build query
    query = select(Audit).where(Audit.workspace_id == workspace_id)
    
    if status:
        query = query.where(Audit.status == status)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = (
        query
        .options(selectinload(Audit.competitors))
        .order_by(desc(Audit.created_at))
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    audits = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": audits,
    }


@router.get("/history", response_model=List[AuditResponse])
async def get_audit_history(
    url: str = Query(..., description="Website URL to get history for"),
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Audit]:
    """
    Get audit history for a specific URL in a workspace.
    
    Returns:
        List of audits for the same URL, ordered by date desc
    """
    # Verify workspace membership
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Query audits for the same URL in the same workspace
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.workspace_id == workspace_id)
        .where(Audit.url == url)
        .where(Audit.status == AuditStatus.COMPLETED)
        .order_by(desc(Audit.created_at))
    )
    audits = result.scalars().all()
    
    return audits


@router.get("/{audit_id}", response_model=AuditResponse)
async def get_audit(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get a specific audit by ID.
    
    Returns:
        Audit object with full details and results
        
    Raises:
        404: If audit not found
        403: If user is not a member of the workspace
    """
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Check workspace membership
    if audit.workspace_id:
        has_access = await verify_workspace_access(current_user["id"], audit.workspace_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    else:
        # Legacy audit (user_id based) - check user ownership
        if audit.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    
    # Enrich with progress + processing logs for the UI progress window.
    # Frontend polls this endpoint while audit is running.
    payload = AuditResponse.model_validate(audit).model_dump()
    payload["processing_step"] = audit.processing_step
    payload["processing_logs"] = audit.processing_logs
    payload["ai_status"] = audit.ai_status
    payload["progress_percent"] = _calculate_progress(audit.processing_step, audit.status)

    # Backwards-compatible normalization for older stored payload shapes.
    results = payload.get("results")
    _normalize_senuto_for_response(results)
    await _normalize_crawl_for_response(results, audit.url, audit.status)
    return payload


@router.get("/{audit_id}/status", response_model=AuditStatusResponse)
async def get_audit_status(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get audit status (for polling).
    
    Returns lightweight status information without full results.
    Useful for frontend polling while audit is processing.
    
    Returns:
        Audit status and basic info
        
    Raises:
        404: If audit not found
        403: If user is not a member of the workspace
    """
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Check workspace membership (same as get_audit)
    if audit.workspace_id:
        has_access = await verify_workspace_access(current_user["id"], audit.workspace_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    else:
        # Legacy audit
        if audit.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    
    return {
        "id": audit.id,
        "status": audit.status,
        "processing_step": audit.processing_step,
        "overall_score": audit.overall_score,
        "error_message": audit.error_message,
        "completed_at": audit.completed_at,
        "processing_logs": audit.processing_logs,
        "ai_status": audit.ai_status,
        "execution_plan_status": audit.execution_plan_status,
        "progress_percent": _calculate_progress(audit.processing_step, audit.status)
    }

def _calculate_progress(step: Optional[str], status: AuditStatus) -> int:
    """Calculate progress percentage based on step and status."""
    if status == AuditStatus.COMPLETED:
        return 100
    if status == AuditStatus.FAILED:
        return 0
    if not step:
        return 5
    
    progress_map = {
        "crawl:start": 10,
        "crawl:done": 20,
        "lighthouse:start": 22,
        "lighthouse:done": 40,
        "senuto:start": 42,
        "senuto:done": 48,
        "competitors:start": 49,
        "competitors:done": 55,
        "ai_content:start": 57,
        "ai_content:done": 63,
        "ai_parallel:start": 64,
        "ai_parallel:done": 72,
        "ai_strategic:start": 73,
        "ai_strategic:done": 78,
        "ai_contexts:start": 80,
        "ai_contexts:done": 90,
        "ai_strategy:start": 91,
        "ai_strategy:done": 97,
        "finalizing": 98,
        "completed": 100
    }
    
    return progress_map.get(step, 10)


@router.delete("/{audit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audit(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete an audit.
    
    Cascades to delete associated competitors.
    Only owners and admins can delete audits.
    
    Raises:
        404: If audit not found
        403: If user is not authorized (needs admin/owner role)
    """
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Prevent deletion of audits that are currently processing
    if audit.status in (AuditStatus.PENDING, AuditStatus.PROCESSING):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete audit that is currently processing. Please wait for completion or cancel it first."
        )
    
    # Check workspace membership with admin role required
    if audit.workspace_id:
        has_access = await verify_workspace_access(
            current_user["id"], 
            audit.workspace_id, 
            required_role="admin"  # Need admin or owner to delete
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this audit (admin role required)"
            )
    else:
        # Legacy audit
        if audit.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this audit"
            )
    
    # Delete audit - cascade will handle competitors and tasks via ON DELETE CASCADE
    await db.delete(audit)
    await db.commit()
    
    logger.info(f"Audit {audit_id} deleted successfully by user {current_user['id']}")


@router.get("/{audit_id}/raw")
async def download_raw_data(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """
    Download raw audit data as ZIP.
    """
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check workspace membership
    if audit.workspace_id:
        has_access = await verify_workspace_access(current_user["id"], audit.workspace_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    else:
        # Legacy audit
        if audit.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
        
    if audit.status != AuditStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Audit not completed yet")
        
    try:
        # Reconstruct audit data dict (similar to PDF endpoint)
        audit_data = {
            "id": str(audit.id),
            "url": audit.url,
            "status": audit.status.value,
            "overall_score": audit.overall_score,
            "seo_score": audit.seo_score,
            "performance_score": audit.performance_score,
            "content_score": audit.content_score,
            "is_local_business": audit.is_local_business,
            "results": audit.results or {},
            "created_at": audit.created_at.isoformat(),
            "competitors": [
                {"url": c.url, "status": c.status.value, "results": c.results or {}}
                for c in audit.competitors
            ]
        }
        
        zip_path = export_raw_data(str(audit_id), audit_data)
        
        # Add CORS headers manually for FileResponse
        response = FileResponse(
            path=zip_path,
            filename=f"audit_{audit_id}_raw.zip",
            media_type="application/zip"
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")


@router.get("/{audit_id}/pdf")
async def download_audit_pdf(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """
    Download PDF report for an audit.
    """
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check workspace membership
    if audit.workspace_id:
        has_access = await verify_workspace_access(current_user["id"], audit.workspace_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
    else:
        # Legacy audit
        if audit.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit"
            )
        
    if audit.status != AuditStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Audit not completed yet")
        
    try:
        # Prepare audit data for PDF generator
        audit_data = {
            "id": str(audit.id),
            "url": audit.url,
            "status": audit.status.value,
            "overall_score": audit.overall_score,
            "seo_score": audit.seo_score,
            "performance_score": audit.performance_score,
            "content_score": audit.content_score,
            "is_local_business": audit.is_local_business,
            "created_at": audit.created_at,
            "results": audit.results or {},
            "competitors": [
                {"url": c.url, "status": c.status.value, "results": c.results or {}}
                for c in audit.competitors
            ]
        }
        
        pdf_path = await generate_pdf(str(audit_id), audit_data)
        
        # Add CORS headers manually for FileResponse
        response = FileResponse(
            path=pdf_path,
            filename=f"sitespector_audit_{audit_id}.pdf",
            media_type="application/pdf"
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")


@router.post("/{audit_id}/fix-suggestion", response_model=FixSuggestionResponse)
async def get_fix_suggestion(
    audit_id: UUID,
    request: FixSuggestionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get AI-generated fix suggestion for a specific SEO issue.
    """
    # Verify access
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return await generate_fix_suggestion(request.issue_type, request.urls)


@router.post("/{audit_id}/analyze-pages", response_model=Dict[int, PageAnalysisResponse])
async def analyze_audit_pages(
    audit_id: UUID,
    request: PageAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Perform deep AI analysis on specific pages of an audit.
    """
    # Verify access
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not audit.results or "crawl" not in audit.results or "all_pages" not in audit.results["crawl"]:
        raise HTTPException(status_code=400, detail="Audit data missing")
    
    all_pages = audit.results["crawl"]["all_pages"]
    analyses = {}
    
    # Limit to 10 pages per request for performance/cost
    indices = request.page_indices[:10]
    
    for idx in indices:
        if 0 <= idx < len(all_pages):
            page_data = all_pages[idx]
            analyses[idx] = await analyze_single_page(page_data)
            
    # Save results back to audit (caching)
    if "page_analyses" not in audit.results:
        audit.results["page_analyses"] = {}
    
    for idx, analysis in analyses.items():
        audit.results["page_analyses"][str(idx)] = analysis
        
    # Mark as modified for SQLAlchemy
    from sqlalchemy.orm.attributes import flag_modified
    audit.results = dict(audit.results)
    flag_modified(audit, "results")
    
    await db.commit()
    
    return analyses


@router.get("/{audit_id}/quick-wins", response_model=List[Dict[str, Any]])
async def get_quick_wins(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """
    Get AI-prioritized Quick Wins for an audit.
    """
    # Verify access
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    results = audit.results or {}
    cached_quick_wins = results.get("quick_wins", []) if isinstance(results, dict) else []
    aggregated_quick_wins = aggregate_quick_wins_from_results(results, max_items=24)

    # Prefer unified aggregated quick wins (from AI Strategy modules) when available.
    if aggregated_quick_wins and len(aggregated_quick_wins) >= len(cached_quick_wins):
        if not audit.results:
            audit.results = {}
        audit.results["quick_wins"] = aggregated_quick_wins
        from sqlalchemy.orm.attributes import flag_modified
        audit.results = dict(audit.results)
        flag_modified(audit, "results")
        await db.commit()
        return aggregated_quick_wins

    if cached_quick_wins:
        return cached_quick_wins
    
    # Generate new ones
    audit_data = {
        "results": audit.results
    }
    quick_wins = await generate_quick_wins(audit_data)
    
    # Cache them
    if not audit.results:
        audit.results = {}
    audit.results["quick_wins"] = quick_wins
    
    from sqlalchemy.orm.attributes import flag_modified
    audit.results = dict(audit.results)
    flag_modified(audit, "results")
    await db.commit()
    
    return quick_wins


@router.post("/{audit_id}/generate-alt", response_model=AltTextResponse)
async def post_generate_alt(
    audit_id: UUID,
    request: AltTextRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Generate ALT text for an image using AI.
    """
    # Verify access
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    alt_text = await generate_alt_text(request.image_url)
    return {"alt_text": alt_text}


@router.post("/{audit_id}/run-ai")
async def trigger_ai_analysis(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Manually trigger AI analysis for a completed audit.
    Runs the full AI pipeline including contextual analyses.
    """
    import asyncio
    from worker import run_ai_analysis as worker_run_ai
    
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if audit.status != AuditStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Audit must be completed first")
    
    if audit.ai_status == "processing":
        raise HTTPException(status_code=409, detail="AI analysis already in progress")
    
    # Launch in background
    tech_data = {
        "crawl": audit.results.get("crawl", {}),
        "lighthouse": audit.results.get("lighthouse", {}),
        "senuto": audit.results.get("senuto", {}),
    }
    asyncio.create_task(worker_run_ai(str(audit_id), tech_data))
    
    return {"status": "ai_started", "message": "Analiza AI uruchomiona w tle"}


@router.post("/{audit_id}/run-ai-context")
async def trigger_ai_context(
    audit_id: UUID,
    area: Optional[str] = Query(None, description="Specific area to re-analyze (seo, performance, visibility, backlinks, links, images)"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Manually trigger contextual AI analysis for specific area(s).
    Use to regenerate per-area insights without re-running full pipeline.
    """
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not audit.results:
        raise HTTPException(status_code=400, detail="No audit data available")
    
    crawl_data = audit.results.get("crawl", {})
    lighthouse_data = audit.results.get("lighthouse", {})
    senuto_data = audit.results.get("senuto", {})
    from app.services.global_context import build_global_snapshot
    global_snapshot = build_global_snapshot(
        crawl=crawl_data,
        lighthouse=lighthouse_data,
        senuto=senuto_data,
        extra={"source": "trigger_ai_context"},
    )
    
    valid_areas = ["seo", "performance", "visibility", "ai_overviews", "backlinks", "links", "images"]
    areas_to_run = [area] if area and area in valid_areas else valid_areas
    
    import asyncio
    
    tasks = {}
    for a in areas_to_run:
        if a == "seo":
            tasks[a] = analyze_seo_context(crawl_data, lighthouse_data, senuto_data, global_snapshot=global_snapshot)
        elif a == "performance":
            tasks[a] = analyze_performance_context(
                lighthouse_data.get("desktop", {}),
                lighthouse_data.get("mobile", {}),
                crawl_data,
                global_snapshot=global_snapshot,
            )
        elif a == "visibility" and senuto_data.get("visibility"):
            tasks[a] = analyze_visibility_context(
                senuto_data["visibility"],
                crawl_data,
                ai_overviews_data=senuto_data.get("visibility", {}).get("ai_overviews", {}),
                global_snapshot=global_snapshot,
            )
        elif a == "ai_overviews" and senuto_data.get("visibility", {}).get("ai_overviews"):
            tasks[a] = analyze_ai_overviews_context(
                senuto_data["visibility"].get("ai_overviews", {}),
                crawl_data,
                global_snapshot=global_snapshot,
            )
        elif a == "backlinks" and senuto_data.get("backlinks"):
            tasks[a] = analyze_backlinks_context(
                senuto_data["backlinks"], crawl_data, global_snapshot=global_snapshot
            )
        elif a == "links":
            tasks[a] = analyze_links_context(crawl_data, global_snapshot=global_snapshot)
        elif a == "images":
            tasks[a] = analyze_images_context(crawl_data, global_snapshot=global_snapshot)
    
    if not tasks:
        return {"status": "skipped", "message": "No valid areas to analyze"}
    
    task_names = list(tasks.keys())
    task_results = await asyncio.gather(*[tasks[n] for n in task_names], return_exceptions=True)
    
    # Update results
    results = dict(audit.results)
    if "ai_contexts" not in results:
        results["ai_contexts"] = {}
    
    for name, res in zip(task_names, task_results):
        if isinstance(res, Exception):
            logger.error(f"Context re-analysis {name} failed: {res}")
        else:
            results["ai_contexts"][name] = res
    
    # Also regenerate cross-tool, roadmap, summary if full re-run
    if not area:
        try:
            cross_tool = await analyze_cross_tool(results, global_snapshot=global_snapshot)
            roadmap = await generate_roadmap(results, global_snapshot=global_snapshot)
            exec_summary = await generate_executive_summary(results, global_snapshot=global_snapshot)
            results["cross_tool"] = cross_tool
            results["roadmap"] = roadmap
            results["executive_summary"] = exec_summary
            results["quick_wins"] = aggregate_quick_wins_from_results(results, max_items=24)
        except Exception as e:
            logger.error(f"Strategy re-generation failed: {e}")
    
    audit.results = results
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(audit, "results")
    await db.commit()
    
    return {
        "status": "completed",
        "areas_analyzed": task_names,
        "message": f"Przeanalizowano {len(task_names)} obszarów"
    }


@router.post("/{audit_id}/run-execution-plan")
async def trigger_execution_plan(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Manually trigger execution plan generation for a completed audit.
    Generates concrete, actionable tasks with implementation instructions.
    """
    import asyncio
    from worker import run_execution_plan as worker_run_execution_plan
    
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(audit.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if audit.status != AuditStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Audit must be completed first")
    
    if audit.execution_plan_status == "processing":
        raise HTTPException(status_code=409, detail="Execution plan generation already in progress")
    
    # Prepare tech data
    tech_data = {
        "crawl": audit.results.get("crawl", {}),
        "lighthouse": audit.results.get("lighthouse", {}),
        "senuto": audit.results.get("senuto", {}),
    }
    
    # Launch in background
    asyncio.create_task(worker_run_execution_plan(str(audit_id), tech_data))
    
    return {"status": "execution_plan_started", "message": "Generowanie planu wykonania uruchomione w tle"}

