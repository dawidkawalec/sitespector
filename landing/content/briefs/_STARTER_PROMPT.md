# Prompt startowy dla agenta implementującego landing page

Skopiuj poniższy prompt i wklej go jako pierwszą wiadomość do agenta AI (np. Cursor Agent, Claude, itp.):

---

## PROMPT:

```
Jesteś agentem AI odpowiedzialnym za budowanie podstron landing page'a SiteSpector.

## Co masz zrobić

W folderze `landing/content/briefs/` znajdują się gotowe briefy kreatywne — po jednym na każdą podstronę. Twoje zadanie to przeczytać je i na ich podstawie zbudować gotowe strony React.

## Zanim zaczniesz cokolwiek — przeczytaj te pliki w tej kolejności:

1. `landing/content/briefs/_REFERENCE.md` — design system, paleta kolorów, typografia, wzorce komponentów, architektura plików, pełna lista funkcji platformy. TO JEST TWOJA BIBLIA TECHNICZNA.
2. `landing/content/briefs/_AGENT_INSTRUCTIONS.md` — szczegółowe instrukcje: co tworzysz per strona, zasady kodowania, procedury, tone of voice.
3. Istniejące komponenty w `landing/src/component/` i `landing/src/app/page.tsx` — tak wygląda obecna strona główna. Naśladuj te wzorce.

## Lista briefów do zaimplementowania (w tej kolejności):

### Priorytet 1 — Strona główna (refresh)
- `home.md` — odśwież istniejącą stronę główną (`landing/src/app/page.tsx` i komponenty w `landing/src/component/`)

### Priorytet 2 — Nowe podstrony kluczowe
- `funkcje.md` → `/funkcje`
- `jak-to-dziala.md` → `/jak-to-dziala`
- `sprawdz-agencje-seo.md` → `/sprawdz-agencje-seo`
- `dla-ecommerce.md` → `/dla-ecommerce`
- `dla-agencji-seo.md` → `/dla-agencji-seo`
- `dla-freelancerow.md` → `/dla-freelancerow`
- `integracje.md` → `/integracje`
- `dla-managerow.md` → `/dla-managerow`

### Priorytet 3 — Istniejące strony (refresh)
- `o-nas.md` → `/o-nas`
- `kontakt.md` → `/kontakt`
- `porownanie.md` → `/porownanie`
- `docs.md` → `/docs`
- `changelog.md` → `/changelog`
- `case-study.md` → `/case-study`
- `blog.md` → `/blog` (design strony indeksu)

### Priorytet 4 — Prawne
- `regulamin.md` → `/regulamin`
- `polityka-prywatnosci.md` → `/polityka-prywatnosci`
- `polityka-cookies.md` → `/polityka-cookies`

## Co robisz per strona:

1. Przeczytaj brief (`landing/content/briefs/[slug].md`)
2. Utwórz `landing/src/app/[slug]/page.tsx` (React component)
3. Stwórz nowe komponenty w `landing/src/component/` jeśli potrzebne
4. Dodaj SCSS jeśli potrzebne (w `landing/src/assets/scss/`)
5. Dodaj route w `docker/nginx/nginx.conf` (location /[slug] → proxy_pass http://landing)
6. Dodaj link w Footer (`landing/src/component/layout/Footer/page.tsx`)
7. Wygeneruj grafiki i umieść w `landing/src/assets/images/[slug]/`

## Kluczowe zasady:

- Cała treść PO POLSKU
- Next.js 15 App Router + React Bootstrap + SCSS
- Trzymaj się wzorców z `_REFERENCE.md` (section layout, header pattern, card pattern)
- Kolory: #0b363d (primary), #ff8945 (accent/CTA)
- Font: Outfit (już załadowany globalnie)
- Ikony: React Icons (Remix set, prefix Ri)
- Każda strona eksportuje metadata (title + description)
- Każda strona kończy się CTA z linkiem do /login
- NIE modyfikuj istniejących stron bez polecenia — twórz nowe

## Blog i Case Studies:

- Lista artykułów do napisania: `landing/content/briefs/_BLOG_IDEAS.md`
- Lista case studies: `landing/content/briefs/_CASE_STUDIES.md`
- Blog markdown: `landing/content/blog/[slug].md`
- Case studies markdown: `landing/content/case-studies/[slug].md`

## Pracuj sekwencyjnie:

Buduj jedną stronę na raz. Po każdej gotowej stronie krótko raportuj co zrobiłeś i pytaj czy kontynuować z następną.

Zacznij od przeczytania _REFERENCE.md i _AGENT_INSTRUCTIONS.md, a potem zaproponuj plan działania.
```

---

**Uwaga**: Agent powinien mieć dostęp do pełnego repo (lub przynajmniej do folderu `landing/` i `docker/nginx/nginx.conf`).
