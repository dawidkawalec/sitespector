# Strona Integracje — Brief

Dokument kreatywny dla agenta AI budujący stronę głębokiego opisu integracji SiteSpector. Docelowa grupa: odbiorcy techniczni, chcący zrozumieć, co napędza platformę.

---

## Meta

- **title**: Integracje — Screaming Frog, Lighthouse, Senuto, Gemini AI | SiteSpector
- **description**: Pełny opis integracji SiteSpector: Screaming Frog (crawling), Google Lighthouse (Core Web Vitals), Senuto (widoczność, AI Overviews), Gemini AI (analiza), Stripe, Supabase. REST API w przygotowaniu.
- **keywords**: SiteSpector integracje, Screaming Frog API, Senuto API, Lighthouse Docker, Gemini AI audyt SEO, technologia SiteSpector

---

## Struktura strony

Layout: sekcja `<section className="section">` per integracja. Nagłówek: `title-sm` + `main-title` + opis. Długie sekcje z podpunktami. Możliwość accordion/collapse dla szczegółów. Grafika per integracja.

---

## Sekcja 1: Hero

**Label:** TECHNOLOGIA

**Headline:**
> Zbudowany na **sprawdzonych narzędziach**

**Subheadline:**
> SiteSpector nie wymyśla koła na nowo. Łączymy branżowe standardy: Screaming Frog, Google Lighthouse, Senuto i Google Gemini. Każda integracja działa w Twoim imieniu — bez instalacji, bez konfiguracji.

**Grafika:**
Diagram lub ikony 4 głównych integracji (SF, LH, Senuto, Gemini) w rzędzie, połączone strzałkami do centralnego logo SiteSpector. Styl flat, kolory #0b363d, #ff8945. 1000x400 px.

---

## Sekcja 2: Screaming Frog — deep-dive

**Label:** CRAWLING SEO

**Tytuł:** **Screaming Frog** SEO Spider — silnik crawlingu

**Opis:**
> Branżowy standard do analizy struktury strony. Crawler skanuje Twoją stronę jak Googlebot i zbiera dane o każdej podstronie.

**Co crawuje:**
- **Meta tagi** — title, description, robots, canonical (brakujące, zduplikowane, za długie)
- **Nagłówki H1–H6** — hierarchia, brakujące H1, duplikaty
- **Obrazy** — brakujące ALT, rozmiary, formaty
- **Linki** — wewnętrzne, zewnętrzne, uszkodzone (broken), nofollow
- **Canonicals** — kanoniczne URL-e, duplikaty
- **Dyrektywy** — noindex, nofollow, hreflang
- **Mapy witryn** — sitemaps XML, wykrywanie

**Jak działa w SiteSpector:**
- Uruchamiany w kontenerze Docker — headless, na serwerze
- Nie potrzebujesz licencji desktopowej — wszystko w chmurze
- Brak ręcznej konfiguracji — wystarczy URL

**Czego NIE musisz robić:**
- Instalować SF na swoim komputerze
- Płacić za osobną licencję
- Konfigurować ręcznie exportów — SiteSpector pobiera dane automatycznie

**Grafika:** Screenshot zakładki SEO — tabela URL-i z kolumnami (status, title, meta description, H1). Lub schemat flow: URL → Docker SF → dane do dashboardu.

---

## Sekcja 3: Google Lighthouse — deep-dive

**Label:** WYDAJNOŚĆ I DOSTĘPNOŚĆ

**Tytuł:** **Google Lighthouse** — desktop + mobile naraz

**Opis:**
> Oficjalne narzędzie Google do audytu wydajności, dostępności i zgodności z najlepszymi praktykami. SiteSpector uruchamia Lighthouse dla desktop i mobile równolegle.

**Core Web Vitals:**
- **LCP** (Largest Contentful Paint) — czas załadowania głównej treści
- **FCP** (First Contentful Paint) — pierwsza treść na ekranie
- **CLS** (Cumulative Layout Shift) — stabilność layoutu („skaczące” elementy)
- **TTFB** (Time to First Byte) — czas do pierwszej odpowiedzi serwera
- **TBT** (Total Blocking Time) — blokowanie wątku głównego
- **Speed Index** — jak szybko wizualnie ładuje się strona

**4 wyniki (0–100):**
- **Performance** — ogólna wydajność
- **Accessibility** — dostępność (kontrast, aria, nazwy elementów)
- **Best Practices** — HTTPS, mixed content, bezpieczeństwo
- **SEO** — podstawowe czynniki SEO (meta, mobile-friendly)

**Szczegółowe audyty:**
> 176 kategoryzowanych audytów — opportunity („możesz poprawić”) i diagnostics („co blokuje”). Każdy z opisem i sugestią naprawy.

**Grafika:** Screenshot zakładki Performance — 4 wyniki (kółka/słupki), Core Web Vitals, lista audytów. Kolory zielony/pomarańczowy/czerwony.

---

## Sekcja 4: Senuto — deep-dive

**Label:** WIDOCZNOŚĆ I AI OVERVIEWS

**Tytuł:** **Senuto** — widoczność, backlinki, AI Overviews

