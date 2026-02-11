---
name: Auth pages spójne z landingiem
overview: "Ujednolicenie stron logowania/rejestracji z landingiem: wspólny layout (navbar + stopka), jeden przycisk CTA prowadzący do jednego formularza z przełącznikiem Zaloguj/Zarejestruj, oraz przekierowanie zalogowanych użytkowników na dashboard."
todos: []
isProject: false
---

# Plan: Strony logowania/rejestracji spójne z landingiem

## Kontekst

- **Landing** (wzór wizualny): w repozytorium jako [demosite/](demosite/) – Topbar (navbar z logo, sekcje, przyciski) + Footer (kolumny, logo, linki). Bootstrap + SCSS.
- **Frontend SaaS**: [frontend/app/](frontend/app/) – obecnie `/login` i `/register` to pełnoekranowe karty **bez** navbara i stopki; `page.tsx` (/) to minimalna strona z dwoma przyciskami.
- **Design system**: Po planie „Unify Visual Design” frontend ma już tokeny (teal #0b363d, orange #ff8945), font Outfit i spójne komponenty – należy z nich skorzystać zamiast kopiować Bootstrap z demosite.

---

## Cel 1: Wspólny layout publiczny (navbar + stopka) jak na landingu

Strony `/`, `/login` i ewentualnie `/register` muszą mieć **ten sam** pasek nawigacji i stopkę co landing – wizualnie i strukturalnie.

**Podejście:** Dodać w frontendzie layout dla stron publicznych (bez sidebaru aplikacji), używając istniejących komponentów UI i tokenów.

**Struktura routingu (propozycja):**

- Utworzyć **grupę routów** `(public)` w [frontend/app/](frontend/app/) z własnym [layout.tsx](frontend/app/(public)/layout.tsx), który renderuje:
  - **Navbar** (odpowiednik [demosite Topbar](demosite/src/component/layout/Topbar/page.tsx)): logo SiteSpector (RiSearchEyeFill + tekst), linki sekcji (Start, Funkcje, Wydajność, Cennik, FAQ, Kontakt), **jeden** przycisk CTA (patrz Cel 2).
  - **Stopka** (odpowiednik [demosite Footer](demosite/src/component/layout/Footer/page.tsx)): logo, kolumny (Produkt, Firma, Wsparcie), copyright. W sekcji „Wsparcie” zamiast dwóch linków (Zaloguj / Załóż konto) – jeden link do strony auth (patrz Cel 2).

**Implementacja:**

- Nowe komponenty w `frontend/components/` (np. `PublicNavbar.tsx`, `PublicFooter.tsx`) – Tailwind + shadcn (Button, Link), kolory z `globals.css` / tailwind (primary, accent). Nawigacja sekcji: linki `#about`, `#services` itd. (jak w demosite) – na stronie głównej działają, na /login mogą prowadzić na `/` z hashem.
- Layout `(public)`:
  - `app/(public)/layout.tsx` – `<PublicNavbar />`, `<main>{children}</main>`, `<PublicFooter />`.
- **Tło / background (obowiązkowe):** Dla całego layoutu publicznego oraz strony auth dodać wyraźne tło, żeby strony nie wyglądały na „puste”. Do wyboru (spójne z designem):
  - **Gradient** – np. `bg-gradient-to-br from-[#fff9f5] to-[#f5f5f5]` (light) / `from-[#141822] to-[#0b363d]` (dark), jak obecnie na [login](frontend/app/login/page.tsx).
  - **Subtelne kształty** – rozmyte kółka/elipsy w kolorze primary/accent (jak obecnie na login/register: `bg-accent/5`, `bg-primary/5`).
  - **Jednolite tło** – np. `bg-background` lub ciepła biel/ciemny teal z tokenów.
  Zastosować w `(public)/layout.tsx` na `<main>` lub na wrapperze, oraz ewentualnie dodatkowo na stronie `/login` wokół karty formularza, tak aby całość była wizualnie spójna z landingiem i obecnym stylem auth.
- Przeniesienie stron pod ten layout:
  - `app/(public)/page.tsx` – obecna treść [app/page.tsx](frontend/app/page.tsx) (lub przyszły landing).
  - `app/(public)/login/page.tsx` – obecna treść [app/login/page.tsx](frontend/app/login/page.tsx) (formularz).
  - Opcjonalnie `app/(public)/register/page.tsx` – przekierowanie do `/login?mode=register` lub współdzielony widok (patrz Cel 2).

**Uwaga:** Jeśli landing (Hero, sekcje) ma docelowo być w tym samym domenie co frontend, treść landingu może później trafić do `(public)/page.tsx`. Na ten moment wystarczy, że layout (navbar + stopka) jest współdzielony i wizualnie zgodny z demosite.

---

## Cel 2: Jeden przycisk CTA i jeden formularz (Zaloguj / Zarejestruj)

Zamiast dwóch osobnych przycisków „Zaloguj się” i „Załóż konto” – **jeden** przycisk w navbarze i w stopce (oraz na stronie głównej), prowadzący do **jednej** strony auth z możliwością przełączania między logowaniem a rejestracją.

**Podejście A (rekomendowany):** Jedna trasa `/login` z **tabami** lub **przełącznikiem** „Zaloguj się” / „Zarejestruj się” na jednej stronie – ten sam formularz (OAuth + email/hasło), zmienia się tylko tytuł i akcja (sign in vs sign up). Opcjonalnie `?mode=register` ustawia domyślnie aktywny tab rejestracji.

**Podejście B:** Jedna trasa `/auth` z tabami; `/login` i `/register` robią redirect na `/auth` i `/auth?mode=register`.

**Zmiany w UI:**

- **Navbar i Footer:** Jeden link/przycisk, np. „Zaloguj się / Załóż konto” lub „Wejdź do panelu” → `href="/login"`.
- **Strona główna** (`(public)/page.tsx`): Jeden przycisk CTA → `/login`.
- **Strona auth** ([login](frontend/app/login/page.tsx) lub nowa wspólna):  
  - Tabs lub toggle: „Zaloguj się” | „Zarejestruj się”.  
  - Jedna strona: OAuth (Google, GitHub), separator „lub e-mail”, formularz – w zależności od taba: logowanie (email + hasło, opcjonalnie magic link) lub rejestracja (email + hasło + potwierdzenie + opcjonalnie imię).  
  - Na dole: „Nie masz konta? Zarejestruj się” / „Masz już konto? Zaloguj się” przełącza tab (bez zmiany URL lub z `?mode=register`).

**Trasy:**

- Zachować `/login` jako główny URL (SEO i linki z demosite).
- `/register`: **redirect 301/302** do `/login?mode=register` (lub Next.js redirect w `next.config.js` lub w `register/page.tsx`), żeby stare linki (np. z demosite Hero, Pricing, Footer) działały.

**Pliki do zmiany:**

- [frontend/app/login/page.tsx](frontend/app/login/page.tsx) – dodać tryb rejestracji (tab/toggle + formularz rejestracji z [register/page.tsx](frontend/app/register/page.tsx)); obsługa `searchParams.mode === 'register'`.
- [frontend/app/register/page.tsx](frontend/app/register/page.tsx) – zastąpić przez `redirect('/login?mode=register')` (lub lekki wrapper który tylko robi redirect).
- Wszystkie linki do `/register` w frontendzie zmienić na `/login` (lub `/login?mode=register` jeśli chcesz od razu otworzyć rejestrację). W demosite – jeśli nadal linkuje do frontenda – można ujednolicić na jeden URL (np. `/login`).

---

## Cel 3: Przekierowanie zalogowanych użytkowników na dashboard

Jeśli użytkownik ma aktywną sesję (Supabase), nie powinien widzieć strony logowania/rejestracji ani strony głównej – ma trafić od razu na **dashboard**.

**Obecny stan:**

- [frontend/app/login/page.tsx](frontend/app/login/page.tsx) i [frontend/app/register/page.tsx](frontend/app/register/page.tsx) – mają już `useEffect` z `supabase.auth.getSession()` i `router.push('/dashboard')` gdy `session` istnieje.
- [frontend/app/page.tsx](frontend/app/page.tsx) – **nie** sprawdza sesji; pokazuje zawsze przyciski Zaloguj / Załóż konto.

**Zmiany:**

- **Strona główna** `(public)/page.tsx`: Na początku (useEffect lub przed renderem) sprawdzenie sesji; jeśli `session` → `router.replace('/dashboard')`. Do czasu rozstrzygnięcia sesji można pokazać loader lub obecną treść (bez wrażliwych danych).
- **Strona auth** (`/login`): Już jest przekierowanie na dashboard przy sesji – zostawić.
- **Opcjonalnie (middleware):** Dla czystości można w Next.js middleware sprawdzać ścieżki `/`, `/login`, `/register` i jeśli cookie/header wskazuje na zalogowanego użytkownika (np. Supabase session w cookie), od razu redirect do `/dashboard`. To wymaga dostępu do sesji po stronie serwera (Supabase może ustawiać cookie). Alternatywa: zostawić tylko client-side check w layout lub na stronach – prostsze i już działające na login/register.

**Podsumowanie:** Dodać sprawdzenie sesji na stronie głównej i ewentualnie w layoutcie `(public)` (dla `/`), tak aby zalogowany użytkownik nie widział landingu ani formularza logowania.

---

## Kolejność realizacji

1. **Layout publiczny** – komponenty `PublicNavbar`, `PublicFooter`, route group `(public)` z layoutem; **tło/background** (gradient lub kształty) na layoutcie/publicznych stronach; przeniesienie `page.tsx`, `login/page.tsx` pod `(public)`.
2. **Jeden CTA i jedna strona auth** – w navbarze i stopce jeden przycisk → `/login`; scalenie formularza logowania i rejestracji w jedną stronę z tabami; redirect `/register` → `/login?mode=register`; aktualizacja linków w frontendzie (i opcjonalnie w demosite).
3. **Redirect zalogowanych** – na `(public)/page.tsx` (i ewentualnie w jednym miejscu dla `/login`) sprawdzenie sesji i `router.replace('/dashboard')`.

---

## Pliki do utworzenia/modyfikacji (skrót)


| Akcja                             | Plik                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Nowy                              | `frontend/components/layout/PublicNavbar.tsx`                                                                                            |
| Nowy                              | `frontend/components/layout/PublicFooter.tsx`                                                                                            |
| Nowy                              | `frontend/app/(public)/layout.tsx` (z tłem: gradient lub bg-background na `<main>`)                                                      |
| Przenieść/zmodyfikować            | `frontend/app/(public)/page.tsx` (obecny `app/page.tsx` + redirect gdy zalogowany)                                                       |
| Przenieść/zmodyfikować            | `frontend/app/(public)/login/page.tsx` (tabs Zaloguj/Zarejestruj, ten sam formularz)                                                     |
| Redirect                          | `frontend/app/(public)/register/page.tsx` → redirect do `/login?mode=register` lub usunąć trasę i użyć tylko redirect w `next.config.js` |
| Usunąć lub zostawić jako redirect | `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx` (po przeniesieniu pod `(public)`)                                        |


Po przeniesieniu stron do `(public)` stare ścieżki `app/login/` i `app/register/` zostaną usunięte (lub zastąpione przekierowaniami), tak aby `/login` i `/register` były obsługiwane z `(public)`.

---

## Uwagi

- **Demosite:** Jeśli demosite jest osobną aplikacją i linkuje do `https://77.42.79.46/login`, po zmianach użytkownik nadal trafi na frontend; navbar i stopka będą wizualnie zgodne z landingiem (demosite). Linki w demosite z „Załóż konto” można ustawić na `/login` (jeden CTA) lub `/login?mode=register`.
- **Sekcje nawigacji (Funkcje, Cennik, itd.):** Na stronie `/login` linki `#about` itd. mogą prowadzić na `/` z hashem (np. `/#about`), żeby zachować spójność z landingiem.
- **Auth callback:** [auth/callback/page.tsx](frontend/app/auth/callback/page.tsx) przekierowuje do `/login` przy błędzie i do `/dashboard` przy sukcesie – bez zmian; ewentualnie callback też można opakować w public layout, jeśli chcesz ten sam navbar (opcjonalnie).
- **Tło:** Na pewno dodać tło (gradient, rozmyte kształty lub solid) dla layoutu publicznego i strony logowania – żeby nie było „płaskiej” białej/szarej strony; spójne z obecnym loginem (teal/orange, ciepła biel).

