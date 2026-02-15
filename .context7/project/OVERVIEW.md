# SiteSpector - Project Overview

## Project Identity
**Name**: SiteSpector
**Type**: Professional SEO & Technical Audit Platform (SaaS)
**Market**: Polish market (B2B, agencies, website owners)
**Stage**: Production SaaS Platform
**Status**: Fully operational with Teams, Billing, Workspaces
**IDE**: Cursor (primary)

## Documentation
Canonical documentation is stored in `.context7/`. See **[.context7/INDEX.md](../INDEX.md)** for the full documentation index.

## Core Features
Professional SaaS platform for automated website auditing that combines:
- **SEO Crawling** (Screaming Frog) - Technical SEO analysis
- **Performance Testing** (Lighthouse) - Core Web Vitals, page speed
- **AI Analysis** (Google Gemini) - Content quality, recommendations
- **PDF Reports** - Professional downloadable audit reports
- **Competitive Analysis** - Compare with up to 3 competitors
- **Team Workspaces** - Collaborate with team members
- **Subscription Billing** - Free, Pro, Enterprise tiers (Stripe integration)
- **Multi-tenancy** - Personal and team workspaces with role-based access

## Current State
### ✅ What Works (Production-Ready)
- **Authentication**: Supabase Auth (email/password, OAuth, magic links).
- **Workspace Management**: Personal and team workspaces with role-based access.
- **Subscription & Billing**: Stripe integration with usage tracking.
- **Audit Pipeline**: Screaming Frog + Lighthouse + Gemini AI.
- **Infrastructure**: 9 Docker containers on Hetzner VPS with Let's Encrypt SSL (hardened: SSH key-only, UFW deny outgoing, fail2ban, segmented Docker networks).
- **Frontend**: Next.js 14 App Router with Unified Context-Aware Sidebar.

## Architecture Overview
SiteSpector uses a **Dual Database Strategy**:
- **Supabase PostgreSQL**: Users, Teams, Workspaces, Subscriptions (with RLS).
- **VPS PostgreSQL**: Audits, Results, Competitors (high-volume data).

See **[.context7/project/ARCHITECTURE.md](ARCHITECTURE.md)** for details.

---
**Last Updated**: 2026-02-15
**Status**: Production SaaS Platform
**Maintainer**: Dawid
