# Strona Dokumentacja / Centrum pomocy — Brief

Dokument kreatywny dla agenta AI budującego odświeżoną stronę centrum pomocy (help center) SiteSpector. 10 głównych sekcji z linkami do artykułów.

---

## Meta

- **title**: Dokumentacja — SiteSpector | Centrum pomocy
- **description**: Pełna dokumentacja SiteSpector: jak zacząć, panel audytu, Execution Plan, raporty PDF, zespoły, harmonogramy, integracje. Wszystkie instrukcje w jednym miejscu.
- **keywords**: dokumentacja SiteSpector, pomoc audyt SEO, Execution Plan, Senuto integracja, raport PDF

---

## Sekcja: Hero

**Headline:**
> **Centrum pomocy** SiteSpector

**Subheadline:**
> Wszystko, co musisz wiedzieć, aby skutecznie korzystać z audytów: od pierwszego uruchomienia po zaawansowane funkcje — Execution Plan, PDF, zespoły i integracje.

**Design:** Krótki hero, możliwa ikona RiQuestionLine lub RiBookOpenLine.

---

## Sekcja: Kategorie dokumentacji (10 sekcji)

**Label:** WYBIERZ TEMAT

**10 bloków (karty lub accordion) z linkami do podstron:**

### 1. Jak zacząć
- Rejestracja i pierwsze logowanie
- Pierwszy audyt krok po kroku (URL, opcje, uruchomienie)
- Konfiguracja Senuto (API key, kraj analizy)
- Plan Free vs Pro — co zawiera

**Link:** `/docs/jak-zaczac`

### 2. Panel audytu
- Przegląd wszystkich zakładek: SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images
- AI Strategy, Quick Wins, Deep Content, UX Check, Security
- Competitors, Benchmark, Architecture
- Client Report, PDF, Raw Data, Per-page Analysis
- Execution Plan — osobna sekcja poniżej

**Link:** `/docs/panel-audytu`

### 3. Execution Plan
- Jak działają zadania (AI generuje z priorytetami)
- Śledzenie statusu: do zrobienia, w toku, wykonane
- Notatki do zadań
- Filtr quick wins
- Eksport zadań

**Link:** `/docs/execution-plan`

### 4. Raporty PDF
- 9 sekcji raportu
- White-label (Pro, Enterprise)
- Eksport surowych danych
- Wysyłka do klienta

**Link:** `/docs/raporty-pdf`

### 5. Zespoły i Workspace'y
- Role: Właściciel, Admin, Członek
- Zapraszanie użytkowników
- Przełączanie między workspace'ami
- Współdzielone audyty

**Link:** `/docs/zespoly-workspaces`

### 6. Harmonogramy
- Audyty dzienne, tygodniowe, miesięczne
- Konkurenci w harmonogramie
- Powiadomienia
- Zarządzanie harmonogramami

**Link:** `/docs/harmonogramy`

### 7. Subskrypcje i płatności
- Plany Free, Pro, Enterprise
- Stripe — płatność, faktury
- Customer Portal — zmiana planu, anulowanie
- Limit audytów

**Link:** `/docs/subskrypcje-platnosci`

### 8. Integracje
- Senuto — konfiguracja API, jakie dane pobieramy
- Screaming Frog, Lighthouse — wewnętrzne (Docker)
- Stripe, Supabase — infrastruktura

**Link:** `/docs/senuto-integracja` lub `/docs/integracje`

### 9. AI Analiza
- Co analizuje Gemini (treść, wydajność, UX, bezpieczeństwo)
- Jakie dane wysyłamy do AI
- Kontekstowe analizy per obszar
- Ograniczenia i prywatność

**Link:** `/docs/ai-analiza`

### 10. Bezpieczeństwo
- Dane w UE (Supabase AWS EU, VPS Hetzner DE)
- RLS (Row Level Security)
- SSL, szyfrowanie
- Zgodność z RODO/GDPR

**Link:** `/docs/bezpieczenstwo`

---

## Sekcja: Szybkie linki (opcjonalnie)

**Lista najczęściej zadawanych pytań z linkami do odpowiednich sekcji.**
- Jak dodać pierwszy audyt?
- Gdzie znaleźć Execution Plan?
- Jak skonfigurować Senuto?
- Jak wygenerować raport PDF?

---

## Sekcja: CTA — Nie znalazłeś odpowiedzi?

**Label:** POTRZEBUJESZ POMOCY?

**Headline:** Nie znalazłeś **odpowiedzi** na swoje pytanie?

**Copy:**
> Napisz do nas. Odpowiadamy w 24 godziny w dni robocze. Możesz też wypróbować SiteSpector — wiele rzeczy odkryjesz, eksperymentując z pierwszym audytem.

**CTA Primary:** Skontaktuj się z nami → `/kontakt`

**CTA Secondary:** Rozpocznij darmowy audyt → `/login`

---

## Grafiki

| Sekcja        | Opis | Rozmiar |
|---------------|------|---------|
| Hero          | Ikona książki lub pomocy | 64x64 px |
| Kategorie     | Ikony per kategoria (np. RiUserAddLine, RiDashboardLine) | 48x48 px |

---

## Uwagi designu

- Layout: sidebar (kategorie) + główna treść lub kartowy grid z kategoriami.
- Każda kategoria to link do podstrony `/docs/[slug]` z pełnym artykułem.
- Styl: czytelny, hierarchia h2/h3, lista punktów. Zgodny z resztą landingu.
- Search: opcjonalnie pole wyszukiwania po treści artykułów (future).
