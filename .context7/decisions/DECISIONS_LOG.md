# Architectural Decisions Log

## 📜 Landing Page Expansion & Public API (Feb 2026)
- **Decision**: Expanded the landing page into a full marketing site with blog, documentation, legal pages, and case studies.
- **Decision**: Renamed `demosite/` to `landing/` to match service naming.
- **Decision**: Added public API endpoints for contact and newsletter forms in FastAPI.
- **Rationale**: Improve SEO, build trust, and provide comprehensive information to potential customers.
- **Outcome**: 12 new public routes added, served by the `landing` container. Public API functional with validation.

## 📜 Monorepo Cleanup & Context7 Canonicalization (Feb 2026)
- **Decision**: Moved all architectural plans to `.cursor/plans/` and removed the legacy `docs/` folder.
- **Rationale**: Maintain a clean root directory and ensure `.context7/` is the only source of truth for documentation.
- **Outcome**: Root directory simplified, documentation centralized.

## 📜 Documentation Cleanup (Feb 2026)
- **Decision**: Canonical documentation moved to `.context7/`.
- **Rationale**: Ensure AI agents have a single, up-to-date source of truth.
- **Outcome**: `docs/` folder reduced to public/marketing materials. `.context7/INDEX.md` created.

## 🎨 Unified Context-Aware Sidebar (Feb 2026)
- **Decision**: Implement a single `UnifiedSidebar` that handles all navigation contexts.
- **Rationale**: Improve UX consistency and eliminate duplicate menu items.
- **Outcome**: Replaced separate sidebars for dashboard, settings, and audits.

## 🚀 SaaS Transformation (Feb 2025)
- **Decision**: Use Supabase for Auth, User Management, Teams + Stripe for Billing.
- **Rationale**: Built-in RLS for data isolation and faster development.
- **Outcome**: Dual-database strategy (Supabase for SaaS, VPS for audits).

---

## ADR-001: Use PostgreSQL with JSONB for Audit Results
**Date**: 2024-12-01
**Status**: ✅ Accepted
**Decision**: Use single JSONB column (`audits.results`) to store all audit data.
**Rationale**: Schema flexibility and simpler queries.

---

## ADR-002: Async Python with FastAPI
**Date**: 2024-12-01
**Status**: ✅ Accepted
**Decision**: Use FastAPI with async/await throughout.
**Rationale**: High concurrency for I/O-bound audit processing.

---

## ADR-003: Worker as Polling Loop (Not Queue)
**Date**: 2024-12-05
**Status**: ✅ Accepted
**Decision**: Worker polls database every 10 seconds for PENDING audits.
**Rationale**: Simple infrastructure, sufficient for MVP.

---

## ADR-004: Docker Exec for External Tools
**Date**: 2024-12-05
**Status**: ✅ Accepted
**Decision**: Run Screaming Frog and Lighthouse in separate containers, exec via Docker socket.
**Rationale**: Isolation and resource limits.

---

## ADR-005: Next.js Standalone Build for Frontend
**Date**: 2024-12-10
**Status**: ✅ Accepted
**Decision**: Use Next.js standalone output.
**Rationale**: Optimized for Docker images.

---

## ADR-006: Let's Encrypt SSL (Migration from Self-signed)
**Date**: 2026-02-08
**Status**: ✅ Done
**Decision**: Use Let's Encrypt via Certbot for sitespector.app.
**Rationale**: Production readiness and security.

---

## ADR-007: Google Gemini over OpenAI GPT
**Date**: 2024-12-20
**Status**: ✅ Accepted
**Decision**: Use Google Gemini (gemini-3-flash).
**Rationale**: Cost-effective and fast for structured analysis.

---

## ADR-008: VPS-Only Development (No Local Docker)
**Date**: 2024-12-22
**Status**: ✅ Accepted
**Decision**: All Docker runs on VPS only, code locally in Cursor.
**Rationale**: Simpler setup and production-like testing.

---

## ADR-009: Git Auto-Commit Allowed, Auto-Push Forbidden
**Date**: 2025-01-05
**Status**: ✅ Accepted
**Decision**: Agent can auto-commit, but MUST ask before pushing.
**Rationale**: User control over deployment.

---

## ADR-010: Context7 for Project Documentation
**Date**: 2025-02-01
**Status**: ✅ Accepted
**Decision**: Use `.context7/` folder with structured markdown files.
**Rationale**: Single source of truth for AI agents.

---

## ADR-011: TanStack Query over Redux
**Date**: 2024-12-12
**Status**: ✅ Accepted
**Decision**: Use TanStack Query for server state.
**Rationale**: Automatic caching and polling support.

---

