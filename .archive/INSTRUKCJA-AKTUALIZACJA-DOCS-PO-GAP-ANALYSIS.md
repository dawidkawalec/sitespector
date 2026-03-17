# Instrukcja aktualizacji dokumentacji SiteSpector — zmiany po raporcie Gap Analysis

**Dla:** Agenta aktualizującego dokumentację.  
**Kontekst:** Nie masz dostępu do historii commitów ani do tej rozmowy. Ten dokument jest jedynym źródłem informacji o tym, co zostało zrobione.  
**Zadanie:** Zaktualizuj dokumentację w folderze `docs/` oraz `AGENTS.md` tak, aby odzwierciedlała stan produktu po wdrożeniu Faz 1–3C z raportu gap analysis.
/
---

## 1. Punkt odniesienia

- **Przed zmianami:** W repozytorium był commit dodający raport `docs/gap-analysis-report.md` (analiza luk między danymi zbieranymi przez backend a tym, co pokazywał frontend).
- **Po zmianach:** Wdrożono pięć kolejnych commitów implementujących rekomendacje z tego raportu (Tier 1, Faza 2, Faza 3A, 3B, 3C).
- **Efekt:** Aplikacja ma teraz nowe strony audytu, nowe widżety na overview, rozszerzony backend (nowe serwisy i pola w `audits.results`) oraz nową zależność npm. Dokumentacja musi to wszystko opisywać.

---

## 2. Przegląd commitów (chronologicznie)

| Kolejność | Hash     | Tytuł |
|------------|----------|--------|
| 1 | 837849b | feat(audits): complete tier-1 foundation from gap analysis |
| 2 | c0d578a | feat(audits): implement phase-2 deeper insights |
| 3 | c7873bb | feat(audits): ship phase-3a quick win differentiators |
| 4 | ceec321 | feat(audits): implement phase-3b derived insights |
| 5 | 90bc92d | feat(audits): complete phase-3c architecture UX and duplicate exports |

Wszystkie zmiany dotyczą głównie: frontend (strony audytu, overview, sidebar), backend (worker, serwisy), oraz docs (bugs, decisions, frontend, backend, database, gap-analysis-report).

---

## 3. Szczegółowy opis zmian (po commitach)

### Commit 1 (837849b) — Tier-1 foundation (Faza 1)

**Cel:** Wykorzystać dane już zapisywane w `audits.results` i pokazać je w UI bez zmian kontraktów API.

**Frontend — strona overview audytu (`frontend/app/(app)/audits/[id]/page.tsx`):**
- Dodano **Health Score** — jeden wskaźnik 0–100% w formie circular gauge (donut). Agreguje wyniki Lighthouse (performance, accessibility, best practices, SEO) oraz problemy z crawl (broken links, brak canonical, noindex, 404, brak alt). Wzór: średnia ważona LH + system kar za błędy SF.
- Dodano **Issue Severity** — trzy kolumny: Error / Warning / Notice z liczbami oraz lista „top 5” krytycznych problemów z linkami do odpowiednich podstron. Klasyfikacja: Errors = broken links, 4xx/5xx, brak canonical, noindex na ważnych stronach; Warnings = brak meta desc, duplikaty tytułów, obrazy bez ALT, niski word count; Notices = redirect chains, brak h2, problemy hreflang.

**Frontend — nowa strona Technical SEO:**
- **Ścieżka:** `/audits/[id]/technical`
- **Plik:** `frontend/app/(app)/audits/[id]/technical/page.tsx` (nowy plik, ~482 linie)
- Zawiera 6 paneli z danymi z `results.crawl`: Robots.txt, Sitemap analysis, Domain config, Render no-JS, Soft 404, Directives/Hreflang. Każdy panel pokazuje treść/issues zgodnie z danymi w crawl. Strona używa wzorca trzech trybów: Dane / Analiza / Plan (ModeSwitcher, useAuditMode) tak jak inne strony audytu.

**Frontend — nawigacja:**
- W `AuditSidebar` w grupie „Technikalia” dodano link do „Technical SEO” prowadzący na `/audits/[id]/technical`.

