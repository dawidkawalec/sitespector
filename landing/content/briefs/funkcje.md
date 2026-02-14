# Strona Funkcje — Brief

Dokument kreatywny dla agenta AI budującego pełną stronę funkcji SiteSpector. Organizacja według modułów. Każda funkcja: tytuł, opis (2–3 zdania), co sprawdza/robi, które narzędzie.

---

## Meta

- **title**: Funkcje — SiteSpector | Audyt SEO, wydajność, widoczność, AI
- **description**: Pełna lista funkcji SiteSpector: crawling SEO (Screaming Frog), Lighthouse, Senuto, AI Overviews, backlinki, analiza AI, Execution Plan, raporty PDF, zespoły, harmonogramy.
- **keywords**: funkcje SiteSpector, crawling SEO, Core Web Vitals, Senuto, AI Overviews, Execution Plan, raport PDF, audyt SEO

---

## Struktura strony

Layout: sekcja `<section className="section">` per moduł. Nagłówek modułu: `title-sm` + `main-title` + opis. Karty lub lista feature'ów. Opcjonalnie screenshot per sekcja.

---

## Moduł 1: Crawling SEO (Screaming Frog)

**Tytuł modułu:** Crawling SEO

**Opis:**
> Silnik Screaming Frog SEO Spider — branżowy standard do analizy struktury strony. Crawler skanuje Twoją stronę dokładnie tak jak Googlebot i zbiera dane o każdej podstronie.

**Funkcje (lista):**
- **Struktura strony** — mapa wszystkich URL-i, głębokość, status kody (200, 301, 404)
- **Meta tagi** — tytuł, description, robots, canonical — brakujące, zduplikowane, za długie
- **Nagłówki H1–H6** — hierarchia, brakujące, duplikaty H1
- **Linki** — wewnętrzne, zewnętrzne, uszkodzone (broken links), nofollow
- **Obrazy** — brakujące ALT, rozmiary, formaty
- **Redirecty** — 301, 302, łańcuchy przekierowań
- **Duplikaty** — duplicate titles, duplicate meta descriptions
- **Crawl budget** — które strony są indeksowane, które zablokowane

**Narzędzie:** Screaming Frog SEO Spider (Docker container)

**Grafika:** Screenshot zakładki SEO z listą URL-i, tabelą meta tagów, kolumnami (status, title, description, H1). Ciemny teal + pomarańczowe akcenty.

---

## Moduł 2: Wydajność (Lighthouse)

**Tytuł modułu:** Wydajność i Core Web Vitals

**Opis:**
> Oficjalne narzędzie Google — Lighthouse. Analiza desktop i mobile. Core Web Vitals: LCP, FID/INP, CLS. Performance Score, Accessibility, Best Practices.

**Funkcje (lista):**
- **Core Web Vitals** — LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift)
- **Performance Score** — 0–100 z breakdown (speed index, TBT, TTI)
- **Mobile-first** — osobna analiza dla urządzeń mobilnych
- **Diagnostyka** — opportunity, diagnostics (co blokuje renderowanie, co opóźnia)
- **Accessibility** — kontrast, aria, nazwy elementów
- **Best Practices** — HTTPS, mixed content, bezpieczeństwo

**Narzędzie:** Google Lighthouse (Chrome DevTools protocol, Docker)

**Grafika:** Screenshot zakładki Performance z wykresem Core Web Vitals, metrykami LCP/INP/CLS, kolorowymi paskami (zielony/pomarańczowy/czerwony).

---

## Moduł 3: Widoczność (Senuto)

**Tytuł modułu:** Widoczność w Google

**Opis:**
> Integracja z Senuto — dane z polskiego rynku. Pozycje słów kluczowych, trendy, wins/losses, kanibalizacja. Widzisz, jak Twoja strona wypada w wynikach wyszukiwania.

**Funkcje (lista):**
- **Pozycje** — ranking dla wybranych słów kluczowych (kraj z konfiguracji)
- **Trendy** — wzrost/spadek pozycji w czasie
- **Wins i losses** — które frazy zyskały, które straciły
- **Kanibalizacja** — nakładające się strony na te same słowa
- **Visibility score** — syntetyczny wskaźnik widoczności
- **Keyword Explorer** — powiązane frazy, volume, trudność

**Narzędzie:** Senuto API

**Grafika:** Screenshot zakładki Visibility z tabelą słów kluczowych, pozycjami, strzałkami trendów (↑↓), wykresem visibility.

---

## Moduł 4: AI Overviews

**Tytuł modułu:** AI Overviews — monitoring odpowiedzi AI

**Opis:**
> SiteSpector monitoruje, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google (AI Overviews). Jedyna platforma audytowa z tym modułem — sprawdź, czy jesteś widoczny w nowej erze wyszukiwania.

**Funkcje (lista):**
- **AI Overviews statystyki** — ile fraz ma AI Overview, jak często Twoja strona/domena się pojawia
- **Keyword explorer** — które słowa kluczowe generują AI Overviews
- **Konkurenci** — porównanie z konkurencją w AI Overviews
- **Rekomendacje** — jak zwiększyć szansę na pojawienie się w AI

**Narzędzie:** Senuto (AI Overviews data) + analiza AI (Gemini)

**Grafika:** Screenshot zakładki AI Overviews — tabela z kolumnami: słowo kluczowe, czy ma AI Overview, czy Twoja strona występuje, screenshot przykładowej odpowiedzi AI.

---

## Moduł 5: Backlinki

**Tytuł modułu:** Analiza backlinków

**Opis:**
> Dane o linkach przychodzących z Senuto. Widzisz, skąd prowadzą linki do Twojej strony, jakie anchory są używane i ile masz referring domains.

