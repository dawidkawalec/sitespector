# SiteSpector - Landing Content Workflow (Brief-First)

This document describes the current workflow for creating and updating landing content.

## Current Source of Truth

- **Briefs**: `landing/content/briefs/`
  - These are short, scan-friendly creative briefs for pages/sections.
  - They are used to keep messaging consistent across updates.
  - They are not served directly to users.

- **Published content**: `landing/content/`
  - `landing/content/blog/` - blog posts
  - `landing/content/case-studies/` - case studies
  - Additional content directories may exist depending on features.

## Updating Content

1. Update or add a brief in `landing/content/briefs/` (keep it concise).
2. Update the corresponding published page/content under `landing/src/app/**` and/or `landing/content/**`.
3. Verify `landing` build on VPS (Next.js standalone build requires rebuild).

## Deployment Notes

Landing changes require a rebuild on the VPS:

```bash
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml build --no-cache landing
docker compose -f docker-compose.prod.yml up -d landing
docker compose -f docker-compose.prod.yml restart nginx
```

## Common Pitfalls

- If pages are recreated/removed, ensure Nginx routes and sitemap/robots handling remain correct.
- Always keep `.context7/project/DEPLOYMENT.md` in sync with the actual deployment steps.

