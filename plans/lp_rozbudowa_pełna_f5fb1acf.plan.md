---
name: LP rozbudowa pełna
overview: "Plan obejmuje wszystkie wcześniej wymienione elementy rozbudowy landing page: strony prawne, testimoniale, demo wideo, kontakt/O nas, blog, dokumentacja, newsletter, case study, trust/bezpieczeństwo, porównanie z konkurencją, changelog i integracje. Wymaga zmian w demosite (Next.js), backendzie (FastAPI) oraz nginx."
todos: []
isProject: false
---

# Plan rozbudowy LP – pełna lista (bez pominięć)

## Kontekst techniczny

- **LP** = aplikacja **demosite** (Next.js, Bootstrap), serwowana przez nginx jako `landing` (port 3001).
- Nginx kieruje na landing tylko: `location = /`, `/login`, `/register`, `/lp-assets/`. Reszta (`/blog`, `/kontakt` itd.) trafia do **frontend**. Aby nowe strony LP były w demosite z tą samą nawigacją, trzeba dodać dla nich **location** w nginx i zaimplementować je w demosite.
- Nawigacja i stopka: [demosite/src/component/layout/Topbar/page.tsx](demosite/src/component/layout/Topbar/page.tsx), [demosite/src/component/layout/Footer/page.tsx](demosite/src/component/layout/Footer/page.tsx). Główna strona: [demosite/src/app/page.tsx](demosite/src/app/page.tsx).

Poniżej wszystkie punkty w kolejności logicznej (prawne i zaufanie → treść → konwersja → nice-to-have).

---

## 1. Strony prawne (Regulamin, Polityka prywatności, Cookies)

**Cel:** Zgodność z GDPR i płatnościami (Stripe), linki w stopce.

- W **demosite** dodać strony (App Router):
  - `app/regulamin/page.tsx`
  - `app/polityka-prywatnosci/page.tsx`
  - `app/polityka-cookies/page.tsx`
- Treść: szablony tekstowe (placeholder), które Ty uzupełnisz prawnie; layout: Topbar + Container z markdown-like content + Footer.
- W **Footer** ([demosite/src/component/layout/Footer/page.tsx](demosite/src/component/layout/Footer/page.tsx)) dodać kolumnę „Prawne” lub rozszerzyć „Firma”/stopkę: linki „Regulamin” → `/regulamin`, „Polityka prywatności” → `/polityka-prywatnosci`, „Polityka cookies” → `/polityka-cookies`.
- W **nginx** dodać (przed catch-all `location /`):
  - `location /regulamin { ... proxy_pass http://landing; }`
  - `location /polityka-prywatnosci { ... }`
  - `location /polityka-cookies { ... }`
  (identyczne proxy headers jak przy `/login`).

---

## 2. Testimoniale (sekcja na stronie głównej)

**Cel:** Social proof – cytaty klientów.

- Nowy komponent w demosite: `component/Testimonials.tsx`.
- Sekcja: tytuł (np. „Co mówią o nas”), 3–4 karty z cytatem, imię/nazwa firmy, opcjonalnie zdjęcie/avatar (placeholder).
- Dane na start: stała tablica (np. `testimonialsData`) – później można przenieść do CMS/API.
- W [demosite/src/app/page.tsx](demosite/src/app/page.tsx) wstawić `<Testimonials />` w odpowiednim miejscu (np. po Pricing lub przed FAQ), z `id="testimonials"` jeśli ma być w nav.
- Opcjonalnie: w Topbar dodać „Opinie” z linkiem `#testimonials`.

---

## 3. Demo wideo (przycisk „Zobacz Demo” + sekcja)

**Cel:** Realne demo zamiast martwego linku.