**Funkcje (lista):**
- **Referring domains** — liczba unikalnych domen linkujących
- **Backlinks count** — łączna liczba linków
- **Anchory** — rozkład tekstów kotwic (branded, exact match, generic)
- **Top linking pages** — strony, które linkują do Ciebie
- **Toksyczność** — wskaźnik ryzyka (jeśli dostępny w Senuto)

**Narzędzie:** Senuto API

**Grafika:** Screenshot zakładki Backlinks — wykres lub tabela z referring domains, lista top anchorów.

---

## Moduł 6: Analiza AI (Gemini)

**Tytuł modułu:** Analiza AI — treść, wydajność, UX, bezpieczeństwo

**Opis:**
> Google Gemini przetwarza dane z crawla, Lighthouse i Senuto. Generuje kontekstowe rekomendacje: co poprawić w treści, wydajności, UX i bezpieczeństwie. Cross-tool korelacje, roadmapa, executive summary, quick wins.

**Funkcje (lista):**
- **Analiza treści** — thin content, duplikaty, jakość, słowa kluczowe
- **Analiza wydajności** — interpretacja metryk Lighthouse, co blokuje LCP
- **UX Check** — dostępność, użyteczność, nawigacja
- **Security** — HTTPS, nagłówki bezpieczeństwa, mixed content
- **Tech Stack Detection** — wykrywanie CMS, frameworków
- **Benchmark branżowy** — porównanie z branżą (jeśli dostępne)
- **Per-page analysis** — głęboka analiza pojedynczych stron
- **Cross-tool** — korelacje między SEO, performance i visibility
- **Executive summary** — podsumowanie dla managera
- **Quick wins** — lista najszybszych do wdrożenia ulepszeń

**Narzędzie:** Google Gemini 3.0 Flash (multi-key fallback)

**Grafika:** Screenshot zakładki AI Strategy — executive summary, lista quick wins, roadmapa z priorytetami.

---

## Moduł 7: Execution Plan

**Tytuł modułu:** Execution Plan — zadania z gotowym kodem

**Opis:**
> Killer feature SiteSpector. AI nie mówi tylko „popraw meta tagi” — generuje konkretne zadania z priorytetami, tagami (np. quick win) i **gotowym kodem** do wklejenia. Odznaczaj wykonane, dodawaj notatki. Gotowe do przekazania developerowi lub agencji.

**Funkcje (lista):**
- **Zadania z kodem** — np. „Dodaj meta description” + gotowy HTML
- **Priorytety** — krytyczne, wysokie, średnie, niskie
- **Quick win** — tag dla zadań szybkich do wdrożenia
- **Status** — do zrobienia, w toku, gotowe (checkbox)
- **Notatki** — własne uwagi do zadania
- **Grupowanie** — po typie (SEO, Performance, Content) lub priorytecie

**Narzędzie:** Google Gemini (generacja na podstawie analizy)

**Grafika:** Screenshot Execution Plan — lista 4–5 zadań, jedno rozwinięte z blokiem kodu (np. meta tag, schema.org). Checkboxy, tagi, priorytety.

---

## Moduł 8: Raporty PDF

**Tytuł modułu:** Raporty PDF

**Opis:**
> Profesjonalny raport PDF z 9 sekcjami. Gotowy do wysłania klientowi. White-label w planach Pro i Enterprise — własne logo, branding.

**Funkcje (lista):**
- **9 sekcji** — SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images, AI Strategy, Execution Plan (skrócony)
- **White-label** — własne logo, kolory (Pro, Enterprise)
- **Custom branding** — Enterprise
- **Export** — jeden plik PDF, pobierany z dashboardu

**Narzędzie:** Własna generacja (backend)

**Grafika:** Screenshot przykładowej strony PDF — header z logo, sekcja z tabelą/danymi, profesjonalny layout.

---

## Moduł 9: Zespoły i Workspaces

**Tytuł modułu:** Zespoły i Workspaces

**Opis:**
> Wiele projektów, wiele klientów — każdy w osobnym Workspace. Zapraszaj członków zespołu, przydzielaj role. Izolacja danych przez Row Level Security.

**Funkcje (lista):**
- **Workspaces** — osobna przestrzeń na projekt/klienta
- **Role** — Właściciel, Admin, Członek
- **Zaproszenia** — e-mail, link
- **Izolacja** — użytkownik widzi tylko swoje workspace'y
- **Audyty per workspace** — lista audytów w danym projekcie

**Narzędzie:** Supabase (auth, RLS)

**Grafika:** Screenshot listy workspace'ów lub ekranu zaproszenia członka.

---

## Moduł 10: Harmonogramy

**Tytuł modułu:** Harmonogramy audytów

**Opis:**
> Automatyczne uruchamianie audytów w wybranych odstępach. Monitoruj zmiany w czasie — np. co tydzień lub co miesiąc.

**Funkcje (lista):**
- **Planowanie** — dziennie, tygodniowo, miesięcznie
- **Powiadomienia** — e-mail po zakończeniu audytu
- **Historia** — porównanie z poprzednimi audytami
- **Limit** — zależny od planu (Pro: 50 audytów/mc)

**Narzędzie:** Własna implementacja (cron, worker)

**Grafika:** Screenshot ekranu konfiguracji harmonogramu — kalendarz, dropdown częstotliwości, checkbox powiadomień.

---

## Sekcja: CTA

Na końcu strony:

**Tytuł:** Gotowy na pełen audyt?

**Opis:** Zacznij od planu Free — 5 audytów miesięcznie, bez karty kredytowej.

**CTA:** Rozpocznij Darmowy Audyt → `/login`

**Link:** Zobacz jak to działa → `/jak-to-dziala`