**Frontend — strona Linki (`frontend/app/(app)/audits/[id]/links/page.tsx`):**
- **Ref domains (domeny odsyłające):** zamiast „top 6” jest pełna tabela z paginacją, sortowaniem i eksportem (komponent typu DataExplorerTable). Dane z `results.senuto.backlinks.ref_domains`.
- **Anchors (kotwice):** zamiast „top 6” pełna wizualizacja — chmura tagów (rozmiar czcionki proporcjonalny do liczby) plus tabela. Dane z `results.senuto.backlinks` (anchors).

**Frontend — strona Widoczność (`frontend/app/(app)/audits/[id]/visibility/page.tsx`):**
- Dodano **wskaźnik próbkowania pozycji:** tekst w stylu „Pokazujesz X z Y fraz (Z%)”. Wartości z `results.senuto._meta.positions_total` i `positions_count`. Jeśli próbka &lt; 50% całości, zalecane jest ostrzeżenie (np. żółty alert).

**Dokumentacja w tym commicie:** Zaktualizowano `docs/bugs.md`, `docs/decisions.md`, `docs/frontend.md`, `docs/gap-analysis-report.md`. W decisions dodano ADR-060 (Faza 1 jako frontend-first rollout).

---

### Commit 2 (c0d578a) — Phase-2 deeper insights (Faza 2)

**Cel:** Rozszerzyć transformacje Screaming Frog i Lighthouse o brakujące pola oraz nowe eksporty; dodać w UI „Tier-2” insights (wykresy, grupowania, nowe metryki).

**Backend — Screaming Frog (`backend/app/services/screaming_frog.py`):**
- Do transformacji dodano kolumny m.in.: Crawl Depth, Title 1 Pixel Width, Meta Description 1 Pixel Width, Hash, No. Near Duplicates, Link Score, Text Ratio, Closest Similarity Match, Title 2 / H1-2 / Meta Description 2, Occurrences (dla tytułów/meta/h1), Image Width/Height, Image Status Code, Canonical Status, HTTP Canonical, hreflang URLs + Confirmation, rel next/prev. Źródło: istniejące taby CSV (Internal:All, Page Titles, Meta Description, H1, Images, Canonicals, Directives, Hreflang).
- Dodano obsługę nowych tabów eksportu: **External:All** (linki zewnętrzne, broken outbound), **Links:All** (graf linków source→target, anchor, follow/nofollow). Dane trafiają do `results.crawl` w strukturach typu `external_links`, `link_graph`, `all_pages` (rozszerzone pola).
- Skrypt crawla: `docker/screaming-frog/crawl.sh` — zmieniono tak, aby wywoływać eksport także dla External:All i Links:All (jeśli używane).

**Backend — Lighthouse (`backend/app/services/lighthouse.py`):**
- Wyciągane dodatkowe named fields z raw JSON, np. interactive (TTI), total-byte-weight, dom-size, bootup-time. Audyty (diagnostics, opportunities, passed) grupowane po kategoriach (Performance, Accessibility, Best Practices, SEO) z liczbami.

**Frontend — Performance (`frontend/app/(app)/audits/[id]/performance/page.tsx`):**
- Rozbudowa o nowe metryki i wykresy z Lighthouse (CWV gap, byte weight, TTI, dom-size, itd.) oraz ewentualne grupowanie „Top issues” po kategoriach.

**Frontend — SEO (`frontend/app/(app)/audits/[id]/seo/page.tsx`):**
- Dodano sekcje wykorzystujące nowe dane crawl: multi-tags (Title 2, H1-2, Meta 2), occurrences (duplikaty tytułów/meta/h1), crawl depth distribution, grupowanie cannibalization, itp. Łącznie znacząca rozbudowa (~+142 linie).

**Frontend — Linki (`frontend/app/(app)/audits/[id]/links/page.tsx`):**
- Nowe sekcje/taby: linki zewnętrzne (lista/status), graf linków wewnętrznych (np. rozkład, orphan pages), rozkład TLD i typów anchor w backlinkach. Użycie `link_graph`, `all_pages`, `external_links` z `results.crawl` oraz Senuto backlinks.

