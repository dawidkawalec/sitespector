# SiteSpector - Project History

## 📜 Evolution

### v1.0 - POC (2024)
- Basic SEO audit with Screaming Frog.
- Performance audit with Lighthouse.
- Simple JWT-based authentication.
- Single-user architecture.

### v2.0 - SaaS Transformation (Feb 2025)
- **Multi-tenancy**: Introduced Workspaces and Teams.
- **Auth**: Migrated to Supabase Auth (OAuth, Magic Links).
- **Billing**: Integrated Stripe for subscriptions.
- **Infrastructure**: Professional domain (sitespector.app) and Let's Encrypt SSL.
- **UI**: Modern sidebar layout and dark mode.

### IDE Migration (Feb 2026)
- Brief migration to KiloCode.
- Returned to **Cursor** as the primary development environment.
- Documentation cleanup and Context7 reorganization.

### Senuto Full Data Release (Feb 2026)
- Expanded Senuto ingestion from capped subset to high-cap full payload strategy.
- Added new `AI Overviews` module in frontend (`/audits/[id]/ai-overviews`).
- Upgraded Visibility module with advanced tabs, feature-distribution charts, sections detail, and cannibalization extensions.
- Added new UI primitives for intent, difficulty, and SERP features.
- Added large-table virtualization support for heavy datasets.
- Updated worker pipeline with `senuto_extended` diagnostics and AIO AI context.
