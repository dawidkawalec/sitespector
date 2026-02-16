"""
One-time migration: group existing audits by domain and create projects.

Run AFTER:
- Supabase schema has projects + project_members tables
- VPS PostgreSQL has project_id on audits and audit_schedules

This script:
1. Reads all audits from VPS that have workspace_id and no project_id
2. Normalizes URL to domain (strip www, protocol, path)
3. Groups by (workspace_id, domain)
4. For each group: creates project in Supabase (name=domain, url=domain, created_by=workspace owner)
5. Updates VPS audits: set project_id
6. Updates VPS audit_schedules: match by URL domain, set project_id

Usage (from repo root):
  cd backend && python -c "
  import asyncio
  import sys
  sys.path.insert(0, '.')
  from scripts.migrate_projects import run_migrate
  asyncio.run(run_migrate())
  "
Or from backend: python -m scripts.migrate_projects (if __main__)
"""

from __future__ import annotations

import asyncio
import re
import sys
from pathlib import Path
from collections import defaultdict
from uuid import UUID

# Add backend to path when run from repo root
backend = Path(__file__).resolve().parent.parent / "backend"
if backend.exists():
    sys.path.insert(0, str(backend))

from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import Audit, AuditSchedule
from app.lib.supabase import supabase


def normalize_domain(url: str) -> str:
    """Extract domain from URL and normalize (lowercase, no www)."""
    if not url or not url.strip():
        return ""
    s = url.strip().lower()
    # Remove protocol
    for prefix in ("https://", "http://"):
        if s.startswith(prefix):
            s = s[len(prefix) :]
            break
    # Remove path and query
    s = s.split("/")[0].split("?")[0]
    # Remove www.
    if s.startswith("www."):
        s = s[4:]
    return s or ""


async def run_migrate() -> None:
    print("=" * 60)
    print("SiteSpector: Migrate audits to projects (by domain)")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # 1. Audits with workspace_id and no project_id
        result = await db.execute(
            select(Audit).where(
                Audit.workspace_id.isnot(None),
                Audit.project_id.is_(None),
            )
        )
        audits = result.scalars().all()
        print(f"Found {len(audits)} audits without project_id")

        if not audits:
            print("Nothing to migrate.")
            return

        # 2. Group by (workspace_id, domain)
        groups: dict[tuple[str, str], list[Audit]] = defaultdict(list)
        for a in audits:
            domain = normalize_domain(a.url)
            if not domain:
                continue
            key = (str(a.workspace_id), domain)
            groups[key].append(a)

        print(f"Grouped into {len(groups)} (workspace, domain) pairs")

        # 3. Get workspace owners from Supabase
        workspace_ids = {k[0] for k in groups}
        ws_owners: dict[str, str] = {}
        for wid in workspace_ids:
            r = supabase.table("workspaces").select("owner_id").eq("id", wid).execute()
            if r.data and len(r.data) > 0:
                ws_owners[wid] = r.data[0].get("owner_id")

        created = 0
        for (workspace_id, domain), group_audits in groups.items():
            owner_id = ws_owners.get(workspace_id)
            # Create project in Supabase
            ins = (
                supabase.table("projects")
                .insert(
                    {
                        "workspace_id": workspace_id,
                        "name": domain,
                        "url": f"https://{domain}",
                        "description": None,
                        "created_by": owner_id,
                    }
                )
                .execute()
            )
            if not ins.data or len(ins.data) == 0:
                print(f"  Skip {domain}: failed to create project")
                continue
            project_id = ins.data[0]["id"]
            created += 1
            # Update VPS audits
            audit_ids = [a.id for a in group_audits]
            await db.execute(
                update(Audit).where(Audit.id.in_(audit_ids)).values(project_id=UUID(project_id))
            )
            print(f"  {domain}: project {project_id}, {len(group_audits)} audits")

        await db.commit()
        print(f"Created {created} projects and linked audits.")

        # 4. Migrate audit_schedules: set project_id by matching URL domain
        sched_result = await db.execute(
            select(AuditSchedule).where(
                AuditSchedule.workspace_id.isnot(None),
                AuditSchedule.project_id.is_(None),
            )
        )
        schedules = sched_result.scalars().all()
        print(f"Found {len(schedules)} schedules without project_id")

        for s in schedules:
            domain = normalize_domain(s.url)
            if not domain:
                continue
            # Find project for this workspace + domain
            r = (
                supabase.table("projects")
                .select("id")
                .eq("workspace_id", str(s.workspace_id))
                .eq("url", f"https://{domain}")
                .execute()
            )
            if r.data and len(r.data) > 0:
                project_id = r.data[0]["id"]
                await db.execute(
                    update(AuditSchedule)
                    .where(AuditSchedule.id == s.id)
                    .values(project_id=UUID(project_id))
                )
                print(f"  Schedule {s.id} -> project {project_id}")

        await db.commit()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(run_migrate())