**Frontend — Widoczność (`frontend/app/(app)/audits/[id]/visibility/page.tsx`):**
- Rozszerzenie o nowe wykresy/agregacje z Senuto i crawl (np. rozkłady, trendy). Zachowana kompatybilność wsteczna dla audytów bez nowych pól (fallbacki).

**Frontend — komponent współdzielony (`frontend/components/AuditCharts.tsx`):**
- Dodano nowe typy wykresów używane na stronach Tier-2 (np. link distribution, crawl depth, CWV gap). Styl spójny z resztą aplikacji (gradient line, tooltip).

**Dokumentacja:** Zaktualizowano `docs/backend.md`, `docs/bugs.md`, `docs/decisions.md`, `docs/frontend.md`. W decisions dodano ADR-061 (Faza 2 — backend enrichment + frontend derived insights).

---

### Commit 3 (c7873bb) — Phase-3a quick win differentiators (Faza 3A)

**Cel:** Dodać złożone wskaźniki (technical health, visibility momentum) oraz przejrzystą powierzchnię „AI readiness”; pokazać je na overview oraz na dedykowanej stronie i u konkurentów.

**Backend — nowy serwis (`backend/app/services/health_index.py`):**
- Plik nowy (~372 linie). Zawiera m.in.:
  - **Technical Health Index (THI)** — kompozyt z 5 filarów (np. crawl, performance, SEO, security, UX) na podstawie `results.crawl`, `results.lighthouse`. Wynik: jeden wskaźnik (np. 0–100).
  - **Visibility momentum** — trend „wygrane / przegrane” pozycje z Senuto (search volume weighted). Używa `results.senuto` (visibility, pozycje, zmiany).
- Zapis w workerze: `results.technical_health_index`, `results.visibility_momentum`.

**Backend — Technical SEO Extras (`backend/app/services/technical_seo_extras.py`):**
- Rozszerzenie o analizę **llms.txt** oraz **polityki botów AI** (np. robots.txt dla GPTBot, ChatGPT-User, Google-Extended). Wynik w `results.crawl.ai_readiness`: lista checków (np. czy llms.txt istnieje, czy robots zezwala/blokuje boty AI). Worker zapisuje `results.crawl.ai_readiness`.

**Backend — worker (`backend/worker.py`):**
- W fazie technicznej (po crawl/LH/Senuto) wywołanie obliczeń THI i visibility momentum oraz ai_readiness; zapis bloków do `audits.results`.

**Frontend — overview (`frontend/app/(app)/audits/[id]/page.tsx`):**
- Dodano karty: **Technical Health Index** (wartość + ewentualny mini wykres), **Visibility Momentum** (trend wygrane/przegrane), **AI Readiness** (skrót: np. „X/Y checków zaliczonych” z linkiem do pełnej strony).

**Frontend — nowa strona AI Readiness:**
- **Ścieżka:** `/audits/[id]/ai-readiness`
- **Plik:** `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx` (nowy, ~277 linii)
- Zawartość: pełna lista checków AI readiness (llms.txt, robots dla botów AI, ewentualne inne sygnały z `results.crawl.ai_readiness`). Tryb Dane/Analiza/Plan dla spójności z resztą audytu. Należy obsłużyć bezpieczne fallbacki gdy payload jest pusty lub niepełny (unikać crashy przy braku danych).

**Frontend — Konkurenci (`frontend/app/(app)/audits/[id]/competitors/page.tsx`):**
- Dodano **radar Lighthouse** dla konkurentów z bazy audytu: porównanie wyników Lighthouse (desktop/mobile) w formie radaru (np. performance, accessibility, best practices, SEO). Dane z `results` dla domen konkurentów (~+123 linie).

**Frontend — nawigacja:**
- W `AuditSidebar` dodano pozycję „AI Readiness” (grupa np. strategia/jakość). W `Breadcrumbs` dodano etykietę dla route ai-readiness.

**Dokumentacja:** Zaktualizowano `docs/backend.md`, `docs/bugs.md`, `docs/decisions.md`, `docs/frontend.md`, `docs/gap-analysis-report.md`. W decisions dodano ADR-059 (Phase 3A composite scores + AI readiness surface).

