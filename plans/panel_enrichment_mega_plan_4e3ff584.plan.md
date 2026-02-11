---
name: Panel Enrichment Mega Plan
overview: Kompleksowy plan wzbogacenia panelu SiteSpector o wyswietlanie 100% zbieranych danych, nowe analizy AI, i nowe funkcjonalnosci - z podzialem na 4 fazy od najszybszego ROI do najbardziej zaawansowanych featureow.
todos:
  - id: phase1-seo
    content: "FAZA 1.1: Rozbudowa strony SEO - tabela All Pages (Screaming Frog view), Status Code chart, Technical SEO panel, Heading structure"
    status: completed
  - id: phase1-performance
    content: "FAZA 1.2: Rozbudowa strony Performance - Lighthouse Opportunities/Diagnostics/Passed, Mobile vs Desktop full comparison, Response Time chart"
    status: completed
  - id: phase1-ai
    content: "FAZA 1.3: Rozbudowa strony AI Analysis - Local SEO panel, Performance Analysis panel, Competitive Analysis panel, Word Count chart"
    status: completed
  - id: phase1-images
    content: "FAZA 1.4: Nowa strona Images Analysis - tabela all_images, Image Size chart, filtry, optimization score"
    status: completed
  - id: phase1-links
    content: "FAZA 1.5: Nowa strona Links Analysis - broken links list, redirect chains, internal linking map"
    status: completed
  - id: phase1-competitors
    content: "FAZA 1.6: Rozbudowa strony Competitors - comparison table, bar charts, AI competitive analysis, winner indicators"
    status: completed
  - id: phase1-overview
    content: "FAZA 1.7: Rozbudowa Overview - accessibility/best practices scores, status chart, navigation cards, timeline"
    status: completed
  - id: phase2-comparison
    content: "FAZA 2.1: Strona Comparison - backend endpoint history, trend charts, delta indicators"
    status: completed
  - id: phase2-quickwins
    content: "FAZA 2.2: Strona Quick Wins - algorytm priorytetyzacji, karty problem/solution/effort"
    status: completed
  - id: phase3-ai-content
    content: "FAZA 3.1: AI Deep Content Analysis - per-page analysis, duplicate/thin content detection"
    status: completed
  - id: phase3-techstack
    content: "FAZA 3.2: Tech Stack Detection - CMS/framework/analytics detection, architecture page"
    status: completed
  - id: phase3-security
    content: "FAZA 3.3: Security Analysis - headers check, SSL, mixed content, security score"
    status: completed
  - id: phase3-ux
    content: "FAZA 3.4: UX Analysis - mobile readiness, accessibility, navigation, AI recommendations"
    status: completed
  - id: phase3-enhanced-ai
    content: "FAZA 3.5: Enhanced AI Summary - executive summary, action plan, ROI estimation"
    status: completed
  - id: phase4-benchmark
    content: "FAZA 4.1: Benchmark - industry standards comparison, percentile position"
    status: completed
  - id: phase4-client-report
    content: "FAZA 4.2: Client Report Generator - WYSIWYG, branding, export formats"
    status: completed
  - id: phase4-scheduled
    content: "FAZA 4.3: Scheduled Audits - recurring, email notifications, auto-comparison"
    status: completed
  - id: phase4-integrations
    content: "FAZA 4.4: Integrations - GSC, GA, Slack, Webhooks, Zapier"
    status: pending
isProject: false
---

# SiteSpector Panel Enrichment - Mega Plan

## Stan obecny

- **Zbierane dane:** ~500+ data points per audit (Screaming Frog + Lighthouse + AI)
- **Wyswietlane:** ~30-35% danych
- **Gotowe wykresy:** 4 komponenty w `AuditCharts.tsx` - **nieuzywane**
- **Placeholder pages:** 5 stron "Coming Soon"
- **Disabled sidebar items:** 8 pozycji calkowicie nieaktywnych

---

## FAZA 1: Ujawnienie ukrytych danych (0 zmian backend)

Najszybszy ROI - pokazujemy to co juz zbieramy ale nie wyswietlamy. Czysto frontendowe zmiany.

### 1.1 Strona SEO - rozbudowa do pelnego Screaming Frog view

**Plik:** `frontend/app/(app)/audits/[id]/seo/page.tsx`

Obecny stan: Title, meta description, H1, 4 metryki, proste rekomendacje.

Dodajemy:

- **Tabela All Pages** (z `results.crawl.all_pages`) - pelna lista stron jak w Screaming Frog:
  - URL, Title (z dlugoscia), Meta Description (z dlugoscia), H1, H2, Status Code, Word Count, Size, Response Time, Readability, Inlinks, Outlinks, Canonical, Meta Robots, Indexability
  - Sortowanie po kazdej kolumnie
  - Filtrowanie (np. pokaz tylko 404, tylko bez title, tylko noindex)
  - Export do CSV
- **Status Code Distribution** - uzyc istniejacego `PageStatusChart` z [AuditCharts.tsx](frontend/components/AuditCharts.tsx)
- **Technical SEO Panel** (z `results.crawl.technical_seo`):
  - Lista stron bez canonical (z URL-ami)
  - Lista stron noindex (z URL-ami)
  - Lista redirectow (z URL-ami)
  - Lista broken links (z URL-ami)
- **Heading Structure** - H1/H2 per strona (z `all_pages`)
- **Sitemap status** (z `results.crawl.has_sitemap`)

### 1.2 Strona Performance - Lighthouse audyty w pelni

**Plik:** `frontend/app/(app)/audits/[id]/performance/page.tsx`

Obecny stan: 4 scores, 6 CWV, generyczne rekomendacje.

Dodajemy:

- **Lighthouse Opportunities** (z `results.lighthouse.desktop.audits.opportunities`):
  - Tabela z tytul, opis, score, displayValue, numericValue
  - Sortowanie wg potencjalnych oszczednosci
  - Kolorowe oznaczenie severity
- **Lighthouse Diagnostics** (z `results.lighthouse.desktop.audits.diagnostics`):
  - Rozwijane panele z detalami
  - Score per audit
- **Lighthouse Passed Audits** (z `results.lighthouse.desktop.audits.passed`):
  - Lista zdanych testow (collapsible)
- **Mobile vs Desktop Full Comparison**:
  - Tabela side-by-side wszystkich metryk
  - Roznice procentowe
  - Radar chart z 4 kategoriami
- **Response Time Distribution** - uzyc `ResponseTimeChart` z [AuditCharts.tsx](frontend/components/AuditCharts.tsx)

### 1.3 Strona AI Analysis - pelne dane AI

**Plik:** `frontend/app/(app)/audits/[id]/ai-analysis/page.tsx`

Obecny stan: Quality score, word count, readability, recommendations, tag status.

Dodajemy:

- **Local SEO Panel** (z `results.local_seo`):
  - Is local business indicator (z detalami)
  - Has NAP (Name, Address, Phone)
  - Has Schema Markup
  - Rekomendacje local SEO
- **Performance Analysis Panel** (z `results.performance_analysis`):
  - Lista issues z severity
  - Impact level indicator
  - Rekomendacje z priorytetem
- **Competitive Analysis Panel** (z `results.competitive_analysis`):
  - Strengths (zielone karty)
  - Weaknesses (czerwone karty)
  - Opportunities (zolte karty)
  - Rekomendacje
  - Liczba przeanalizowanych konkurentow
- **Word Count Distribution** - uzyc `WordCountChart` z [AuditCharts.tsx](frontend/components/AuditCharts.tsx)

### 1.4 Nowa strona: Images Analysis

**Nowy plik:** `frontend/app/(app)/audits/[id]/images/page.tsx`

Dane z `results.crawl.images`:

- **Summary cards:** Total images, With ALT, Without ALT, Total size MB
- **Image Size Distribution** - uzyc `ImageSizeChart` z [AuditCharts.tsx](frontend/components/AuditCharts.tsx)
- **Tabela All Images** (z `results.crawl.images.all_images`):
  - URL, ALT text, Size (KB/MB), Format
  - Filtr: "Bez ALT", "Ponad 500KB", "Ponad 1MB"
  - Highlight obrazow bez ALT na czerwono
  - Highlight obrazow > 1MB na zolto
- **Image Optimization Score** - kalkulacja na podstawie % z ALT + sredni rozmiar

### 1.5 Nowa strona: Links Analysis

**Nowy plik:** `frontend/app/(app)/audits/[id]/links/page.tsx`

Dane z `results.crawl.links` + `results.crawl.all_pages`:

