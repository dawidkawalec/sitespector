# Strona Jak to działa — Brief

Dokument kreatywny dla agenta AI. Krok po kroku wyjaśnienie 3-fazowego audytu SiteSpector. Wizualne, z opisami grafik do każdego kroku.

---

## Meta

- **title**: Jak to działa — SiteSpector | 3-fazowy audyt w 3 minuty
- **description**: Wpisz URL, skonfiguruj audyt i poczekaj. SiteSpector: faza 1 (techniczna), faza 2 (AI), faza 3 (Execution Plan). Wyniki w 1–3 minuty.
- **keywords**: jak działa SiteSpector, audyt SEO krok po kroku, 3 fazy audytu, Execution Plan, jak zrobić audyt strony

---

## Struktura strony

Layout: sekcje `<section className="section">`, każdy krok jako osobna sekcja z ikoną/obrazem i tekstem. Można użyć timeline (linia pionowa) lub numerowanych kart. Design: jasny, czytelny, z dużą ilością białej przestrzeni.

---

## Hero

**Tytuł:** Jak działa audyt SiteSpector?

**Subheadline:**
> Trzy fazy. Jedno narzędzie. Wyniki w 1–3 minuty. Od URL do gotowego planu wykonania z kodem.

**Grafika:** Ilustracja schematyczna 3 faz — 3 prostokąty/kolumny połączone strzałkami (Techniczna → AI → Execution Plan). Kolory: #0b363d, #ff8945. Minimalistyczny, flat style.

---

## Krok 1: Wpisz URL i skonfiguruj

**Numer:** 1

**Tytuł:** Wpisz URL i skonfiguruj audyt

**Opis:**
> Podaj adres strony, którą chcesz zaudytować. Opcjonalnie dodaj do 3 konkurentów (plan Pro/Enterprise) — porównamy wyniki. Wybierz kraj analizy Senuto (np. Polska) — dane widoczności będą dopasowane do rynku.

**Co konfigurujesz:**
- URL strony docelowej
- Konkurenci (opcjonalnie, do 3)
- Kraj Senuto (Polska, Niemcy, UK, itd.)
- Opcje zaawansowane (limit stron crawla, jeśli dostępne)

**Grafika:** Screenshot formularza nowego audytu — pole URL, pola na konkurentów, dropdown kraju. Czysty formularz, przycisk „Uruchom audyt”.

---

## Krok 2: Faza 1 — Techniczna (1–2 min)

**Numer:** 2

**Tytuł:** Faza 1: Analiza techniczna

**Opis:**
> SiteSpector równolegle uruchamia kilka silników. Crawler (Screaming Frog) skanuje stronę i zbiera dane o meta tagach, nagłówkach, linkach i obrazach. Lighthouse mierzy wydajność na desktopie i mobile — Core Web Vitals, Performance Score. Senuto pobiera dane o widoczności, backlinkach i AI Overviews. Konkurenci są analizowani analogicznie.

**Czas:** Ok. 1–2 minuty (zależnie od wielkości strony i obciążenia)

**Co jest zbierane:**
- Dane crawla (SEO, struktura, linki, obrazy)
- Metryki Lighthouse desktop + mobile
- Dane Senuto (pozycje, visibility, backlinki, AI Overviews)
- Dane konkurentów (jeśli dodani)

**Grafika:** Screenshot/diagram pokazujący równoległe działanie: 4 „bloki” (Screaming Frog, Lighthouse Desktop, Lighthouse Mobile, Senuto) zbiegające się w jeden wynik. Ikony narzędzi, strzałki „parallel”. Albo: screenshot ekranu „Audyt w toku” z paskiem postępu i listą etapów (Crawl…, Lighthouse…, Senuto…).

---

## Krok 3: Faza 2 — Analiza AI (w tle)

**Numer:** 3

**Tytuł:** Faza 2: Analiza AI

**Opis:**
> Gdy dane techniczne są gotowe, Google Gemini przetwarza je w tle. AI analizuje treść (thin content, duplikaty, słowa kluczowe), interpretuje wydajność (co blokuje LCP, dlaczego CLS jest wysoki), ocenia UX i bezpieczeństwo. Generuje kontekstowe rekomendacje, cross-tool korelacje, executive summary i listę quick wins. Wykrywa tech stack i porównuje z benchmarkiem branżowym.

**Czas:** Wykonywane równolegle lub tuż po fazie 1. Użytkownik widzi postęp w dashboardzie.