---

### Commit 4 (ceec321) — Phase-3b derived insights (Faza 3B)

**Cel:** Dodać szacunek ruchu (CTR-based) oraz indeks jakości treści; pokazać je na overview, w Widoczności, w Porównaniu oraz na dedykowanej stronie Content Quality.

**Backend — health_index.py (rozszerzenie):**
- Dodano funkcje:
  - **compute_traffic_estimation(senuto_data)** — szacunek miesięcznego ruchu organicznego na podstawie pozycji, CTR (krzywa CTR po pozycji), search volume. Opcjonalnie „opportunity model” (np. szacunek przy poprawie do pozycji 1–3).
  - **compute_content_quality_index(results)** — scoring jakości treści per URL (np. word count, uniqueness, meta, nagłówki) oraz agregat na poziomie strony (średnia/mediana). Używa `results.crawl`, ewentualnie Senuto.
- Worker zapisuje: `results.traffic_estimation`, `results.content_quality_index`.

**Frontend — overview (`frontend/app/(app)/audits/[id]/page.tsx`):**
- Dodano karty: **Estimated Traffic** (np. szacunek ruchu miesięcznego + ewentualny opportunity), **Content Quality** (np. średni indeks lub rozkład).

**Frontend — Porównanie (`frontend/app/(app)/audits/[id]/comparison/page.tsx`):**
- Rozbudowa: nakładki trendów z Phase 3A (THI, momentum), nowa zakładka „Keyword delta” (zmiany pozycji między audytami), podsumowanie ROI (np. szacowany wpływ ruchu). (~+343 linie)

**Frontend — Widoczność (`frontend/app/(app)/audits/[id]/visibility/page.tsx`):**
- Dodano zakładkę **Traffic Impact**: podsumowanie szacunku ruchu, rozkład przedziałów (np. strony dające 0–100, 100–1k, 1k+ wizyt), tabele „opportunity” (strony z potencjałem przy poprawie pozycji). (~+212 linii)

**Frontend — nowa strona Content Quality:**
- **Ścieżka:** `/audits/[id]/content-quality`
- **Plik:** `frontend/app/(app)/audits/[id]/content-quality/page.tsx` (nowy, ~297 linii)
- Zawartość: indeks jakości treści (strona główna + lista stron posortowanych np. od najsłabszych), priorytetyzacja „co poprawić”. Tryb Dane/Analiza/Plan. Dane z `results.content_quality_index`.

**Frontend — nawigacja:**
- W `AuditSidebar` dodano link „Content Quality” (np. w grupie strategia/jakość). W `Breadcrumbs` dodano etykietę dla content-quality.

**Dokumentacja:** Zaktualizowano `docs/backend.md`, `docs/bugs.md`, `docs/database.md`, `docs/decisions.md`, `docs/frontend.md`, `docs/gap-analysis-report.md`. W `docs/database.md` dopisano opis nowych bloków w `audits.results` (traffic_estimation, content_quality_index). W decisions — ADR-060 Phase 3B (derived insights layer).

---

### Commit 5 (90bc92d) — Phase-3c architecture UX and duplicate exports (Faza 3C)

**Cel:** Interaktywna wizualizacja architektury strony (graf linków) oraz powierzchnia duplikatów metadanych (tytuł/meta/h1) z eksportem CSV.

**Frontend — Architektura (`frontend/app/(app)/audits/[id]/architecture/page.tsx`):**
- Przebudowa strony (~+1010 / −249 linii). Dodano:
  - **Graf siłowy (force-directed graph)** z biblioteki `react-force-graph-2d`. Węzły = strony z `results.crawl.all_pages`, krawędzie = `results.crawl.link_graph` (source → target). Kontrolki: kolor/rozmiar węzła, filtrowanie, wyszukiwanie. Panel szczegółów po kliknięciu w węzeł; tryb „focus” na połączone węzły. Ograniczenia wydajności: deduplikacja krawędzi, limit liczby węzłów (np. top N), ostrzeżenie przy bardzo dużych grafach.
