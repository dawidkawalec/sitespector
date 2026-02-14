# Strona Changelog — Brief

Dokument kreatywny dla agenta AI budującego odświeżoną stronę changelog SiteSpector. Aktualizacje zgrupowane wg miesięcy z ikonami (feature/improvement/fix).

---

## Meta

- **title**: Changelog — SiteSpector | Co nowego
- **description**: Historia aktualizacji SiteSpector: nowe funkcje, ulepszenia i poprawki. Senuto, AI Overviews, Execution Plan, 3-fazowy audyt, harmonogramy — sprawdź, co się zmieniło.
- **keywords**: changelog SiteSpector, co nowego, aktualizacje, nowe funkcje

---

## Sekcja: Hero

**Headline:**
> **Changelog** — co nowego w SiteSpector

**Subheadline:**
> Śledź rozwój platformy. Nowe funkcje, ulepszenia i poprawki w jednym miejscu.

---

## Struktura wpisów

**Format per miesiąc:**
- Nagłówek: **YYYY-MM** (np. 2026-02)
- Lista wpisów z ikonami:
  - **Feature** (🆕 / RiAddCircleLine) — nowa funkcja
  - **Improvement** (✨ / RiMagicLine) — ulepszenie
  - **Fix** (🐛 / RiBugLine) — poprawka

**Przykład wpisu:**
```
### [Feature] Integracja Senuto
Widoczność, pozycje, trendy, backlinki i AI Overviews z Senuto w jednym audycie. Konfiguracja API w ustawieniach.
```

---

## Wpisy — Luty 2026 (pełna lista)

**2026-02**

### [Feature] Integracja Senuto
Widoczność, pozycje, trendy, backlinki i monitoring AI Overviews z Senuto. Dane z polskiego rynku SEO w jednym audycie. Konfiguracja API w ustawieniach konta.

### [Feature] AI Overviews
Monitoring, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google. Unikalna funkcja w połączeniu z Senuto — śledź wpływ AI na widoczność.

### [Feature] Execution Plan
AI generuje konkretne zadania z priorytetami, tagami quick win i gotowym kodem. Odznaczaj wykonane, dodawaj notatki. Nie tylko „co poprawić”, ale „jak to zrobić”.

### [Feature] 3-fazowy audyt
Pełny flow: faza techniczna (Screaming Frog + Lighthouse + Senuto) → Analiza AI (treść, wydajność, UX, bezpieczeństwo) → Execution Plan. Wyniki w 1–3 minuty.

### [Feature] Kontekstowa analiza AI per obszar
Gemini analizuje każdy obszar audytu osobno z pełnym kontekstem: SEO, Performance, Visibility, Backlinks, treść, UX, bezpieczeństwo.

### [Feature] Zaplanowane audyty
Harmonogramy dzienne, tygodniowe, miesięczne. Audyt uruchamia się automatycznie. Możliwość dodania konkurentów do harmonogramu.

### [Feature] Głęboka analiza treści
Wykrywanie thin content, duplikatów, brakujących meta tagów. Priorytetyzacja stron do optymalizacji.

### [Feature] Analiza UX
Dostępność, użyteczność, Core Web Vitals w kontekście doświadczenia użytkownika. Rekomendacje z Execution Plan.

### [Feature] Analiza bezpieczeństwa
HTTPS, nagłówki bezpieczeństwa, mixed content. Osobna zakładka Security w panelu audytu.

### [Feature] Benchmarki branżowe
Porównaj wyniki z benchmarkami. Zobacz, gdzie Twoja strona stoi na tle branży.

### [Improvement] Przyspieszenie analizy AI
Optymalizacja pipeline'u — szybsze wyniki bez utraty jakości.

### [Improvement] Ulepszony eksport PDF
9 sekcji raportu, lepsze formatowanie, white-label w Pro i Enterprise.

---

## Wpisy — styczeń 2026 (skrócone)

**2026-01**

### [Feature] Zespoły i Workspace'y
Role (Właściciel, Admin, Członek), zaproszenia, współdzielone audyty.

### [Feature] Konkurenci w audycie
Dodaj do 3 domen konkurencyjnych (Pro). Porównanie widoczności i backlinków.

### [Improvement] Panel audytu
Nowe zakładki, lepsza nawigacja, responsywność.

### [Fix] Poprawki w crawlingu
Stabilność dla dużych stron.

---

## Wpisy — grudzień 2025 (skrócone)

**2025-12**

### [Feature] Raporty PDF
9 sekcji, white-label, eksport surowych danych.

### [Feature] Integracja Stripe
Subskrypcje, Customer Portal, zarządzanie planami.

### [Improvement] Lighthouse mobile
Pełna analiza Core Web Vitals na mobile.

---

## Design wpisów

**Layout:** Lista chronologiczna, najnowsze na górze. Każdy miesiąc w osobnym bloku z datą. Wpisy z ikoną + tytuł + krótki opis.

**Przykład HTML/React:**
```tsx
<div className="changelog-month">
  <h3>2026-02</h3>
  <ul>
    <li><RiAddCircleLine className="text-success" /> [Feature] Integracja Senuto — ...</li>
    ...
  </ul>
</div>
```

---

## Sekcja: CTA

**Label:** CHCESZ WIĘCEJ?

**Headline:** Wypróbuj nowe funkcje **na własnych stronach**

**CTA:** Rozpocznij darmowy audyt → `/login`

---

## Grafiki

Brak dodatkowych grafik — ikony React Icons wystarczą. Opcjonalnie: banner „Nowe w lutym” z listą 3–4 headline features.

---

## Uwagi designu

- Czytelna hierarchia: rok-miesiąc jako h2, wpisy jako lista lub karty.
- Kolor ikon: feature = success (zielony), improvement = info (cyan), fix = warning (żółty) — zgodnie z paletą.
- Mobile: lista jednowarstwowa, bez zagnieżdżonych accordionów (chyba że bardzo długi changelog).