- **Opcja A (szybka):** Przycisk „Zobacz Demo” w [demosite/src/app/Hero.tsx](demosite/src/app/Hero.tsx) zmienić na link do zewnętrznego wideo (YouTube/Vimeo) – `href` do URL wideo; przy braku wideo – `#demo` i sekcja „Demo” na stronie.
- **Opcja B (pełna):** Dodać sekcję „Zobacz jak to działa” z embedem iframe (YouTube/Vimeo). Komponent np. `component/DemoSection.tsx` z placeholderem `videoId`/URL; na stronie głównej wstawić po Hero lub po Features. Przycisk w Hero: `href="#demo"` lub link do tej sekcji.
- W obu przypadkach: gdy będzie gotowe wideo, uzupełnić URL/videoId w jednym miejscu (env lub stała).

---

## 4. Kontakt i O nas (realne podstrony, formularz)

**Cel:** Usunięcie martwych linków „O nas”, „Kariera”, „Kontakt”; działający kontakt.

- **Strona Kontakt:** `app/kontakt/page.tsx` – Topbar + Footer, sekcja z danymi (adres, tel, email jak w CTA) + **formularz**: imię, email, temat, wiadomość. Submit: POST na backend (patrz punkt 7 – Newsletter/API).
- **Backend:** Nowy endpoint np. `POST /api/contact` (router `contact.py` lub rozszerzenie istniejącego), który zapisuje wiadomość (tabela `contact_submissions` lub plik/email). Wysyłka email (np. Resend) do Ciebie jako opcja.
- **O nas:** `app/o-nas/page.tsx` – prosta strona „O nas” (tekst placeholder pod Twój opis).
- **Kariera:** Albo `app/kariera/page.tsx` z placeholderem „Obecnie nie prowadzimy rekrutacji” / link do formularza, albo tymczasowo usunąć link z Footer.
- W **Footer** ustawić: O nas → `/o-nas`, Kariera → `/kariera`, Kontakt → `/kontakt`.
- **Nginx:** `location /kontakt`, `location /o-nas`, `location /kariera` → proxy do landing (jak w pkt 1).

---

## 5. Blog (lista + pojedyncze wpisy)

**Cel:** SEO, content marketing, lead magnet.

- W demosite: `app/blog/page.tsx` – lista wpisów (tytuł, lead, data, slug). `app/blog/[slug]/page.tsx` – pojedynczy wpis.
- Źródło treści na start: pliki MD/MDX w repo (np. `demosite/content/blog/*.md`) lub stała tablica z 2–3 wpisami placeholder; renderowanie przez `next-mdx-remote` lub zwykłe React (markdown → HTML).
- Layout: Topbar + Footer. W Topbar dodać „Blog” → `/blog`; w Footer w kolumnie „Produkt” lub „Wsparcie” link „Blog” → `/blog`.
- **Nginx:** `location /blog` oraz `location /blog/` (oraz ewentualnie `location ~ ^/blog/`) → proxy do landing, żeby Next.js obsłużył `/blog` i `/blog/[slug]`.

---

## 6. Dokumentacja / Pomoc

**Cel:** Działający link „Dokumentacja” w stopce.

- **Opcja A:** Strona `app/docs/page.tsx` (lub `app/docs/[[...slug]]/page.tsx`) – „Dokumentacja” / „Pomoc”: spis tematów (np. Jak zacząć, Audyty, Raporty PDF, Zespoły, Cennik) + proste podstrony lub sekcje na jednej stronie (accordion/list).
- **Opcja B:** Link zewnętrzny do Notion/GitBook – w Footer „Dokumentacja” → zewnętrzny URL (wtedy bez nowych route w demosite).
- Przy realizacji w demosite: **nginx** `location /docs` (i ewentualnie `location /docs/`) → landing.

---

## 7. Newsletter (formularz w stopce + backend)

**Cel:** Zbieranie leadów; działający formularz.