- Dane: tylko z istniejącego payloadu (`all_pages`, `link_graph`); brak nowych wywołań API.

**Frontend — Content Quality (`frontend/app/(app)/audits/[id]/content-quality/page.tsx`):**
- Rozbudowa (~+482 linie): dodano zakładkę **Duplikaty**. Wyswietlanie duplikatów po typie: duplikaty tytułów, duplikaty meta description, duplikaty H1. Źródło danych: istniejące sygnały w crawl (np. occurrences z SF). Dla każdego typu: tabela + **eksport CSV**.

**Zależności frontend:**
- W `frontend/package.json` i `frontend/package-lock.json` dodano: **react-force-graph-2d**.

**Dokumentacja:** Zaktualizowano `docs/bugs.md`, `docs/decisions.md`, `docs/frontend.md`, `docs/gap-analysis-report.md`. W decisions dodano ADR-062 (Phase 3C — site architecture graph + duplicate metadata surface).

---

## 4. Pełna lista nowych plików (w całym zakresie zmian)

| Ścieżka | Opis |
|---------|------|
| `frontend/app/(app)/audits/[id]/technical/page.tsx` | Strona Technical SEO (6 paneli crawl). |
| `backend/app/services/health_index.py` | Serwis: THI, visibility momentum, traffic_estimation, content_quality_index. |
| `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx` | Strona AI Readiness (checki llms.txt, robots dla botów AI). |
| `frontend/app/(app)/audits/[id]/content-quality/page.tsx` | Strona Content Quality (indeks jakości + zakładka Duplikaty z CSV). |

**Nowa zależność npm:** `react-force-graph-2d` (użyta na stronie Architecture).

---

## 5. Pełna lista zmodyfikowanych plików (wg ścieżki)

**Backend:**
- `backend/app/services/lighthouse.py` — nowe named fields, grupowanie audytów.
- `backend/app/services/screaming_frog.py` — nowe kolumny, taby External:All, Links:All, rozszerzone struktury w `results.crawl`.
- `backend/app/services/technical_seo_extras.py` — ai_readiness, llms.txt, polityka botów AI.
- `backend/app/services/health_index.py` — (nowy w 3A, potem rozszerzany w 3B).
- `backend/worker.py` — zapis: technical_health_index, visibility_momentum, ai_readiness, traffic_estimation, content_quality_index.

**Docker/infra:**
- `docker/screaming-frog/crawl.sh` — zmiany pod nowe eksporty SF.

