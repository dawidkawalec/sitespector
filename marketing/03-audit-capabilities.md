# SiteSpector — Możliwości Audytu: Co Badamy, Dlaczego i Jak

> **Dla kogo:** Specjaliści SEO oceniający narzędzie, copywriterzy tworzący strony funkcji, sales team.  
> **Po co:** Kompletna lista funkcji audytu z uzasadnieniem — każdy element badania z wyjaśnieniem wartości dla klienta.

---

## 1. Przegląd — 3 fazy audytu

```
FAZA 1: Analiza techniczna (automatyczna, ~5–15 min)
  ├── Screaming Frog (crawl SEO, 30+ metryk)
  ├── Google Lighthouse (wydajność desktop + mobile)
  ├── Senuto (widoczność, backlinki, AI Overviews)
  ├── Technical Extras (Schema.org, robots.txt, sitemap, semantyka HTML)
  └── Analiza konkurentów (Lighthouse dla do 3 URL-i)
         │
         ▼
FAZA 2: Analiza AI (Gemini, ~3–8 min)
  ├── 9 kontekstowych analiz per-area (SEO, performance, visibility, itd.)
  ├── Strategia cross-tool (korelacje, synergie, konflikty)
  ├── Roadmap (4 horyzonty: natychmiast, krótko, średnio, długo)
  ├── Executive Summary (ocena zdrowia strony, mocne strony, krytyczne problemy)
  └── Quick Wins (lista natychmiastowych wygranych ze wszystkich modułów)
         │
         ▼
FAZA 3: Execution Plan (AI, ~2–5 min)
  └── Do 200 priorytetyzowanych zadań z kodem
      ├── 8 modułów (SEO, performance, visibility, AI Overviews, links, images, UX, security)
      ├── Każde zadanie: tytuł, opis, priorytet, impact, effort, gotowy kod
      └── Quick wins oznaczone (wysoki efekt + mały wysiłek)
```

**Łączny czas audytu:** 10–30 minut zależnie od rozmiaru strony.

---

## 2. Faza 1: Analiza techniczna

### 2.1 Screaming Frog — Crawl SEO

**Co to jest:** Screaming Frog to branżowy standard crawlowania stron — używany przez większość profesjonalnych agencji SEO na świecie. Używamy licencji komercyjnej CLI do działania headless na serwerze.

**Co analizujemy (30+ metryk):**

| Kategoria | Metryki |
|-----------|---------|
| **Strony** | Wszystkie strony HTML, statusy HTTP (200, 301, 302, 404, inne) |
| **Tytuły** | Tytuł strony, długość tytułu (optymalnie 30–70 znaków) |
| **Meta** | Meta description, długość (optymalnie 120–170 znaków) |
| **Nagłówki** | H1, H2, liczba H1 na stronę (błąd = więcej niż 1) |
| **Kanonizacja** | Canonical URL, konflikt canonical vs URL |
| **Dyrektywy** | Meta robots, X-Robots-Tag (noindex, nofollow) |
| **Hreflang** | Znaczniki języka/regionu |
| **Treść** | Liczba słów, Flesch Reading Ease (czytelność) |
| **Linki** | Unikalne linki wewnętrzne, zewnętrzne, broken links |
| **Obrazy** | ALT text, rozmiar (bajty), typ pliku |
| **Indeksowalność** | Status indeksowalności każdej strony |
| **Przekierowania** | URL przekierowania, typ (301/302) |
| **Sitemap** | Wykrycie przez robots.txt i standardowe endpointy |

**Agregaty raportowane:**
- `technical_seo`: brakujące canonical, strony noindex, nofollow, przekierowania, broken links, hreflang
- `links`: linki wewnętrzne, zewnętrzne, broken, przekierowania
- `images`: łączna liczba, z ALT, bez ALT, łączny rozmiar MB

**Dlaczego to ważne dla klienta:** Bez crawla nie widać błędów technicznych — duplikat tytułów, brakujące meta, strony 404 w linkach wewnętrznych. To podstawa każdego audytu.

---

### 2.2 Technical SEO Extras

Dodatkowe sprawdzenia poza standardowym crawlem:

#### Schema.org (Structured Data)
- Parsowanie JSON-LD (w tym z @graph)
- Walidacja pól required/recommended dla każdego typu
- Priorytety błędów: critical / high / medium / low
- AI Crawler Readiness Score (0–100) — jak dobrze strona jest przygotowana do cytowania przez AI Overviews