## ADR-012: shadcn/ui over Material UI
**Date**: 2024-12-13
**Status**: ✅ Accepted
**Decision**: Use shadcn/ui components.
**Rationale**: Full control over code and modern design.

---

## ADR-013: Next.js 14 Route Groups for Layout Consistency
**Date**: 2026-02-04
**Status**: ✅ Accepted
**Decision**: Use `(app)` route group for all authenticated pages.
**Rationale**: Consistent sidebar layout across dashboard and audits.

---

## ADR-014: Simple RLS Policies to Avoid Infinite Recursion
**Date**: 2026-02-04
**Status**: ✅ Accepted
**Decision**: Use direct comparisons like `user_id = auth.uid()`.
**Rationale**: Fix performance and recursion issues in Supabase.

---

## ADR-015: Senuto Integration & Enhanced Technical Data
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Integrate Senuto API for Visibility and Backlinks. Expand Screaming Frog to multi-tab exports. Save raw Lighthouse JSON.
**Rationale**: Provide "complete" technical data set before AI strategy phase.
**Outcome**: 15 new Senuto endpoints in pipeline, 10 SF tabs, full LH raw data, 2 new frontend pages.

---

## ADR-016: Split Layout + Contextual AI per Area
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Every audit data page uses a split layout (data left, AI insights panel right). AI pipeline generates per-area contextual analyses stored in `results.ai_contexts.*`. New `/ai-strategy` page provides full duplicate of all AI insights + executive summary + roadmap + cross-tool correlations.
**Rationale**: Users need both raw data and AI context visible simultaneously. The AI strategy page aggregates everything for client-facing use.
**Key Components**:
- `AuditPageLayout` - reusable split layout wrapper (collapsible, localStorage state)
- `AiInsightsPanel` - reusable AI panel (key findings, recommendations, quick wins, priority issues)
- `DataExplorerTable` - reusable paginated/searchable/sortable/exportable table
- 9 new AI analysis functions (6 per-area + cross_tool + roadmap + executive_summary)
- AI pipeline toggle (`run_ai_pipeline` column) + manual trigger endpoints
- Sidebar restructured: DANE AUDYTU / STRATEGIA AI / RAPORTY

---

## ADR-017: AI Pipeline Toggle (Option B)
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: AI pipeline runs automatically by default but can be toggled off in New Audit dialog. Manual trigger available via `POST /api/audits/{id}/run-ai` and `POST /api/audits/{id}/run-ai-context`.
**Rationale**: Allows quick technical-only audits when AI budget/time is a concern, while still supporting on-demand AI analysis later.

---

## ADR-018: Tool-Agnostic Information Architecture (IA)
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Removed all tool-specific names (Screaming Frog, Lighthouse, Senuto) from the UI. Consolidated data into logical SEO areas: SEO, Wydajność, Widoczność, Linki, Obrazy. Every area now includes a "Surowe dane (RAW)" explorer.
**Rationale**: Improve UX by focusing on SEO outcomes rather than tools. Provide "complete" data access via RAW explorers with search, sort, and export.
**Outcome**:
- Sidebar restructured without tool names.
- 5 main areas with Overview + RAW tabs.
- Automated pagination for Senuto datasets (up to 500-1000 items).
- Legacy routes (`/backlinks`, `/lighthouse-data`) redirected to new IA.

---

## ADR-019: Reproducible Screaming Frog Image for Crawl Merge Step
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Explicitly copy `merge_csvs.py` into the Screaming Frog image and install `python3` as a declared runtime dependency.
**Rationale**: Prevent non-deterministic `crawl:start` failures caused by missing helper scripts after clean rebuilds.
**Outcome**:
- `docker/screaming-frog/Dockerfile` includes:
  - `COPY merge_csvs.py /usr/local/bin/merge_csvs.py`
  - explicit `python3` in apt packages
- VPS deploy standard now uses `docker compose build --no-cache` for critical crawler/frontend fixes.

---

## ADR-020: AI Fallback Contract + In-Progress UX State
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**:
- Standardize AI fallback payload schema in `ai_client` so contextual and strategy analyzers receive expected keys.
- Expose and consume `ai_status`/`processing_step` on frontend to show explicit "AI analysis in progress" states.
**Rationale**:
- Audits could appear as `completed` while AI results were effectively empty due to schema mismatch in fallback responses.
- Users need deterministic status visibility instead of ambiguous empty panels.
**Outcome**:
- Added AI diagnostics checkpoints in worker/services logs.
- Updated frontend polling logic to continue while `ai_status="processing"`.
- Added in-progress banners/panel states on `ai-strategy` and area pages.

---

**Last Updated**: 2026-02-11
**Total Decisions**: 20 accepted
**Review**: Update when making significant architectural changes.