**Co generuje AI:**
- Analiza treści (Deep Content)
- Analiza wydajności (interpretacja Lighthouse)
- UX Check
- Security Check
- Tech Stack Detection
- Benchmark branżowy
- Executive summary
- Quick wins
- Korelacje cross-tool

**Grafika:** Screenshot zakładki AI Strategy — executive summary, lista quick wins. Albo: animowana ikona „AI thinking” / „Analiza w toku” z podpisem „Gemini przetwarza dane…”.

---

## Krok 4: Faza 3 — Execution Plan (automatyczna)

**Numer:** 4

**Tytuł:** Faza 3: Execution Plan

**Opis:**
> Na podstawie wszystkich zebranych danych AI generuje konkretny plan wykonania. Nie abstrakcyjne „popraw meta tagi”, ale zadania z priorytetami, tagami (np. quick win) i **gotowym kodem** do wklejenia. Każde zadanie możesz odznaczyć jako wykonane i dodać notatkę. Plan jest gotowy do przekazania developerowi lub agencji.

**Co zawiera Execution Plan:**
- Zadania pogrupowane po typie (SEO, Performance, Content, UX, Security)
- Priorytety (krytyczne → niskie)
- Tag „Quick win” przy prostych zadaniach
- Bloki kodu (HTML, CSS, JS, schema.org itp.)
- Checkboxy do odznaczania
- Pole na notatki

**Grafika:** Screenshot Execution Plan z 3–4 zadaniami. Jedno rozwinięte — widoczny tytuł, priorytet, tag „Quick win”, blok kodu (np. meta description lub schema). Checkbox „Wykonane”.

---

## Krok 5: Przeglądaj wyniki w dashboardzie

**Numer:** 5

**Tytuł:** Przeglądaj wyniki w dashboardzie

**Opis:**
> Wszystkie dane są dostępne w jednym miejscu. Zakładki: SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images, AI Strategy, Quick Wins, Deep Content, UX Check, Security, Competitors, Benchmark, Execution Plan, Per-page Analysis. Eksportuj surowe dane (Raw Data) lub wygeneruj widok dla klienta (Client Report).

**Zakładki (skrót):**
- SEO, Performance, Visibility, AI Overviews, Backlinks
- Links, Images, AI Strategy, Quick Wins
- Deep Content, UX Check, Security
- Competitors, Benchmark, Execution Plan
- Per-page Analysis, Client Report, Raw Data

**Grafika:** Screenshot głównego dashboardu z widocznymi zakładkami (tabs) i zawartością jednej z nich (np. SEO lub Performance). Pokazać nawigację i bogactwo danych.

---

## Krok 6: Pobierz raport PDF / eksportuj dane

**Numer:** 6

**Tytuł:** Pobierz raport PDF i eksportuj dane

**Opis:**
> Wygeneruj profesjonalny raport PDF z 9 sekcjami. W planach Pro i Enterprise — white-label z własnym logo. Dane możesz też eksportować (API w Pro/Enterprise) lub udostępnić klientowi przez widok Client Report.

**Opcje:**
- Raport PDF (9 sekcji, white-label w Pro+)
- Client Report — widok uproszczony dla klienta
- Raw Data — surowe dane crawla i Lighthouse
- API — programatyczny dostęp (Pro, Enterprise)

**Grafika:** Screenshot przycisku „Pobierz PDF” i/lub przykładowej strony PDF. Albo: ikona raportu + lista formatów (PDF, API, Client Report).

---

## Sekcja: Timeline (opcjonalna)

**Tytuł:** Podsumowanie — 3 fazy w 3 minuty

**Timeline wizualny:**
```
[0:00] Uruchomienie → [0:30–1:30] Faza 1 (techniczna) → [1:30–2:30] Faza 2 (AI) + Faza 3 (Execution Plan) → [2:30–3:00] Gotowe
```

**Grafika:** Prosty timeline — linia pozioma z 4 punktami: Start, Faza 1, Faza 2+3, Gotowe. Czasy pod spodem.

---

## Sekcja: CTA

**Tytuł:** Gotowy na pierwszy audyt?

**Opis:** Załóż konto w 30 sekund. Plan Free — 5 audytów miesięcznie, bez karty kredytowej.

**CTA:** Rozpocznij Darmowy Audyt → `/login`

**Link:** Zobacz pełną listę funkcji → `/funkcje`