- **Backend:** Nowy endpoint np. `POST /api/newsletter` (bez wymaganej autentykacji): body `{ "email": "..." }`. Walidacja email; zapis do tabeli `newsletter_subscribers` (Supabase lub VPS PostgreSQL) lub integracja z Resend/Mailchimp/ConvertKit (wysyłka do listy). Odpowiedź 200 + komunikat sukcesu.
- **Frontend (demosite):** W [demosite/src/component/layout/Footer/page.tsx](demosite/src/component/layout/Footer/page.tsx) formularz newslettera: pole email + przycisk. On submit: `fetch(POST /api/newsletter)` (pełny URL API z env, np. `NEXT_PUBLIC_API_URL`). Obsługa loading, sukces („Dziękujemy za zapis!”), błąd (np. „Nieprawidłowy email” / „Spróbuj ponownie”). Nie przekierowanie – komunikat pod formularzem.
- **CORS:** Backend musi zezwalać na requesty z domeny LP (Origin).

---

## 8. Case study (1–2)

**Cel:** Zaufanie przez konkretne historie.

- Strona `app/case-study/page.tsx` (lista) lub jedna strona `app/case-study/page.tsx` z jednym case study. Zawartość: problem → rozwiązanie (SiteSpector) → wynik (metryki/cytaty); placeholder tekst do uzupełnienia.
- Opcjonalnie `app/case-study/[slug]/page.tsx` przy większej liczbie case study.
- W Footer lub w sekcji „Firma” link „Case study” → `/case-study`. Opcjonalnie w Topbar.
- **Nginx:** `location /case-study` (i ewentualnie `location /case-study/`) → landing.

---

## 9. Trust / bezpieczeństwo (sekcja lub rozszerzenie FAQ)

**Cel:** Przekonanie B2B (dane, RODO, backup).

- **Opcja A:** Nowy komponent `component/TrustSection.tsx` na stronie głównej: krótkie punkty (np. „Dane w UE”, „Szyfrowanie”, „Backup”, „RODO”) z ikonami.
- **Opcja B:** Rozszerzenie [demosite/src/component/Faq.tsx](demosite/src/component/Faq.tsx) o 1–2 pytania: „Gdzie przechowywane są dane?”, „Jak dbacie o zgodność z RODO?” z krótką odpowiedzią (VPS/Supabase, szyfrowanie, izolacja workspace).
- Można połączyć: mała sekcja Trust + 1 pytanie w FAQ.

---

## 10. Porównanie z konkurencją (SiteSpector vs inne)

**Cel:** Wsparcie decyzji zakupowej.

- **Opcja A:** Nowa sekcja na LP, np. `component/ComparisonSection.tsx`: tabela lub karty „SiteSpector vs Screaming Frog / vs inne narzędzia” (cena, audyty, AI, PDF, zespoły – krótkie porównanie). Dane na stałe w komponencie.
- **Opcja B:** Osobna strona `app/porownanie/page.tsx` (lub `app/compare/page.tsx`) z pełną tabelą; na LP tylko CTA „Zobacz porównanie” → link do tej strony.
- W obu przypadkach: w Footer lub w Topbar link „Porównanie” / „vs konkurencja”.
- **Nginx:** przy osobnej stronie: `location /porownanie` (lub `/compare`) → landing.

---

## 11. Changelog / „Co nowego”

**Cel:** Transparentność, pokazanie rozwoju produktu.

- Strona `app/changelog/page.tsx`: lista wpisów (data + tytuł + krótki opis zmian). Źródło: stała tablica w kodzie lub pliki MD w `content/changelog/`. Layout: Topbar + Footer.
- W Footer link „Changelog” / „Co nowego” → `/changelog`. Opcjonalnie w Topbar.
- **Nginx:** `location /changelog` → landing.

---

## 12. Integracje („Integruje się z”)

**Cel:** Pokazanie ekosystemu, gdy integracje będą dostępne.

- Nowy komponent `component/IntegrationsSection.tsx`: sekcja z logotypami i krótkim opisem (np. „Google Search Console”, „Slack”, „API” – na start placeholdery lub „Wkrótce”). Wstawienie na LP (np. po Features lub przed CTA).
- Gdy pojawią się realne integracje: uzupełnienie linków i opisów. Jeśli integracji nie ma – sekcja może być ukryta (flag w env) lub z jednym punktem „API do własnych integracji”.

---

## 13. Nawigacja i stopka – podsumowanie zmian