**Frontend — strony audytu:**
- `frontend/app/(app)/audits/[id]/page.tsx` — overview: Health Score, Issue Severity, THI, momentum, AI readiness, Estimated Traffic, Content Quality.
- `frontend/app/(app)/audits/[id]/technical/page.tsx` — (nowy).
- `frontend/app/(app)/audits/[id]/links/page.tsx` — ref domains pełna tabela, anchors chmura+tabela, Tier-2 (external, link graph, TLD/anchors).
- `frontend/app/(app)/audits/[id]/visibility/page.tsx` — sampling indicator, Tier-2 metryki, zakładka Traffic Impact.
- `frontend/app/(app)/audits/[id]/performance/page.tsx` — Tier-2 metryki/wykresy LH.
- `frontend/app/(app)/audits/[id]/seo/page.tsx` — Tier-2 (multi-tags, occurrences, crawl depth, cannibalization).
- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx` — (nowy).
- `frontend/app/(app)/audits/[id]/competitors/page.tsx` — radar Lighthouse.
- `frontend/app/(app)/audits/[id]/comparison/page.tsx` — trendy 3A, keyword delta, ROI summary.
- `frontend/app/(app)/audits/[id]/content-quality/page.tsx` — (nowy), potem rozbudowa o Duplikaty + CSV.
- `frontend/app/(app)/audits/[id]/architecture/page.tsx` — force graph (react-force-graph-2d).

**Frontend — komponenty:**
- `frontend/components/layout/AuditSidebar.tsx` — linki: Technical SEO, AI Readiness, Content Quality.
- `frontend/components/layout/Breadcrumbs.tsx` — etykiety dla ai-readiness, content-quality.
- `frontend/components/AuditCharts.tsx` — nowe typy wykresów Tier-2.

**Frontend — zależności:**
- `frontend/package.json`, `frontend/package-lock.json` — dodana `react-force-graph-2d`.

**Dokumentacja (w tych commitach były edytowane):**
- `docs/bugs.md`
- `docs/decisions.md`
- `docs/frontend.md`
- `docs/backend.md`
- `docs/database.md` (w commit 4)
- `docs/gap-analysis-report.md`

---

## 6. Nowe bloki danych w `audits.results` (JSONB)

Agent musi wiedzieć, że w `audits.results` pojawiły się następujące klucze (zapis w workerze po odpowiednich fazach):

| Klucz | Opis | Źródło (serwis) |
|-------|------|------------------|
| `technical_health_index` | Kompozyt 5 filarów (crawl, perf, SEO, security, UX), wartość 0–100. | health_index.py |
| `visibility_momentum` | Trend wygrane/przegrane pozycje (SV-weighted). | health_index.py |
| `crawl.ai_readiness` | Lista checków AI (llms.txt, robots dla botów AI). | technical_seo_extras.py + worker |
| `traffic_estimation` | Szacunek ruchu miesięcznego + opportunity model. | health_index.py |
| `content_quality_index` | Per-page quality score + agregat na stronę. | health_index.py |

Struktury wewnętrzne (np. pola w `traffic_estimation`, `content_quality_index`) można odczytać z kodu w `backend/app/services/health_index.py` i z frontendu korzystającego z tych danych.

---

## 7. ADR-y powiązane z tymi zmianami

W `docs/decisions.md` powinny być (lub zostać zaktualizowane) następujące ADR:

- **ADR-060** — Gap Analysis Faza 1 jako frontend-first rollout (technical page, health/severity, backlinks full, sampling indicator).
- **ADR-061** — Gap Analysis Faza 2 — backend enrichment + frontend derived insights (SF/LH rozszerzenia, Tier-2 UI).
- **ADR-059** — Phase 3A composite scores + AI readiness surface (THI, momentum, ai_readiness, strona ai-readiness, radar konkurentów).
- **ADR-060 (Phase 3B)** — Derived insights layer (traffic_estimation, content_quality_index, comparison/visibility/content-quality).
- **ADR-062** — Phase 3C site architecture graph + duplicate metadata surface (force graph, Duplikaty + CSV).

Sprawdź, czy każdy z nich ma sekcję Outcome i czy opis implementacji zgadza się z powyższym opisem. Uzupełnij brakujące fragmenty.

---

## 8. Konkretne zadania dla agenta aktualizującego dokumentację

Wykonaj po kolei:

1. **docs/frontend.md**
   - Opisz **wszystkie nowe strony** audytu: `/technical`, `/ai-readiness`, `/content-quality` (cel, tryby Dane/Analiza/Plan, główne sekcje).
   - Opisz rozbudowę **overview**: Health Score, Issue Severity, THI, Visibility Momentum, AI Readiness (skrót), Estimated Traffic, Content Quality.
   - Opisz rozbudowę **Architecture**: force-directed graph, kontrolki, panel szczegółów, ograniczenia wydajności.
   - Opisz rozbudowę **Content Quality**: indeks jakości + zakładka Duplikaty (tytuł/meta/h1) i eksport CSV.
   - Opisz rozbudowę **Links**: pełna tabela ref domains, chmura anchors, Tier-2 (external, link graph, TLD/anchors).
   - Opisz rozbudowę **Visibility**: wskaźnik próbkowania pozycji, zakładka Traffic Impact (szacunek ruchu, opportunity).
   - Opisz rozbudowę **Comparison**: trendy 3A, keyword delta, ROI summary.
   - Opisz rozbudowę **Performance** i **SEO**: nowe metryki/wykresy Tier-2 (crawl depth, multi-tags, occurrences, cannibalization, CWV gap, itd.).
   - Opisz rozbudowę **Competitors**: radar Lighthouse.
   - Wymień nową zależność: `react-force-graph-2d` (użycie na Architecture).
   - Zaktualizuj sekcję nawigacji/sidebaru: Technical SEO, AI Readiness, Content Quality w AuditSidebar.

2. **docs/backend.md**
   - Opisz **nowy serwis** `health_index.py`: funkcje (THI, visibility momentum, traffic_estimation, content_quality_index), wejścia (results.crawl, results.lighthouse, results.senuto), wyjścia (bloki zapisywane w results).
   - Opisz rozszerzenia **screaming_frog.py**: nowe kolumny z tabów CSV, nowe taby (External:All, Links:All), nowe/zmienione klucze w `results.crawl` (all_pages, link_graph, external_links, itd.).
   - Opisz rozszerzenia **lighthouse.py**: dodatkowe named fields, grupowanie audytów po kategoriach.
   - Opisz rozszerzenia **technical_seo_extras.py**: ai_readiness (llms.txt, polityka botów AI), zapis w `results.crawl.ai_readiness`.
   - Opisz zmiany w **workerze**: w której fazie zapisywane są technical_health_index, visibility_momentum, ai_readiness, traffic_estimation, content_quality_index.

3. **docs/database.md**
   - W sekcji dotyczącej `audits.results` (JSONB) dodaj opis nowych bloków: `technical_health_index`, `visibility_momentum`, `crawl.ai_readiness`, `traffic_estimation`, `content_quality_index`. Możesz skopiować strukturę z backendu lub z frontendu (jakie pola są odczytywane).

4. **docs/architecture.md**
   - Krótko opisz nowy przepływ danych: worker po fazie technicznej wywołuje health_index i technical_seo_extras; wyniki trafiają do results i są konsumowane przez overview oraz strony technical, ai-readiness, visibility, comparison, content-quality, architecture. Wymień nową zależność frontendu (react-force-graph-2d) w sekcji stack/technologie.

5. **docs/gap-analysis-report.md**
   - Zaktualizuj sekcję statusu/roadmapu: Tier 1 (Faza 1), Tier 2 (Faza 2), Fazy 3A, 3B, 3C — oznaczyć jako **zrealizowane**. Usuń lub skróć punkty „do zrobienia” dla tych elementów, które są już wdrożone (np. Health Score, Issue Severity, strona Technical, backlinks full, sampling, THI, momentum, AI readiness, traffic estimation, content quality index, architecture graph, duplicate metadata + CSV).

6. **docs/decisions.md**
   - Przejrzyj ADR-059, ADR-060, ADR-061, ADR-062. Upewnij się, że sekcje Decision, Implementation, Outcome są kompletne i zgodne z tym dokumentem. Dodaj brakujące wpisy.

7. **AGENTS.md**
   - W sekcji opisującej produkt/stack/funkcje dodaj zdanie lub krótki akapit: zrealizowano rekomendacje z gap analysis (Tier 1–3): strona Technical SEO, Health Score i Issue Severity na overview, pełne backlinks (ref domains + anchors), wskaźnik próbkowania pozycji, Technical Health Index i Visibility Momentum, strona AI Readiness, radar Lighthouse u konkurentów, szacunek ruchu i Content Quality Index, strona Content Quality z duplikatami i eksportem CSV, interaktywny graf architektury strony (react-force-graph-2d). Backend: serwis health_index, rozszerzenia SF/LH/technical_seo_extras.

---

## 9. Uwagi końcowe

- Wszystkie nowe strony audytu używają wzorca **Dane / Analiza / Plan** (ModeSwitcher, useAuditMode) — warto to zaznaczyć w docs/frontend.md.
- **Kompatybilność wsteczna:** stare audyty (bez nowych pól w results) muszą być obsługiwane przez frontend (fallbacki, brak crashy). Można to opisać w docs/frontend.md lub docs/backend.md.
- Folder **marketing/** (17 plików .md) nie był częścią tych commitów i nie wymaga aktualizacji w ramach tej instrukcji.
- Po zaktualizowaniu dokumentacji usuń lub zarchiwizuj ten plik instrukcji, jeśli nie ma być częścią docelowej dokumentacji produktu.
