# SiteSpector — Content Architecture

## Overview

Content is managed as files in `landing/content/` — a hybrid of **JSON** (structured data) and **Markdown** (long-form content). Components read from these files via helper functions in `landing/src/lib/content.ts`.

## Architecture: Hybrid Markdown + JSON

```
landing/content/
├── data/                     # JSON — structured/repeatable data
│   ├── hero.json             # Hero section
│   ├── about-features.json   # Feature cards ("Dlaczego SiteSpector")
│   ├── features.json         # Features section ("Mozliwosci")
│   ├── services.json         # Services/metrics
│   ├── pricing.json          # Pricing plans
│   ├── testimonials.json     # Testimonials
│   ├── faq.json              # FAQ items
│   ├── counter.json          # Stats counters
│   ├── trust-badges.json     # Security badges
│   ├── brands.json           # Technology brands
│   ├── integrations.json     # Integrations
│   ├── demo.json             # Demo video section
│   ├── cta.json              # CTA contact info
│   ├── navigation.json       # Topbar + Footer links
│   └── metadata.json         # Per-page SEO metadata
│
├── pages/                    # Markdown — long-form pages
│   ├── o-nas.md
│   ├── kontakt.md
│   ├── porownanie.md
│   ├── regulamin.md
│   ├── polityka-prywatnosci.md
│   ├── polityka-cookies.md
│   ├── sprawdz-agencje-seo.md   # NEW
│   ├── dla-ecommerce.md         # NEW
│   ├── dla-agencji-seo.md       # NEW
│   ├── dla-freelancerow.md       # NEW
│   ├── funkcje.md                # NEW
│   ├── jak-to-dziala.md          # NEW
│   └── integracje.md             # NEW
│
├── blog/                     # Markdown — blog posts (23 total)
├── case-studies/             # Markdown — case studies (4 total)
├── changelog/                # Markdown — per-month entries
├── docs/                     # Markdown — help center sections (10 total)
└── _templates/               # Schemas and content agent prompt
    ├── CONTENT_AGENT_PROMPT.md
    ├── _page-template.md
    ├── _blog-template.md
    ├── _case-study-template.md
    ├── _changelog-template.md
    ├── _docs-template.md
    └── _json-schemas.md
```

## Content Helper Library

**File**: `landing/src/lib/content.ts`

Key functions:
- `getJsonData<T>(filename)` — read JSON data files
- `getPageContent(slug)` — read markdown page (frontmatter + HTML)
- `getPageFrontmatter(slug)` — read only frontmatter
- `getCaseStudies()` — list all case studies sorted by date
- `getCaseStudy(slug)` — single case study
- `getChangelogEntries()` — all changelog entries sorted by date
- `getDocsSections()` — docs sections sorted by order
- `getPageMetadata(slug)` — SEO metadata for a page
- `getNavigation()` — topbar + footer nav data
- `getAllContentSlugs()` — all slugs for sitemap generation

Existing blog helper (`landing/src/lib/blog.ts`) continues to work as before.

## Image Placeholder Convention

Every image reference includes a `placeholder` field:
```json
{
  "src": "/images/[category]/[name].png",
  "alt": "Descriptive alt text",
  "placeholder": "PLACEHOLDER: [Description for designer] — [dimensions]"
}
```

## SEO Infrastructure

- `landing/src/app/sitemap.ts` — dynamic sitemap from all content files
- `landing/src/app/robots.ts` — robots.txt (allows /, disallows /login, /api/)
- `landing/content/data/metadata.json` — per-page title, description, OG image

## New Routes (7 new pages)

| Route | File | Purpose |
|-------|------|---------|
| `/sprawdz-agencje-seo` | `landing/src/app/sprawdz-agencje-seo/page.tsx` | Verify your SEO agency |
| `/dla-ecommerce` | `landing/src/app/dla-ecommerce/page.tsx` | For e-commerce shops |
| `/dla-agencji-seo` | `landing/src/app/dla-agencji-seo/page.tsx` | For SEO agencies |
| `/dla-freelancerow` | `landing/src/app/dla-freelancerow/page.tsx` | For freelancers |
| `/funkcje` | `landing/src/app/funkcje/page.tsx` | Full feature list |
| `/jak-to-dziala` | `landing/src/app/jak-to-dziala/page.tsx` | How it works |
| `/integracje` | `landing/src/app/integracje/page.tsx` | Integration deep-dive |

All new routes added to `docker/nginx/nginx.conf`.

## Content Update Procedure

See: `.context7/public/CONTENT_UPDATE_PROCEDURE.md`

## Workflow

1. **Content agent** edits files in `landing/content/` (JSON + Markdown)
2. **Developer** refactors components to read from content files (Phase 2)
3. **Designer** replaces image PLACEHOLDERs with real assets (Phase 5)

---
**Created**: 2026-02-11
