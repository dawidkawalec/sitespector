# Strona Case studies (indeks) — Brief

Dokument kreatywny dla agenta AI budującego stronę listującą case studies SiteSpector. Karty z preview, kategorie, linki do pełnych studiów.

---

## Meta

- **title**: Case studies — SiteSpector | Przykłady sukcesów SEO
- **description**: Sprawdź, jak agencje, sklepy i freelancerzy wykorzystują SiteSpector do audytów SEO. Przed i po, kluczowe metryki, wyzwania i rozwiązania.
- **keywords**: case study SEO, audyt strony case study, SiteSpector przykłady, sukces SEO

---

## Sekcja: Hero

**Headline:**
> **Case studies** — prawdziwe wyniki

**Subheadline:**
> Zobacz, jak agencje SEO, sklepy e-commerce i freelancerzy wykorzystują SiteSpector do audytów, weryfikacji agencji i wzrostu widoczności.

**Design:** Hero standardowy, `bg-light` lub `bg-white`.

---

## Sekcja: Kategorie (opcjonalny filtr)

**4 kategorie:**
- Agencja SEO
- E-commerce
- Freelancer
- Weryfikacja agencji

**Design:** Przyciski lub chipy do filtrowania. Domyślnie: wszystkie.

---

## Sekcja: Karty case studies (4–6 sztuk)

**Struktura jednej karty:**
1. **Obraz** — okładka (screenshot dashboardu, wykres „przed/po” lub ilustracja branży)
2. **Kategoria** — tag (np. „Agencja SEO”)
3. **Tytuł** — np. „Jak WebPro skrócił czas audytu o 70%”
4. **Wyzwanie** — 1–2 zdania: z czym zmagali się przed SiteSpector
5. **Kluczowa metryka** — np. „Czas audytu: 4h → 45 min” lub „Pozycje: +23% w 3 miesiące”
6. **CTA** — „Czytaj pełne studium” → link do `/case-study/[slug]`

**Przykładowe case studies (szablony do wypełnienia treścią):**

### 1. Agencja SEO
- **Tytuł:** WebPro — 70% krótszy czas audytu przy tym samym quality
- **Wyzwanie:** Trzy narzędzia (SF, Senuto, Excel), ręczne łączenie danych. Audyt trwał 4 godziny.
- **Metryka:** 4h → 45 min
- **Link:** `/case-study/webpro`

### 2. E-commerce
- **Tytuł:** ModaOnline — wykrycie 2000 pustych meta tagów i zmiana agencji
- **Wyzwanie:** Płacili agencji 3k/mc, nie wiedzieli, co dokładnie robi. Brak transparentności.
- **Metryka:** Weryfikacja agencji → zmiana na lepszą, +18% konwersji
- **Link:** `/case-study/modaonline`

### 3. Freelancer
- **Tytuł:** Studio Pixel — od zera do profesjonalnych raportów za $29
- **Wyzwanie:** Brak budżetu na Ahrefs i SEMrush. Potrzebowali raportów dla klientów.
- **Metryka:** Plan Pro $29 vs $300+ za zestaw narzędzi
- **Link:** `/case-study/studio-pixel`

### 4. Weryfikacja agencji
- **Tytuł:** Inwestor — czy agencja SEO naprawdę działa? Audyt ujawnił braki
- **Wyzwanie:** Podejrzenie, że agencja nie wykonuje obiecanej pracy.
- **Metryka:** Wykrycie brakujących optymalizacji → renegocjacja umowy
- **Link:** `/case-study/weryfikacja-agencji`

### 5. Agencja SEO (drugi)
- **Tytuł:** Rank+ — Execution Plan oszczędza dziesiątki godzin
- **Wyzwanie:** Klienci chcieli nie tylko raportu, ale gotowych zadań do wdrożenia.
- **Metryka:** 40h mniej miesięcznie na przygotowanie zaleceń
- **Link:** `/case-study/rank-plus`

### 6. E-commerce (drugi)
- **Tytuł:** SklepTech — Core Web Vitals i mobile-first
- **Wyzwanie:** Wolna strona na mobile, utrata ruchu.
- **Metryka:** LCP: 4.2s → 1.8s, konwersje mobile +12%
- **Link:** `/case-study/sklep-tech`

---

## Layout kart

**Grid:** 2 kolumny desktop, 1 mobil. Karta: obraz (16:9 lub 4:3), nad obrazem tag kategorii, pod obrazem tytuł + 2–3 linie opisu + metryka w wyróżnieniu (np. badge) + przycisk „Czytaj pełne studium”.

**Design:** Karty `rounded-4`, `shadow-sm`, hover `shadow` + `translateY(-2px)`. Spójne z About/Feature cards.

---

## Sekcja: CTA (strona)

**Label:** TWOJA HISTORIA SUKCESU?

**Headline:** Zacznij swoją **transformację** z SiteSpector

**Copy:**
> Wypróbuj darmowy plan. 5 audytów miesięcznie. Zobacz, czy SiteSpector pasuje do Twojego workflow — tak jak pasuje do setek agencji i sklepów.

**CTA Primary:** Rozpocznij darmowy audyt → `/login`

---

## Grafiki

| Element       | Opis | Rozmiar |
|---------------|------|---------|
| Karty okładki | Screenshot dashboardu, wykres przed/po lub ilustracja branży | 600x360 px (16:9) |
| Hero          | Opcjonalnie: ilustracja „sukces” | 800x300 px |

---

## Uwagi designu

- Każda karta prowadzi do `/case-study/[slug]` — osobna strona z pełnym case study (markdown).
- Kategorie: kolorowe tagi (np. `.badge.bg-primary`, `.badge.bg-orange`).
- Metryka: bold, np. „4h → 45 min” w osobnym wierszu z ikoną RiTrendingUpLine.
