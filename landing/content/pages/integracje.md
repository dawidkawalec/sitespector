---
title: "Integracje SiteSpector"
subtitle: "Screaming Frog, Lighthouse, Senuto, Gemini AI — najlepsze narzędzia SEO w jednej platformie"
slug: "integracje"
hero_image:
  src: "/images/pages/integracje-hero.png"
  alt: "Integracje SiteSpector — ekosystem narzędzi SEO"
  placeholder: "PLACEHOLDER: Diagram integracji — SiteSpector w centrum, wokół loga narzędzi z połączeniami — 1200x600px"
cta_primary:
  text: "Wypróbuj za darmo"
  href: "/login"
integrations:
  - id: "screaming-frog"
    name: "Screaming Frog SEO Spider"
    logo_placeholder: "PLACEHOLDER: Logo Screaming Frog — 200x200px"
    category: "Crawling SEO"
  - id: "lighthouse"
    name: "Google Lighthouse"
    logo_placeholder: "PLACEHOLDER: Logo Lighthouse — 200x200px"
    category: "Wydajność"
  - id: "senuto"
    name: "Senuto"
    logo_placeholder: "PLACEHOLDER: Logo Senuto — 200x200px"
    category: "Widoczność SEO"
  - id: "gemini"
    name: "Google Gemini AI"
    logo_placeholder: "PLACEHOLDER: Logo Gemini AI — 200x200px"
    category: "Sztuczna inteligencja"
  - id: "stripe"
    name: "Stripe"
    logo_placeholder: "PLACEHOLDER: Logo Stripe — 200x200px"
    category: "Płatności"
  - id: "supabase"
    name: "Supabase"
    logo_placeholder: "PLACEHOLDER: Logo Supabase — 200x200px"
    category: "Autentykacja"
related_pages:
  - { label: "Funkcje platformy", href: "/funkcje" }
  - { label: "Jak to działa", href: "/jak-to-dziala" }
---

## Screaming Frog SEO Spider

PLACEHOLDER: Content agent — deep-dive na Screaming Frog:
- Co to jest: branżowy standard crawlingu SEO (używany przez 90%+ agencji)
- Co robi w SiteSpector: automatyczny crawl strony bez instalacji desktopowej
- Dane: meta tagi, nagłówki H1-H6, obrazy + ALT, linki wewnętrzne, status codes, canonicale, dyrektywy, hreflang, sitemap, indexability
- Jak to działa technicznie: kontener Docker, headless mode
- Przewaga SiteSpector: nie potrzebujesz licencji SF (259 GBP/rok) — jest wbudowany

## Google Lighthouse

PLACEHOLDER: Content agent — deep-dive na Lighthouse:
- Co to jest: oficjalne narzędzie Google do mierzenia jakości stron
- Co robi w SiteSpector: automatyczne audyty desktop + mobile jednocześnie
- Dane: Core Web Vitals (LCP, FCP, CLS, TTFB, TBT, Speed Index), 4 score'y (Performance, Accessibility, Best Practices, SEO), 176 szczegółowych audytów
- Jak to działa technicznie: kontener Docker, headless Chrome
- Przewaga SiteSpector: desktop + mobile w jednym, dane zapisywane, porównywalne w czasie

## Senuto

PLACEHOLDER: Content agent — deep-dive na Senuto:
- Co to jest: polska platforma SEO do analizy widoczności w Google
- Co robi w SiteSpector: automatyczne pobieranie danych widoczności
- Dane: dashboard domeny, pozycje (do 10k), trendy, wins/losses, kanibalizacja, AI Overviews, backlinki, anchory, domeny odsyłające
- 20+ endpointów API
- Konfiguracja: kraj (domyślnie Polska), tryb (subdomain/domain)
- Przewaga SiteSpector: dane Senuto zintegrowane z crawl + Lighthouse + AI w jednym raporcie

## Google Gemini AI

PLACEHOLDER: Content agent — deep-dive na Gemini:
- Co to jest: najnowsza generacja AI od Google (Gemini 3.0 Flash)
- Co robi w SiteSpector: wielowarstwowa analiza z rekomendacjami
- Funkcje: analiza treści, ocena jakości (0-100), kontekstowe analizy per obszar, cross-tool korelacje, roadmapa, quick wins, executive summary, ALT text generation, fix suggestions
- Nie przesyłamy danych osobowych — tylko dane techniczne strony
- Przewaga SiteSpector: AI przeanalizuje WSZYSTKIE dane z SF + LH + Senuto razem

## Stripe

PLACEHOLDER: Content agent — opis integracji Stripe:
- Bezpieczne płatności (PCI DSS Level 1)
- Subskrypcje miesięczne (Free → Pro → Enterprise)
- Customer Portal do zarządzania subskrypcją
- Automatyczne faktury
- Apple Pay / Google Pay

## Supabase

PLACEHOLDER: Content agent — opis integracji Supabase:
- Autentykacja: email/hasło, Google, GitHub
- Row Level Security — izolacja danych per workspace
- Dane użytkowników i zespołów w AWS EU
- Bezpieczne zarządzanie sesjami