**Dlaczego ważne:** Schema.org jest coraz ważniejsze dla AI Overviews — Google AI cytuje strony z bogatą strukturą danych.

#### Robots.txt
- Parsowanie user-agents, Disallow/Allow, Crawl-delay
- Wykrycie URL sitemapów z robots.txt
- Alert przy blokowaniu crawlerów (w tym GoogleBot)
- Identyfikacja ważnych ścieżek zablokowanych przypadkowo

#### Sitemap XML
- Pokrycie sitemapy vs przycrawlowane strony
- Nieaktualne wpisy (>6 miesięcy bez aktualizacji)
- Strony w sitemapie ale nie przeindeksowane
- Strony przeindeksowane ale brakujące w sitemapie

#### Konfiguracja domeny
- www vs non-www
- HTTP vs HTTPS
- Spójność przekierowań (canonical URL)

#### Semantyka HTML
- Wykrycie elementów: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`
- Detekcja "div soup" — brak semantycznej struktury HTML

#### Render bez JavaScript
- Sprawdzenie dostępności treści bez JS (ważne dla crawlerów)
- Wykrycie SPA shell — strony ładujące się tylko przez JS
- Liczba linków dostępnych bez JS

#### Soft 404
- Strony z kodem HTTP 200 ale treścią "404 not found"
- Wzorce: "strona nie znaleziona", "404", "not found", "nie znaleziono"

#### Low Content
- Strony z mniej niż 120 słowami (potencjalne thin content)

---

### 2.3 Google Lighthouse — Wydajność i Core Web Vitals

**Dlaczego Lighthouse lokalnie (nie PageSpeed API):**
- Zero limitów zapytań
- Pełne dane (nie skrót z API)
- Brak opóźnień sieciowych
- Desktop I mobile w jednym przebiegu

**Co mierzymy:**

| Metryka | Co oznacza | Dobra wartość |
|---------|-----------|--------------|
| **Performance Score** | Ogólny wynik wydajności | ≥90 |
| **FCP** (First Contentful Paint) | Czas do pojawienia pierwszych treści | ≤1.8s |
| **LCP** (Largest Contentful Paint) | Czas do wyrenderowania największego elementu | ≤2.5s |
| **CLS** (Cumulative Layout Shift) | Stabilność układu strony | ≤0.1 |
| **TBT** (Total Blocking Time) | Czas blokowania głównego wątku | ≤200ms |
| **TTFB** (Time to First Byte) | Czas odpowiedzi serwera | ≤600ms |
| **Speed Index** | Jak szybko widać treść | ≤3.4s |
| **Accessibility Score** | Dostępność dla niepełnosprawnych | ≥90 |
| **Best Practices Score** | Najlepsze praktyki webowe | ≥90 |
| **SEO Score** | Techniczne SEO według Lighthouse | ≥90 |

Pomiar na **desktop i mobile osobno** — Google indeksuje mobile-first, więc mobile jest kluczowy.

---

### 2.4 Senuto — Widoczność, Backlinki, AI Overviews

**Co to jest Senuto:** Największa polska baza danych o widoczności w Google — obejmuje polski rynek lepiej niż Ahrefs czy SEMrush. Używamy ~20 endpointów Senuto API.

#### Widoczność organiczna
- Statystyki domeny: TOP3, TOP10, TOP50, Domain Rank, ekwiwalent reklam (PLN)
- Sezonowość ruchu (wykres roczny)
- Rozkład pozycji (ile słów w TOP3 vs TOP10 vs TOP50)
- Lista pozycjonowanych słów kluczowych (z pozycją, trudnością, CPC, intencją, snippetami)
- Wzrosty pozycji (wins) — co zyskaliśmy vs zeszły miesiąc
- Straty pozycji (losses) — co straciliśmy
- Kanibalizacja — strony rywalizujące o te same słowa
- Sekcje / subdomeneny

#### Backlinki
- Statystyki: liczba backlinków, domen linkujących (referring domains)
- Atrybuty linków (follow / nofollow)
- Chmura anchorów
- Lista najważniejszych backlinków

#### Konkurenci organiczni
- Domeny z największą liczbą wspólnych słów kluczowych
- Luki w słowach kluczowych vs konkurenci

#### AI Overviews (unikalny feature)
- Statystyki widoczności w AI Overviews Google
- Lista słów kluczowych gdzie strona pojawia się w AI Overviews
- Konkurenci w AI Overviews
- To newralgiczny trend — Google AI "pochłania" ruch organiczny

---

### 2.5 Analiza Konkurentów

- Do **3 konkurentów** per audyt
- Dla każdego: Lighthouse desktop (wydajność i CWV)
- Porównanie AI: Performance Score vs twoja strona (alert jeśli różnica >10 pkt)
- Analiza słabych stron, mocnych stron i szans vs konkurentów

Konkurenci mogą być dodani przy tworzeniu audytu lub w konfiguracji harmonogramu.

---

## 3. Scoring — jak liczymy wyniki

### SEO Score (0–100)
Bazuje na wynikach Screaming Frog + Lighthouse SEO:

| Problem | Kara |
|---------|------|
| Brak tytułu strony | -20 pkt |
| Tytuł za krótki (<30) lub za długi (>70) | -10 pkt |
| Brak meta description | -15 pkt |
| Meta za krótka (<120) lub za długa (>170) | -8 pkt |
| Brak H1 | -15 pkt |
| Więcej niż 1 H1 | -10 pkt |
| Obrazy bez ALT (proporcjonalnie) | do -10 pkt |
| Brak sitemapy | -10 pkt |

Końcowy: `(score_crawl × 0.7) + (lighthouse_seo × 0.3)`, zakres 0–100.

### Performance Score (0–100)
Bezpośrednio z Lighthouse desktop.

### Content Score (0–100)
Generowany przez analizę AI treści strony.

### Overall Score (0–100)
`(seo_score + performance_score + content_score) / 3`

### Schema AI Readiness Score (0–100)
Ocena gotowości Schema.org na cytowanie przez AI Overviews.

---

## 4. Faza 2: Analiza AI — 9 obszarów

Każdy obszar analizowany przez Gemini 3.0 Flash, z dostępem do GLOBAL_SNAPSHOT (spójność między modułami):

| Obszar | Co analizuje | Kluczowe outputy |
|--------|-------------|-----------------|
| **SEO** | Crawl data, tytuły, meta, H1, Schema, render | key_findings, recommendations, quick_wins, schema_recommendations |
| **Performance** | CWV desktop vs mobile, LCP, CLS, TTFB | recommendations, desktop_vs_mobile_comparison |
| **Visibility** | Pozycje, wzrosty/straty, sezonowość, competitors | keyword_opportunities, competitor_gaps, seasonality_strategy |
| **AI Overviews** | Widoczność w AI Overviews, słowa kluczowe | aio_opportunities, content_rewrite_targets |
| **Backlinks** | Profil linków, anchory, referring domains | toxic_risk_assessment, anchor_diversity_score, link_building_suggestions |
| **Links** | Linki wewnętrzne, orphan pages, link juice | orphan_pages, link_juice_distribution, silo_suggestions |
| **Images** | ALT, rozmiar, formaty | missing_alt_count, oversized_images, format_suggestions |
| **Security** | HTTPS, nagłówki bezpieczeństwa, best practices | key_findings, priority_issues |
| **UX** | Dostępność, semantyka HTML, mobile usability | key_findings, recommendations |

**Dodatkowe analizy AI:**
- Local SEO (wykrycie business lokalnego, NAP, Schema LocalBusiness)
- Tech stack detection (jaki CMS/framework używa strona)
- Analiza treści (jakość, ton, czytelność, ROI action plan)

---

## 5. Strategia cross-tool

Po 9 kontekstowych analizach, Gemini robi analizę strategiczną całości:

- **Cross-tool correlations** — korelacje między wynikami narzędzi (np. wolny TTFB + słaba widoczność = problem serwera który wpływa na ranking)
- **Synergies** — gdzie jedno działanie poprawi wiele metryk jednocześnie
- **Conflicts** — gdzie rekomendacje mogą być sprzeczne
- **Roadmap** — 4 horyzonty: natychmiastowe, krótkoterminowe (1–4 tyg), średnioterminowe (1–3 msc), długoterminowe (3+ msc)
- **Executive Summary** — zrozumiałe dla zarządu: ocena zdrowia, mocne strony, krytyczne problemy, potencjał wzrostu
- **Quick Wins** — lista do 24 najlepszych natychmiastowych wygranych z wszystkich modułów

---

## 6. Faza 3: Execution Plan

**To jest główna różnica vs inne narzędzia.** Nie kończymy na rekomendacjach — dajemy gotowe zadania z kodem.

### 8 modułów generowania zadań:

| Moduł | Przykładowe zadania |
|-------|---------------------|
| **SEO** | Popraw tytuł strony głównej (z przykładem), dodaj canonical URL, usuń duplicate meta descriptions, zaktualizuj Schema.org (z gotowym JSON-LD) |
| **Performance** | Optymalizuj LCP (konwertuj obrazy do WebP), usuń render-blocking JS, dodaj lazy loading, skonfiguruj CDN |
| **Visibility** | Rozwiń treść o X słów kluczowych, utwórz landing page dla "keyword", naprawa kanibalizacji |
| **AI Overviews** | Dodaj FAQ strukturę (JSON-LD), przepisz wstęp artykułu, optymalizuj nagłówki pod AI |
| **Links** | Dodaj linki wewnętrzne do orphan pages, utwórz hub stron, popraw nawigację |
| **Images** | Dodaj ALT do X obrazów (z sugestiami ALT), skompresuj obrazy powyżej 100KB, konwertuj do WebP |
| **UX** | Popraw dostępność (kontrasty, ARIA labels), popraw nawigację mobilną |
| **Security** | Dodaj nagłówki bezpieczeństwa (z gotową konfiguracją nginx), wymuś HTTPS |

### Struktura każdego zadania:
- **Tytuł** — krótki, konkretny
- **Opis** — co i dlaczego
- **Priorytet** — critical / high / medium / low
- **Impact** — efekt na SEO/performance/UX (1–10)
- **Effort** — nakład pracy (easy / medium / hard)
- **Quick Win** — oznaczenie jeśli wysoki impact + easy effort
- **Fix data** — gotowy kod lub konkretne instrukcje wdrożenia

**Limit:** do 200 zadań per audyt, posortowanych wg priorytetu.

---

## 7. AI Chat (RAG)

Po zakończeniu audytu użytkownik może **rozmawiać z wynikami** przez chat AI:

- **Kontekst:** chat wie wszystko o tym konkretnym audycie (RAG — Retrieval Augmented Generation)
- **Silnik:** Qdrant vector search + Gemini embeddings
- **Chunking:** wyniki AI, executive summary, roadmap, quick wins, zadania — podzielone na fragmenty i zaindeksowane
- **Streaming:** odpowiedzi przez SSE (real-time, jak ChatGPT)
- **Multimodal:** można wrzucić screenshot, PDF, CSV — Gemini go przeanalizuje w kontekście audytu
- **Follow-up:** AI sugeruje 3 kolejne pytania po każdej odpowiedzi
- **Agenci:** różne osobowości (ogólny, techniczny, contentowy) z customowymi promptami

**Limity:** Free: 100 wiadomości/msc, Pro: 500/msc, Enterprise: unlimited.

---

## 8. Raporty PDF

Trzy formaty dopasowane do odbiorcy:

| Format | Strony | Dla kogo | Co zawiera |
|--------|--------|---------|------------|
| **Executive Summary** | 15–25 | Zarząd, CEO | Overall score, mocne strony, krytyczne problemy, quick wins, roadmap |
| **Standard Report** | 50–80 | Marketing, PM | Pełna analiza SEO + wydajność + widoczność + AI rekomendacje |
| **Full Audit Report** | 80–150+ | Agencje, devs | Wszystko: dane techniczne, screenshoty, Execution Plan, lista zadań |

**Generowane przez:** WeasyPrint (Python) + matplotlib (wykresy)  
**White-label ready:** Logo klienta można dodać do raportu (Enterprise)

---

## 9. Harmonogramy automatycznych audytów

- Częstotliwości: **daily / weekly / monthly**
- Konfiguracja: URL, workspace, projekt, z konkurentami lub bez
- Worker sprawdza kolejkę co 10 sekund
- Historia audytów pozwala śledzić trendy w czasie

**Dla agencji:** ustaw harmonogram dla każdego klienta i zapomnij — platforma sama robi audyty i generuje raporty.

---

*Aktualizacja: Marzec 2026*