- **Topbar** ([demosite/src/component/layout/Topbar/page.tsx](demosite/src/component/layout/Topbar/page.tsx)): dodać linki do Blog, ewentualnie Opinie (#testimonials), Porównanie, Changelog; „Zobacz Demo” jak w pkt 3.
- **Footer** ([demosite/src/component/layout/Footer/page.tsx](demosite/src/component/layout/Footer/page.tsx)):  
  - Produkt: Funkcje, Wydajność, Cennik, FAQ, **Blog**, (Dokumentacja/Pomoc).  
  - Firma: **O nas** → `/o-nas`, **Kariera** → `/kariera`, **Kontakt** → `/kontakt`; ewentualnie Case study, Changelog, Porównanie.  
  - Prawne: **Regulamin**, **Polityka prywatności**, **Polityka cookies**.  
  - Wsparcie: Zaloguj, Dokumentacja; newsletter – działający form (pkt 7).

---

## 14. Nginx – zbiorcza lista location

Wszystkie nowe ścieżki muszą być obsłużone **przed** catch-all `location /` (który idzie do frontend). Propozycja (każdy z tymi samymi proxy headers co `/login`):

- `/regulamin`, `/polityka-prywatnosci`, `/polityka-cookies`
- `/kontakt`, `/o-nas`, `/kariera`
- `/blog`, `/blog/` (oraz ewent. regex dla `/blog/*`)
- `/docs`, `/docs/`
- `/case-study`, `/case-study/`
- `/porownanie` (lub `/compare`)
- `/changelog`

Plik: [docker/nginx/nginx.conf](docker/nginx/nginx.conf). Wzór: `location /sciezka { proxy_pass http://landing; proxy_http_version 1.1; ... }` (skopiować blok z `location /login`).

---

## 15. Backend – podsumowanie

- **POST /api/newsletter** – zapis email (tabela lub Resend/Mailchimp); brak auth.
- **POST /api/contact** – zapis wiadomości kontaktowej (tabela lub email do Ciebie); opcjonalnie rate limit / captcha na przyszłość.
- Ewentualnie: **GET /api/changelog** – jeśli changelog ma być z API zamiast z plików (na start niekonieczne).

---

## Kolejność wdrożenia (sugerowana)

1. Strony prawne + linki w Footer + nginx (1, 14).
2. Testimoniale + Demo wideo (2, 3).
3. Kontakt (strona + formularz) + O nas/Kariera + backend contact + nginx (4, 14).
4. Newsletter (backend + form w Footer) (7).
5. Blog (struktura + 1–2 wpisy placeholder + nginx) (5, 14).
6. Dokumentacja (strona lub link zewnętrzny) (6).
7. Case study (8) + Trust/FAQ (9).
8. Porównanie (10) + Changelog (11) + Integracje (12).
9. Wspólna aktualizacja Topbar i Footer (13).

---

## Zależności i uwagi

- **Newsletter i Contact** wymagają backendu (nowe routery, ewent. migracje dla tabel).  
- **Strony prawne** – treść regulaminu/polityk musi być zaakceptowana prawnie (na start placeholdery).  
- **Demo wideo** – do uzupełnienia URL po nagraniu; do tego momentu można trzymać `#demo` + sekcję z placeholderem „Wkrótce” lub embedem testowym.  
- **PublicFooter** w **frontend** ([frontend/components/layout/PublicFooter.tsx](frontend/components/layout/PublicFooter.tsx)): jeśli użytkownicy trafiają tam (np. bezpośredni link do strony w frontend), warto tam też dodać linki do stron prawnych i Kontakt (te same URL – pod demosite; nginx i tak przekieruje tylko gdy żądanie idzie pod główną domenę – trzeba pamiętać, że `/regulamin` w frontend nie istnieje, więc linki z frontend muszą prowadzić do tej samej domeny; w obecnym nginx `/regulamin` trafi do frontend, dopóki nie dodamy location do landing). **Po dodaniu location w nginx** `/regulamin` itd. będą serwowane przez demosite, więc linki w PublicFooter do `/regulamin`, `/kontakt` itd. będą działać poprawnie.