- **Summary cards:** Internal links, External links, Broken links, Redirects
- **Broken Links List** - URL-e z 404
- **Redirect Chain Analysis** - strony z redirectami
- **Internal Linking Map** - per-page inlinks/outlinks (z `all_pages`)
- **External Links List** - outgoing links

### 1.6 Strona Competitors - pelna implementacja

**Plik:** `frontend/app/(app)/audits/[id]/competitors/page.tsx`

Obecny stan: Podstawowe karty z score, "porownanie wkrotce".

Dodajemy:

- **Comparison Table** - Twoja strona vs kazdy konkurent side-by-side:
  - Performance, Accessibility, Best Practices, SEO scores
  - CWV: FCP, LCP, TBT, CLS, TTFB
- **Bar Chart Comparison** - wykresy porownawcze
- **Competitive Analysis AI Summary** (z `results.competitive_analysis`):
  - Strengths, Weaknesses, Opportunities, Recommendations
- **Winner indicators** - kto wygrywa w kazdej kategorii

### 1.7 Strona Overview - wzbogacenie

**Plik:** `frontend/app/(app)/audits/[id]/page.tsx`

Dodajemy:

- **Accessibility Score** + **Best Practices Score** (z Lighthouse)
- **Page Status Distribution mini-chart**
- **Quick navigation cards** do kazde sekcji z preview danych
- **Timeline** - created_at, started_at, completed_at z czasem trwania

---

## FAZA 2: Nowe strony z istniejacych danych

### 2.1 Strona Comparison (porownanie audytow w czasie)

**Plik:** `frontend/app/(app)/audits/[id]/comparison/page.tsx`

**Backend wymaga:** nowy endpoint `GET /api/audits/history?url=X&workspace_id=Y`

- Pobiera wszystkie audyty dla tego samego URL
- Wyswietla trend: score over time (line chart)
- Tabela porownawcza: audyt A vs audyt B
- Highlight zmian: co sie poprawilo, co sie pogorszylo
- Delta indicators (np. SEO: +5, Performance: -3)

### 2.2 Strona Quick Wins

**Nowy plik:** `frontend/app/(app)/audits/[id]/quick-wins/page.tsx`

Algorytm priorytetyzacji na frontendzie:

- Agregacja wszystkich issues z: technical_seo, lighthouse opportunities, content_analysis, performance_analysis
- Sortowanie wg impact (wysoki -> niski) i latwosc implementacji
- Karty z: Problem, Impact, Solution, Estimated effort
- Checkbox tracking (local state)
- Kategorie: "Do zrobienia dzis", "Ten tydzien", "Ten miesiac"

---

## FAZA 3: Nowe analizy AI (zmiany backend + frontend)

### 3.1 AI Deep Content Analysis (per-page)

**Backend:** Nowa funkcja `analyze_content_deep()` w worker:

- Analiza kazdej strony z `all_pages` (nie tylko homepage)
- AI ocena jakosci tresci per strona
- Wykrywanie thin content
- Wykrywanie duplicate content (porownanie titles/descriptions)
- Sugestie keyword per strona

**Frontend:** Nowa strona `ai-content/page.tsx`:

- Tabela stron z AI score per strona
- Duplicate content alerts
- Thin content alerts
- Keyword suggestions
- Content gaps analysis

### 3.2 Tech Stack Detection

**Backend:** Nowa funkcja `detect_tech_stack()` w worker:

- Analiza response headers (X-Powered-By, Server)
- Analiza HTML (meta generator, script src, link href)
- Wykrywanie: CMS (WordPress, Joomla), Framework (React, Vue, Angular), Analytics (GA, GTM), CDN, Hosting
- Wappalyzer-style detection z pattern matching
- AI enrichment: security implications, version checks

**Frontend:** Strona `architecture/page.tsx`:

- Karty technologii z ikonami
- Server info
- JavaScript libraries
- CSS frameworks
- Analytics tools
- Security headers check
- Rekomendacje upgradeow

### 3.3 Security Analysis

**Backend:** Nowa funkcja `analyze_security()`:

- HTTPS check
- Security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- Mixed content detection
- Cookie security flags
- SSL certificate info
- Open ports basic scan (opcjonalne)

**Frontend:** Nowa strona `security/page.tsx`:

- Security score (0-100)
- Checklist security headers
- SSL status
- Mixed content alerts
- Cookie analysis
- Rekomendacje

### 3.4 UX Analysis (AI-powered)

**Backend:** Nowa funkcja `analyze_ux()`:

- Mobile friendliness (z Lighthouse mobile data)
- Font size analysis (z Lighthouse audits)
- Tap target analysis (z Lighthouse audits)
- Color contrast (z Lighthouse accessibility audits)
- Page structure analysis (z crawl data)
- AI ocena UX na podstawie zebranych danych

**Frontend:** Nowa strona `ux-check/page.tsx`:

- UX Score
- Mobile readiness
- Accessibility highlights
- Navigation analysis
- Font/readability analysis
- AI rekomendacje UX

### 3.5 Enhanced AI Summary z Gemini

**Backend:** Rozbudowa `analyze_content()`:

- Pelny executive summary (nie tylko content)
- AI Action Plan z priorytetyzacja
- ROI estimation per recommendation
- Industry-specific recommendations
- Competitor-aware suggestions

---

## FAZA 4: Zaawansowane funkcjonalnosci

### 4.1 Benchmark / Industry Standards

**Backend:** Baza benchmarkow per branza:

- Srednie CWV per branza
- Srednie SEO scores
- Srednie content metryki
- Dane z publicznych zrodel (HTTP Archive, CrUX)

**Frontend:** Strona `benchmark/page.tsx`:

- Porownanie z branza (wybor branzy)
- Percentyl pozycja
- "Lepszy niz X% stron w branzy"
- Cele optymalizacji

### 4.2 Client Report Generator

**Frontend:** Strona `client-report/page.tsx`:

- WYSIWYG edytor raportu
- Drag & drop sekcji
- Custom branding (logo, kolory)
- Uproszczony jezyk (AI rewrites)
- Export: PDF, PowerPoint, HTML
- Shareable link (publiczny raport)

### 4.3 Scheduled Audits

**Backend:** Cron/scheduler:

- Recurring audits (co tydzien/miesiac)
- Email notifications o zmianach
- Auto-comparison z poprzednim audytem
- Alert on score drop

### 4.4 Integrations Hub

- Google Search Console integration
- Google Analytics integration
- Slack notifications
- Webhook API
- Zapier integration

---

## Architektura nowej nawigacji sidebar

Aktualna struktura sidebar z aktualizacja:

**Przegląd:**

- Podsumowanie (rozbudowane)
- SEO (rozbudowane - Screaming Frog view)
- Performance (rozbudowane - pelny Lighthouse)
- Analiza AI (rozbudowane - pelne dane AI)
- **NOWE: Obrazy** (images analysis)
- **NOWE: Linki** (links analysis)

**Raporty:**

- **Porownanie** (Faza 2 - aktywne)
- Raport PDF
- **Raport dla klienta** (Faza 4)
- **Benchmark** (Faza 4)

**Zaawansowane:**

- **Architektura** (Faza 3 - tech stack)
- **Konkurencja** (Faza 1 - rozbudowane)
- Debug

**Narzedzia:**

- **Quick Wins** (Faza 2)
- **Security** (Faza 3)
- **AI Content** (Faza 3)
- **UX Check** (Faza 3)

---

## Priorytetyzacja i estymacja


| Faza | Zakres          | Czas      | Backend          | Frontend   |
| ---- | --------------- | --------- | ---------------- | ---------- |
| 1    | 7 stron/sekcji  | 5-7 dni   | 0 zmian          | Duzo zmian |
| 2    | 2 nowe strony   | 2-3 dni   | 1 endpoint       | Srednie    |
| 3    | 5 nowych analiz | 7-10 dni  | 5 nowych funkcji | 5 stron    |
| 4    | 4 zaawansowane  | 10-14 dni | Duzo             | Duzo       |


**Calkowity czas:** ~24-34 dni roboczych
**Pokrycie danych po Fazie 1:** ~85-90%
**Pokrycie danych po Fazie 2:** ~95%
**Pokrycie danych po Fazie 3-4:** 100% + nowe dane

---

## Rekomendacja startu

**Faza 1 jest MUST-DO** - zero zmian w backendzie, ogromny skok wartosci. Zaczynamy od:

1. SEO page (Screaming Frog table) - najwazniejsze, najbardziej widoczne
2. Performance page (Lighthouse audits) - drugiego typu kluczowe dane
3. Images page - nowa strona, latwa do zrobienia
4. AI Analysis enrichment - pelne dane AI
5. Competitors enrichment - porownanie
6. Links page - nowa strona
7. Overview enrichment - cherry on top

