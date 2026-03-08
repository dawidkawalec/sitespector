# SiteSpector — Gap Analysis Report

**Data**: 2026-03-08 | **Autor**: Analiza automatyczna | **Dla**: CEO/Dev

---

## Spis treści

1. [Executive Summary](#1-executive-summary)
2. [Lighthouse — luki w danych](#2-lighthouse--luki-w-danych)
3. [Screaming Frog — luki kolumna po kolumnie](#3-screaming-frog--luki-kolumna-po-kolumnie)
4. [Senuto — dane przechowywane vs wyświetlane](#4-senuto--dane-przechowywane-vs-wyświetlane)
5. [Technical SEO Extras — 6 z 8 modułów niewidocznych](#5-technical-seo-extras--6-z-8-modułów-niewidocznych)
6. [Benchmark rynkowy — SiteSpector vs konkurencja](#6-benchmark-rynkowy--sitespector-vs-konkurencja)
7. [Nowe analizy z istniejących danych](#7-nowe-analizy-z-istniejących-danych)
8. [Priorytetyzowana lista luk](#8-priorytetyzowana-lista-luk)
9. [Rekomendowany roadmap](#9-rekomendowany-roadmap)

---

## 1. Executive Summary

SiteSpector zbiera **znacznie więcej danych niż wyświetla**. Szacuję, że wykorzystujemy ~40-50% zebranych informacji na froncie. Główne luki:

| Obszar | Zbieramy | Pokazujemy | Wykorzystanie |
|--------|----------|------------|--------------|
| Lighthouse | 150+ audytów, 10 metryk named | 10 named + lista opp/diag/passed | ~60% |
| Screaming Frog | 10 tabów CSV, ~50+ kolumn | ~25 kolumn w transformacji | ~50% |
| Senuto | 17 endpointów API | Pozycje, widoczność, AIO dobrze; backlinki słabo | ~70% |
| Technical SEO Extras | 8 modułów | 2 z UI (Schema, Semantic HTML) | **~25%** |
| Nowe analizy | 50+ możliwych | 0 | **0%** |

**Największa luka**: 6 z 8 modułów Technical SEO Extras ma pełne dane w backendzie, ale **ZERO wizualizacji** na froncie (robots.txt, sitemap, domain config, render no-JS, soft 404, directives/hreflang).

**Największa szansa**: Nowe analizy krzyżowe (korelacje, indeksy, predykcje) z istniejących danych — 50+ pomysłów, wiele o niskim nakładzie i bardzo wysokiej wartości.

---

## 2. Lighthouse — Luki w danych

### Obecny stan
- **Wyciągamy named fields (10)**: `performance_score`, `accessibility_score`, `best_practices_score`, `seo_score`, `fcp`, `lcp`, `cls`, `total_blocking_time`, `speed_index`, `ttfb`
- **Kategoryzujemy ~150 audytów** do: diagnostics (score < 0.5), opportunities (0.5 ≤ score < 1.0), passed (score ≥ 1.0)
- **Przechowujemy pełny raw JSON** (minus screenshoty)
- **Nic nie jest tracone** — ale wiele jest zakopane w JSON

### Tier 1 — Najcenniejsze audyty do wyciągnięcia na dashboard

| Audit ID | Co sprawdza | Dlaczego ważne | Kategoria |
|----------|------------|----------------|-----------|
| `interactive` (TTI) | Czas do interaktywności | Kluczowa metryka UX, klienci rozumieją | Performance |
| `total-byte-weight` | Waga strony (KB) | Łatwe do wyjaśnienia, koreluje z wydajnością | Performance |
| `dom-size` | Liczba elementów DOM | Koreluje z rendering perf | Performance |
| `bootup-time` | Czas wykonania JS | Ujawnia ciężkie skrypty | Performance |
| `third-party-summary` | Kod third-party (rozmiar + blocking time) | Najczęstszy blocker wydajności | Performance |
| `render-blocking-resources` | CSS/JS blokujące first paint | Najczęstszy fix wydajnościowy | Performance |
| `unused-javascript` | Nieużywany kod JS | Największe oszczędności | Performance |
| `unused-css-rules` | Nieużywane reguły CSS | Duże oszczędności | Performance |
| `uses-text-compression` | Brak gzip/brotli | Konfiguracja serwera, łatwy fix | Performance |
| `modern-image-formats` | Brak WebP/AVIF | Łatwy win | Performance |
| `uses-optimized-images` | Nieskompresowane obrazy | Łatwy win | Performance |
| `uses-responsive-images` | Obrazy większe niż display | Łatwy win | Performance |
| `offscreen-images` | Obrazy poza viewport (lazy load) | Łatwy win | Performance |
| `unsized-images` | Obrazy bez width/height (CLS) | Częsta przyczyna CLS | Performance |
| `lcp-lazy-loaded` | LCP image lazy-loaded (błąd!) | Częsty bug LCP | Performance |
| `prioritize-lcp-image` | LCP image nie discoverable | Fix dla LCP | Performance |
| `uses-long-cache-ttl` | Brak cache headers | Powtórne wizyty | Performance |
| `font-display` | Tekst niewidoczny podczas ładowania fontu | CLS/UX impact | Performance |
| `color-contrast` | Kontrast foreground/background < 4.5:1 | **Najczęściej failowany** accessibility audit globalnie | Accessibility |
| `errors-in-console` | Błędy JS w konsoli | Sygnał jakości | Best Practices |
| `is-on-https` | HTTPS | Security baseline | Best Practices |
| `no-vulnerable-libraries` | Znane vulnerable JS libraries | Ryzyko bezpieczeństwa | Best Practices |
| `is-crawlable` | Nie blokowany przez robots/noindex | **Krytyczny** dla SEO | SEO |
| `link-text` | Opisowy anchor text | Ważne dla SEO | SEO |
| `tap-targets` | Tap targets ≥ 48×48px | Mobile UX | SEO |

### Rekomendacja
- **Wyciągnij 4-5 numerycznych metryk** (`interactive`, `total-byte-weight`, `dom-size`, `bootup-time`) do named fields — do śledzenia trendów
- **Zbuduj komponent "Top Issues"** automatycznie highlight'ujący najgorzej oceniane audyty ze wszystkich kategorii
- **Pogrupuj opportunities/diagnostics** po kategoriach (Performance, Accessibility, BP, SEO) z count badges

---

## 3. Screaming Frog — Luki kolumna po kolumnie

### Obecny stan
- Eksportujemy **10 tabów CSV**: Internal:All, Response Codes:All, Page Titles:All, Meta Description:All, H1:All, H2:All, Images:All, Canonicals:All, Directives:All, Hreflang:All
- Transformujemy ~25 kolumn do `results.crawl`
- Wszystko jest też w `sf_raw_tabs` — więc nic nie jest stracone, ale nie jest używane

### Najcenniejsze kolumny w RAW_ONLY (mamy, ale nie używamy)

| Kolumna | Tab źródłowy | Wartość SEO | Effort |
|---------|-------------|-------------|--------|
| **`Crawl Depth`** | internal_all | Strony daleko od homepage trudniej się indeksują. Kluczowe dla site structure analysis | Low |
| **`Title 1 Pixel Width`** | page_titles | Sprawdzenie obcinania w SERP. Powszechny problem SEO | Low |
| **`Meta Description 1 Pixel Width`** | meta_descriptions | j.w. — obcinanie meta w SERP | Low |
| **`Hash` + `No. Near Duplicates`** | internal_all | Duplikat content detection bez dodatkowych API | Low |
| **`Link Score`** | internal_all | Proxy wewnętrznego PageRank — pokazuje, które strony dostają najwięcej link equity | Low |
| **`Text Ratio`** | internal_all | Stosunek tekst-do-HTML. Niski = thin content lub nafaszerowany template | Low |
| **`Closest Similarity Match`** | internal_all | Near-duplicate detection | Low |
| **`Title 2`, `H1-2`, `Meta Description 2`** | odpowiednie taby | Wielokrotne tagi = błąd SEO. Obecnie niewidoczne | Low |
| **`Occurrences`** | page_titles, meta_descriptions, h1_all | Duplikaty tytułów/meta — najczęstszy problem SEO | Low |
| **`Image Width/Height`** | images_all | Audit CLS (Cumulative Layout Shift) | Low |
| **`Image Status Code`** | images_all | Broken image detection | Low |
| **`Canonical Status`** | canonicals | Self-ref, non-indexable, missing — krytyczne dla canonical audit | Low |
| **`HTTP Canonical`** | canonicals | Header-based canonical (vs. HTML) | Low |
| **`hreflang URLs + Confirmation`** | hreflang | Alternate URLs + return tag validation | Low |
| **`rel="next"` / `rel="prev"`** | internal_all | Sygnały paginacji | Low |

### Brakujące taby eksportu (dostępne w SF ale nie skonfigurowane)

| Tab | Wartość | Priorytet |
|-----|---------|-----------|
| **External:All** | Zewnętrzne URL-e, broken outbound links, status codes | **HIGH** — aktualnie tylko zliczamy externals, nie mamy listy |
| **Links:All** | Pełny graf linków (source→target, anchor text, follow/nofollow) | **HIGH** — umożliwia internal linking analysis, orphan page detection |
| **Structured Data:All** | Schema.org markup z crawla (nie tylko homepage) | **HIGH** — rich snippet eligibility per page |
| **Security:All** | HTTPS status, mixed content, HSTS | **MEDIUM** |
| **Content:All** | Near-duplicates, exact duplicates, word count details | **MEDIUM** |
| **Sitemaps:All** | URLs in/not in sitemap, sitemap errors | **MEDIUM** |

### Rekomendacja
1. **Natychmiast**: Dodaj `crawl_depth`, `text_ratio`, `link_score`, `title_pixel_width`, `meta_desc_pixel_width` do per-page transform — to tylko `.get()` calls
2. **Wkrótce**: Dodaj `External:All` i `Links:All` do `--export-tabs` w `crawl.sh`
3. **Dalej**: Dodaj detection wielokrotnych tagów (`Title 2`, `H1-2`) i `Occurrences` dla duplikatów

---

## 4. Senuto — Dane przechowywane vs wyświetlane

### Status per endpoint

| Endpoint | Stored | Displayed | Wykorzystanie | Uwagi |
|----------|--------|-----------|--------------|-------|
| Dashboard (`getDomainData`) | Pełny payload | **1 pole fallback** | **~5%** | 95% nieużywane |
| Statistics | `top3/10/50, visibility, domain_rank, ads_equivalent` | Wszystko | **100%** | OK |
| Seasonality | Chart data | Chart | **100%** | OK |
| Distribution | TOP50 distribution | Chart | **~60%** | TOP3/10 distribution pominięte |
| Positions (10k keywords) | Pełne dane | Tabela + charty | **~90%** | `_meta.positions_total` NIE pokazane — user nie wie, że widzi sample |
| Wins (5k) | Pełne dane | Tabela | **100%** | OK |
| Losses (5k) | Pełne dane | Tabela | **100%** | OK |
| Competitors | Pełne dane | Chart + tabela | **~85%** | Brak keyword overlap per competitor |
| Cannibalization | Keywords + URLs | Tabela | **~80%** | Brak aggregated summary card |
| Sections | Paths + visibility | Overview + tabela | **100%** | OK |
| Sections Subdomains | Subdomains | Tabela | **100%** | OK |
| Sections URLs | URLs | Tabela | **100%** | OK |
| AIO Statistics | All stats | Cards | **100%** | OK |
| AIO Keywords (5k) | Keywords | Tabela + charty | **100%** | OK |
| AIO Competitors | Competitors | Chart + tabela | **100%** | OK |
| **Backlinks Statistics** | Stats | **3 z ~8+ pól** | **~35%** | Brak: subnets, edu/gov, historical, TLD distribution |
| **Backlinks Link Attributes** | Attributes | Pie chart | **~80%** | OK |
| **Backlinks Anchors** | Pełna chmura | **Top 6 only** | **~10%** | 90%+ ukryte za raw tab |
| **Backlinks Ref Domains (2k)** | 2000 domen | **Top 6 only** | **~3%** | **97% ukryte** za raw tab |
| **Backlinks List (5k)** | 5000 linków | Tabela (bez target_url) | **~75%** | Brak target_url, last_seen, domain_rank |

### Krytyczne luki Senuto

1. **Ref Domains**: Przechowujemy 2000, pokazujemy 6. Potrzeba: pełna paginated tabela + TLD distribution chart
2. **Anchors**: Przechowujemy pełną chmurę, pokazujemy 6. Potrzeba: word cloud + anchor type classification
3. **Positions Total**: User nie wie, że widzi 10k z np. 47k. Potrzeba: sampling indicator
4. **Cannibalization summary**: Brak headline "23 keywords cannibalized across 8 URL pairs"
5. **Dashboard payload**: 95% nieużywane — warto zbadać co API zwraca

---

## 5. Technical SEO Extras — 6 z 8 modułów niewidocznych

### Status per moduł

| Moduł | Backend | Frontend UI | Luka |
|-------|---------|-------------|------|
| Schema.org | Pełna analiza + V2 | **Dobrze** — score, typy, issues, snippety | Minor (brak notes, status badge) |
| Semantic HTML | Score + elements + issues | **Częściowo** — score card | Medium (brak element breakdown, recommendations) |
| **Robots.txt** | Pełna analiza (user agents, blokady, issues) | **ZERO UI** | **KRYTYCZNA** |
| **Sitemap Analysis** | Coverage %, stale entries, URL mismatches | **Tylko boolean `has_sitemap`** | **KRYTYCZNA** |
| **Domain Config** | 4 warianty, redirect chain, HTTPS | **ZERO UI** | **KRYTYCZNA** |
| **Render without JS** | Score, status, SPA detection | **ZERO UI** (tylko RAW) | **KRYTYCZNA** |
| **Soft 404 / Low Content** | Count + samples (30) | **ZERO UI** (tylko RAW) | **KRYTYCZNA** |
| **Directives / Hreflang** | Counts + samples + issues | **ZERO UI** (tylko RAW) | **KRYTYCZNA** |

### Implikacja
AI analysis (Gemini) **używa** tych danych do generowania insights, ale użytkownik nie widzi surowych danych, na których AI bazuje. To tworzy "czarną skrzynkę" — AI mówi "masz problem z robots.txt" ale user nie może sam zobaczyć robots.txt.

### Dodatkowe niespójności
- **Noindex/nofollow podwójnie liczone**: `screaming_frog.py` i `technical_seo_extras.py` liczą to samo z tych samych danych
- **Sitemap boolean vs analysis**: SEO page pokazuje `crawl.has_sitemap` ale bogata analiza (coverage %, stale) nigdzie się nie pojawia

---

## 6. Benchmark rynkowy — SiteSpector vs konkurencja

### Co SiteSpector MA (przewagi konkurencyjne)

| Feature | Status | Kto to ma |
|---------|--------|-----------|
| RAG Chat per audit (5 agentów) | **Unikalne** | Nikt |
| Auto-generowany execution plan z taskami | **Unikalne** | Nikt |
| 9-area AI contextual analysis | **Unikalne** | Nikt (SEMrush Copilot jest lżejszy) |
| Cross-tool correlation analysis | **Unikalne** | Nikt |
| Senuto integration (Polish market) | **Unikalne** | Nikt |
| 3-tier PDF reports | **Unikalne** | Sitebulb ma PDF, inni basic |
| Quick Wins z Impact/Effort matrix | **Unikalne** | Nikt |
| Schema.org AI readiness scoring | **Silne** | SEMrush ma basic |
| Render without JS check | **Silne** | Sitebulb ma, inni nie |

### KRYTYCZNE LUKI (rynek tego oczekuje — table stakes)

| Luka | Kto to ma | Effort | Impact |
|------|-----------|--------|--------|
| **Health Score** (single 0-100%) | WSZYSCY | Low | **VERY HIGH** — pierwsze co user widzi |
| **Issue severity (Error/Warning/Notice + counts)** | WSZYSCY | Low | **VERY HIGH** — baseline expectation |
| **Internal link distribution** (orphan pages, inlinks count) | WSZYSCY | Medium | **HIGH** — core SEO metric |
| **Crawl depth analysis** (chart: pages per click depth) | WSZYSCY | Low | **MEDIUM** — data w SF |
| **Duplicate content detection** | Ahrefs, SEMrush, SF, Sitebulb | Medium | **MEDIUM-HIGH** |
| **HTTPS/mixed content report** | SEMrush, Ahrefs, SE Ranking | Low | **MEDIUM** |

### WAŻNE LUKI (differentiators)

| Luka | Kto to ma | Effort | Impact |
|------|-----------|--------|--------|
| **Site architecture visualization** (crawl maps) | Sitebulb, SF | High | **HIGH** — wow factor |
| **Historical audit comparison** (audit-over-audit trends) | Sitebulb, SE Ranking, Ahrefs | Medium | **HIGH** — proves ROI |
| **AI Search readiness checks** (llms.txt, AI bot rules) | SEMrush (2025) | Low-Med | **HIGH** — cutting-edge |
| **Semantic content clustering** (LLM embeddings) | SF v22+ | Med-High | **MEDIUM-HIGH** |
| **GA/GSC integration** | Sitebulb, SF | Medium | **MEDIUM-HIGH** |

---

## 7. Nowe analizy z istniejących danych

### TOP 15 — Priorytetyzowane po Impact × Low Effort

| # | Analiza | Input (już mamy) | Insight | Effort | Wartość |
|---|---------|-------------------|---------|--------|---------|
| 1 | **Quick Win Keyword Opportunities** | Senuto: pozycje 11-20, high SV, low difficulty | Keywords na stronie 2 z potencjałem na stronę 1 | Low | VERY HIGH |
| 2 | **Orphan Page Detection** | SF: all_pages z inlinks == 0 | Strony bez linków wewnętrznych — niewidoczne | Low | VERY HIGH |
| 3 | **Score Delta Tracking** | Wiele audytów per project_id | "Twój performance wzrósł o 12 pkt od ostatniego audytu" | Low | VERY HIGH |
| 4 | **AIO Content Opportunities** | Senuto AIO: keywords z AIO ale bez cytowania | Targetowanie fraz pod AI Overviews | Low | VERY HIGH |
| 5 | **AIO Competitive Position** | Senuto AIO competitors | Share cytowań vs. konkurencja | Low | VERY HIGH |
| 6 | **Technical Health Index** | LH + SF + extras (zagregowane) | Single 0-100 KPI per audit | Medium | VERY HIGH |
| 7 | **Visibility Momentum Score** | Senuto wins vs losses (ważone SV) | Czy SEO trenuje w górę czy w dół? | Medium | VERY HIGH |
| 8 | **Traffic Impact Estimation** | Senuto positions + CTR curves | "Przejście z #8 na #3 = ~Y wizyt/mies." | Medium | VERY HIGH |
| 9 | **Keyword Intent Coverage Map** | Senuto positions grouped by intent | "Dobrze na informational, słabo na transactional" | Low | HIGH |
| 10 | **Internal Link Equity vs Rankings** | SF inlinks + Senuto positions per URL | Strony z wysokim rankingiem ale mało inlinks = ryzyko | Low | HIGH |
| 11 | **Cannibalization Resolution Priorities** | Senuto cannibalization + SV | Priorytetyzowana lista z impact assessment | Low | VERY HIGH |
| 12 | **Title/Meta Anomalies** | SF all_pages (lengths, duplicates) | Za krótkie, za długie, brakujące, duplikaty | Low | HIGH |
| 13 | **Redirect Chain Detection** | SF all_pages (redirect chains) | Strony z >1 redirect hop | Low | HIGH |
| 14 | **CWV Desktop vs Mobile Gap** | LH desktop + mobile | Gdzie największa luka desktop↔mobile? | Low | HIGH |
| 15 | **Competitive Performance Radar** | Competitor LH (4 scores) + own | Spider chart porównawczy | Low | HIGH |

### Kolejne 15 — Medium Effort, High Value

| # | Analiza | Effort | Wartość |
|---|---------|--------|---------|
| 16 | Content Quality Index (per-page composite) | Medium | VERY HIGH |
| 17 | Content Optimization Briefs (per underperforming page) | High | VERY HIGH |
| 18 | Seasonal Opportunity Forecasting | Medium | HIGH |
| 19 | Page Type Classification (auto-grupowanie) | Medium | HIGH |
| 20 | Performance Tiers (A/B/C/D matryca) | Medium | HIGH |
| 21 | Link Equity Distribution Score (Gini coefficient) | Medium | HIGH |
| 22 | Crawl Efficiency Score | Low | HIGH |
| 23 | Backlink Health Score | Medium | HIGH |
| 24 | AI Readiness Score (composite) | Low | VERY HIGH |
| 25 | Competitive Gap Index (ważony) | Low | HIGH |
| 26 | Competitor Strength/Weakness Matrix | Medium | HIGH |
| 27 | Content Gap: Missing Keyword Opportunities | Medium | VERY HIGH |
| 28 | Section Content Maturity | Medium | HIGH |
| 29 | Content Freshness Segments | Medium | HIGH |
| 30 | Auto Monthly SEO Health Report | Medium | VERY HIGH |

---

## 8. Priorytetyzowana lista luk

### Tier 1 — MUST HAVE (1-2 tygodnie, data już jest)

| # | Luka | Źródło danych | Typ zmiany | Effort |
|---|------|---------------|-----------|--------|
| 1.1 | Health Score widget (single %) | SF + LH aggregated | Frontend | 1-2 dni |
| 1.2 | Issue severity dashboard (Error/Warning/Notice counts) | SF + LH issues classified | Frontend + light backend | 2-3 dni |
| 1.3 | Technical SEO page — Robots.txt panel | `results.crawl.robots_txt` | Frontend only | 1 dzień |
| 1.4 | Technical SEO page — Sitemap analysis panel | `results.crawl.sitemap_analysis` | Frontend only | 1 dzień |
| 1.5 | Technical SEO page — Domain config panel | `results.crawl.domain_config` | Frontend only | 0.5 dnia |
| 1.6 | Technical SEO page — Render no-JS panel | `results.crawl.render_nojs` | Frontend only | 0.5 dnia |
| 1.7 | Technical SEO page — Soft 404 / Low content panel | `results.crawl.soft_404` | Frontend only | 0.5 dnia |
| 1.8 | Technical SEO page — Directives/Hreflang panel | `results.crawl.directives_hreflang` | Frontend only | 0.5 dnia |
| 1.9 | Backlinks: pełna tabela ref domains (nie top 6) | `senuto.backlinks.ref_domains` | Frontend only | 1 dzień |
| 1.10 | Backlinks: pełna anchor cloud (nie top 6) | `senuto.backlinks.anchors` | Frontend only | 1 dzień |
| 1.11 | Positions sampling indicator | `senuto._meta.positions_total` | Frontend only | 0.5 dnia |

**Łączny effort Tier 1: ~10-12 dni dev**

### Tier 2 — SHOULD HAVE (2-4 tygodnie)

| # | Luka | Typ zmiany | Effort |
|---|------|-----------|--------|
| 2.1 | SF: dodaj `crawl_depth`, `text_ratio`, `link_score`, `title_pixel_width`, `meta_desc_pixel_width` do transform | Backend (SF transform) | 1-2 dni |
| 2.2 | SF: dodaj taby `External:All`, `Links:All` do crawl.sh | Backend (SF config + transform) | 3-4 dni |
| 2.3 | SF: detection wielokrotnych tagów (Title 2, H1-2) + Occurrences (duplikaty) | Backend transform | 1-2 dni |
| 2.4 | LH: wyciągnij `interactive`, `total-byte-weight`, `dom-size`, `bootup-time` jako named fields | Backend | 0.5 dnia |
| 2.5 | LH: pogrupuj opportunities/diagnostics po kategorii z count badges | Frontend | 1-2 dni |
| 2.6 | Quick Win Keyword Opportunities (pozycje 11-20, high SV) | Frontend + light backend | 2 dni |
| 2.7 | Orphan Page Detection (inlinks == 0) | Frontend | 1 dzień |
| 2.8 | Internal link distribution chart | Frontend | 1-2 dni |
| 2.9 | Crawl depth distribution chart | Frontend | 1 dzień |
| 2.10 | Cannibalization summary card + URL pair grouping | Frontend | 1-2 dni |
| 2.11 | Backlinks: TLD distribution chart + anchor type classification | Frontend | 2 dni |
| 2.12 | CWV Desktop vs Mobile gap analysis component | Frontend | 1 dzień |

**Łączny effort Tier 2: ~16-22 dni dev**

### Tier 3 — NICE TO HAVE (1-2 miesiące)

| # | Luka | Typ zmiany | Effort |
|---|------|-----------|--------|
| 3.1 | Technical Health Index (composite 0-100) | Backend | 2-3 dni |
| 3.2 | Visibility Momentum Score | Backend + Frontend | 2-3 dni |
| 3.3 | Historical audit comparison (audit-over-audit trends) | Backend + Frontend | 3-5 dni |
| 3.4 | Traffic Impact Estimation (CTR model) | Backend + Frontend | 3-4 dni |
| 3.5 | AI Search readiness checks (llms.txt, AI bot rules) | Backend | 2-3 dni |
| 3.6 | Content Quality Index (per-page composite) | Backend | 2-3 dni |
| 3.7 | Competitive Performance Radar (spider chart) | Frontend | 1-2 dni |
| 3.8 | Site architecture visualization (D3.js) | Frontend (heavy) | 5-7 dni |
| 3.9 | Duplicate content detection (Hash + Near Duplicates) | Backend + Frontend | 3-4 dni |
| 3.10 | Semantic content clustering (Qdrant + embeddings) | Backend | 5-7 dni |
| 3.11 | Content Optimization Briefs (per page, AI-generated) | Backend + Frontend | 5-7 dni |
| 3.12 | Auto Monthly SEO Health Report | Backend + Frontend | 3-5 dni |
| 3.13 | GA/GSC integration | Backend (OAuth + API) | 5-7 dni |
| 3.14 | Page Type auto-classification | Backend | 3-4 dni |

**Łączny effort Tier 3: ~44-61 dni dev**

---

## 9. Rekomendowany roadmap

### Faza 1: "Complete the Foundation" (2 tygodnie)
Cel: Przestać marnować dane, które już zbieramy.

- [ ] Zbuduj stronę `/audits/[id]/technical` z 6 panelami (1.3-1.8)
- [ ] Dodaj Health Score widget (1.1)
- [ ] Dodaj Issue severity dashboard (1.2)
- [ ] Rozbuduj backlinks: pełne tabele ref domains + anchors (1.9-1.10)
- [ ] Dodaj positions sampling indicator (1.11)

### Faza 2: "Deeper Insights" (3-4 tygodnie)
Cel: Wyciągnąć więcej z danych, które mamy.

- [ ] Wzbogać SF transform o brakujące kolumny (2.1)
- [ ] Dodaj SF taby External:All + Links:All (2.2)
- [ ] Quick Win Keywords + Orphan Pages + Cannibalization summary (2.6-2.7, 2.10)
- [ ] Internal link distribution + Crawl depth charts (2.8-2.9)
- [ ] LH: named fields + grouped categorization (2.4-2.5)
- [ ] CWV gap + TLD distribution (2.11-2.12)

### Faza 3: "Differentiate" (1-2 miesiące)
Cel: Zbudować features, których konkurencja nie ma.

- [ ] Composite indices (THI, Visibility Momentum, CQI) (3.1-3.2, 3.6)
- [ ] Historical audit comparison (3.3)
- [ ] Traffic Impact Estimation (3.4)
- [ ] AI Search readiness checks (3.5)
- [ ] Site architecture visualization (3.8)
- [ ] Content Optimization Briefs (3.11)
- [ ] Auto Monthly Reports (3.12)

---

## Appendix: Dane techniczne

### Pliki kluczowe

| Plik | Rola |
|------|------|
| `backend/app/services/lighthouse.py` | LH extraction + raw storage |
| `backend/app/services/screaming_frog.py` | SF CSV transform |
| `docker/screaming-frog/crawl.sh` | SF export tab config |
| `backend/app/services/senuto.py` | Senuto API calls |
| `backend/app/services/technical_seo_extras.py` | 8 modułów tech SEO |
| `backend/app/services/ai_analysis.py` | AI phase 2 (contexts) |
| `backend/app/services/ai_execution_plan.py` | AI phase 3 (tasks) |
| `frontend/app/(app)/audits/[id]/` | Audit detail pages |

### Baza danych
- `audits.results` (JSONB) — przechowuje WSZYSTKO
- `audit_tasks` — execution plan tasks
- `competitors` — competitor Lighthouse results

---

*Raport wygenerowany automatycznie na podstawie analizy kodu i porównania z rynkiem SEO tools.*