**Opis:**
> Integracja z Senuto API — dane z polskiego rynku. Widoczność, pozycje słów kluczowych, trendy, backlinki i unikalny monitoring AI Overviews.

**Widoczność:**
- **Pozycje** — ranking do 10 000 słów kluczowych
- **Trendy** — wzrost/spadek w czasie
- **Wins i losses** — które frazy zyskały, które straciły
- **Kanibalizacja** — nakładające się strony na te same słowa
- **Sekcje SERP** — rozkład typów wyników (organiczne, featured snippets, PAA)

**AI Overviews:**
- **Statystyki** — ile fraz ma AI Overview, jak często Twoja strona/domena się pojawia
- **Keyword explorer** — które słowa generują AI Overviews
- **Konkurenci** — porównanie z konkurencją w AI Overviews

**Backlinki:**
- **Statystyki** — liczba linków, referring domains
- **Anchory** — rozkład tekstów kotwic (branded, exact match, generic)
- **Atrybuty** — dofollow/nofollow

**Konfiguracja:**
- **Kraj** — Polska, inne (zależnie od Senuto)
- **Tryb pobierania** — pełny / częściowy (limit słów)

**Grafika:** Screenshot zakładki Visibility — tabela słów kluczowych z pozycjami, strzałki trendów. Lub zakładka AI Overviews — statystyki + porównanie z konkurentami.

---

## Sekcja 5: Google Gemini AI — deep-dive

**Label:** ANALIZA AI

**Tytuł:** **Google Gemini** 3.0 Flash — wielowarstwowa analiza

**Opis:**
> Gemini przetwarza dane z crawla, Lighthouse i Senuto. Generuje kontekstowe rekomendacje w 7 obszarach oraz strategiczne podsumowania.

**Obszary analizy (per obszar):**
- **Treść** — thin content, duplikaty, jakość, słowa kluczowe
- **Wydajność** — interpretacja metryk Lighthouse, co blokuje LCP
- **UX** — dostępność, użyteczność, nawigacja
- **Bezpieczeństwo** — HTTPS, nagłówki, mixed content
- **Local SEO** — NAP, schema, Google Business
- **Tech stack** — wykrywanie CMS, frameworków
- ** benchmark** — porównanie z branżą (gdy dostępne)

**Analiza strategiczna:**
- **Cross-tool** — korelacje między SEO, wydajnością i widocznością
- **Roadmapa** — priorytetyzowana lista działań
- **Executive summary** — jedna strona, zero żargonu — do prezentacji
- **Quick Wins** — najszybsze do wdrożenia ulepszenia

**Execution Plan:**
- **Zadania z kodem** — np. „Dodaj meta description” + gotowy HTML
- **Priorytety** — krytyczne, wysokie, średnie, niskie
- **Tag quick win** — oznaczanie zadań szybkich do wdrożenia
- **Status** — do zrobienia, w toku, gotowe
- **Notatki** — własne uwagi do zadania

**Grafika:** Screenshot zakładki AI Strategy — executive summary + roadmapa. Lub Execution Plan z zadaniem zawierającym blok kodu.

---

## Sekcja 6: Stripe

**Label:** PŁATNOŚCI

**Tytuł:** **Stripe** — subskrypcje i płatności

**Opis:**
> Bezpieczne płatności przez Stripe. Subskrypcje (Free, Pro, Enterprise), faktury, Customer Portal — zarządzanie planem w jednym miejscu. PCI DSS — nie przechowujemy danych kart.

**Funkcje:**
- Płatności kartą i innymi metodami (Stripe)
- Automatyczne odnawianie subskrypcji
- Customer Portal — zmiana planu, anulowanie, historia faktur
- Webhooks — synchronizacja statusu płatności z platformą

---

## Sekcja 7: Supabase

**Label:** AUTH I BAZA DANYCH

**Tytuł:** **Supabase** — auth, RLS, zespoły

**Opis:**
> Autentykacja, baza danych PostgreSQL i Row Level Security. Zespoły, workspace'y, role — izolacja danych per workspace. Każdy użytkownik widzi tylko swoje projekty.

**Funkcje:**
- Auth — e-mail/hasło, OAuth (Google, GitHub — jeśli włączone)
- RLS — polityki bezpieczeństwa na poziomie wiersza
- Workspace'y — osobna przestrzeń per klient/projekt
- Role — Właściciel, Admin, Członek (per workspace)

---

## Sekcja 8: REST API

**Label:** API

**Tytuł:** **REST API** — w przygotowaniu

**Opis:**
> Docelowo: REST API do integracji z własnymi systemami. Uruchamianie audytów, pobieranie wyników, eksport danych. Dostępne w planie Pro i Enterprise. Szczegóły w Dokumentacji.

**CTA:** Sprawdź dokumentację API → `/docs/api` (jeśli istnieje)

---

## Sekcja 9: CTA

**Tytuł:** Chcesz zobaczyć, jak to **działa w praktyce**?

**Opis:** Rozpocznij darmowy audyt — 5 audytów miesięcznie, bez karty kredytowej.

**CTA Primary:** Rozpocznij darmowy audyt → `/login`

**CTA Secondary:** Zobacz jak to działa → `/jak-to-dziala`
