# Strona Polityka prywatności — Brief

Dokument kreatywny dla agenta AI budującego odświeżoną stronę polityki prywatności SiteSpector. 8 sekcji, uwzględnia Senuto API, Execution Plan, 3-fazowe przetwarzanie.

---

## Meta

- **title**: Polityka prywatności — SiteSpector | Ochrona danych
- **description**: Polityka prywatności SiteSpector. Jak zbieramy, przetwarzamy i przechowujemy dane. Supabase, Hetzner, Stripe, Gemini, Senuto. Zgodność z RODO.
- **keywords**: polityka prywatności SiteSpector, RODO, ochrona danych, dane osobowe

---

## Sekcja: Hero (krótka)

**Headline:** Polityka prywatności

**Subheadline:** Ostatnia aktualizacja: [DATA]. Informujemy, jakie dane zbieramy i jak je chronimy.

---

## Sekcja 1: Administrator

**Copy:**
> Administratorem Twoich danych osobowych w ramach Serwisu SiteSpector jest [nazwa firmy, adres, NIP, e-mail]. W sprawach związanych z ochroną danych możesz skontaktować się z nami pod adresem: [e-mail] lub [adres korespondencyjny].

---

## Sekcja 2: Zbierane dane

**Copy:**
> Zbieramy następujące kategorie danych:
>
> - **Dane rejestracyjne:** adres e-mail, hasło (hash), nazwa użytkownika/imię — w celu utworzenia konta i logowania.
> - **Dane audytów:** adresy URL analizowanych stron, wyniki crawlowania (meta tagi, nagłówki, linki, obrazy), wyniki Lighthouse (wydajność), dane z Senuto (widoczność, pozycje, backlinki, AI Overviews) — w celu przeprowadzenia audytu i generowania raportów.
> - **Dane Execution Plan:** zadania wygenerowane przez AI (treść, priorytety, statusy, notatki użytkownika) — w celu przechowania planu wykonania i umożliwienia śledzenia postępów.
> - **Dane płatności:** przetwarzane wyłącznie przez Stripe (e-mail, dane karty) — nie przechowujemy numerów kart.
> - **Dane techniczne:** adres IP, typ przeglądarki, pliki cookies — w celach technicznych i bezpieczeństwa.

---

## Sekcja 3: Cel przetwarzania

**Copy:**
> Dane przetwarzamy w celu:
> - świadczenia usług audytowych (rejestracja, logowanie, zarządzanie kontem),
> - przeprowadzania audytów w 3 fazach: technicznej (Screaming Frog, Lighthouse, Senuto), analizy AI (Google Gemini), generowania Execution Plan,
> - generowania raportów PDF,
> - obsługi płatności (Stripe),
> - świadczenia wsparcia technicznego,
> - zapewnienia bezpieczeństwa Serwisu i compliance z przepisami.

---

## Sekcja 4: Przechowywanie

**Copy:**
> Dane przechowywane są w infrastrukturze znajdującej się w Unii Europejskiej:
>
> - **Supabase** — autentykacja, dane użytkowników, Workspace'y, metadane audytów. Centra danych AWS w regionie EU.
> - **VPS (Hetzner)** — serwer aplikacyjny i przetwarzanie audytów (Screaming Frog, Lighthouse, dane analizy). Lokalizacja: Niemcy (Hetzner DE).
>
> Nie wykorzystujemy centrów danych poza UE do przechowywania danych audytów ani danych osobowych.

---

## Sekcja 5: Udostępnianie danych

**Copy:**
> Udostępniamy dane wyłącznie w następujących przypadkach:
>
> - **Stripe** — dane niezbędne do realizacji płatności (e-mail, identyfikator klienta). Stripe przetwarza dane zgodnie z własną polityką prywatności i PCI DSS.
> - **Google Gemini** — w celu analizy AI przekazujemy fragmenty wyników audytu (np. treść stron, metryki wydajności, statystyki SEO). API Gemini przetwarza dane według polityki Google; możemy korzystać z opcji ograniczenia retencji.
> - **Senuto** — w celu pobrania widoczności, pozycji, backlinków i AI Overviews przekazujemy wyłącznie adres URL analizowanej domeny. Senuto nie otrzymuje danych osobowych ani innych treści audytu.
>
> Nie sprzedajemy ani nie udostępniamy danych osobowych podmiotom trzecim w celach marketingowych.

---

## Sekcja 6: Okres przechowywania

**Copy:**
> - **Dane konta:** do momentu usunięcia konta przez użytkownika lub po 2 latach od ostatniego logowania (w przypadku nieaktywnych kont).
> - **Dane audytów:** do momentu usunięcia przez użytkownika lub do końca okresu przechowywania Workspace'u. Użytkownik może w każdej chwili usunąć audyty.
> - **Dane Execution Plan:** zgodnie z okresem przechowywania audytów.
> - **Logi techniczne:** do 90 dni.
> - **Cookies:** zgodnie z Polityką cookies.

---

## Sekcja 7: Prawa RODO

**Copy:**
> Przysługują Ci następujące prawa:
> - prawo dostępu do danych,
> - prawo do sprostowania,
> - prawo do usunięcia („prawo do bycia zapomnianym”),
> - prawo do ograniczenia przetwarzania,
> - prawo do przenoszenia danych,
> - prawo do sprzeciwu,
> - prawo do skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).
>
> Aby skorzystać z praw, skontaktuj się z nami pod adresem wskazanym w sekcji „Administrator”.

---

## Sekcja 8: Cookies

**Copy:**
> Serwis korzysta z plików cookies niezbędnych do działania (sesja, logowanie) oraz cookies Stripe w celu realizacji płatności. Szczegóły zawiera Polityka cookies. Nie wykorzystujemy cookies śledzących w celach reklamowych.

---

## Uwagi designu

- Strona tekstowa, czytelna. Link do Polityki cookies w sekcji 8.
- Spis treści (anchor) opcjonalnie.
- Zgodność z wymogami RODO: informacja o administratorze, celach, podstawach prawnych, odbiorcach, okresie, prawach.
