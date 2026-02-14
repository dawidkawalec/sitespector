# Instrukcje dla agenta AI — budowanie stron SiteSpector

---

## Twoja rola

Jesteś AI agentem odpowiedzialnym za **projektowanie i budowanie podstron** landing page'a SiteSpector. Czytasz briefy z tego folderu i na ich podstawie tworzysz gotowe strony — React components, style, grafiki.

## Jak pracujesz

### 1. Czytaj dokumenty w tej kolejności
1. **`_REFERENCE.md`** — design system, stack, wzorce komponentów, pełna lista funkcji platformy
2. **Brief konkretnej strony** (np. `funkcje.md`) — treści, specyfikacja sekcji, opisy grafik
3. Istniejące komponenty w `landing/src/component/` i `landing/src/app/` — wzorce do naśladowania

### 2. Co tworzysz per strona
- **`landing/src/app/[slug]/page.tsx`** — React component strony
- **Nowe komponenty** w `landing/src/component/` jeśli potrzebne (reusable)
- **Style SCSS** — dodaj do istniejących plików lub stwórz nowe partiale
- **Grafiki** — wygeneruj i umieść w `landing/src/assets/images/`
- **Route w nginx** — dodaj `location /[slug]` do `docker/nginx/nginx.conf` (proxy_pass http://landing)
- **Linki** — dodaj do Footer i/lub Topbar

### 3. Zasady budowania stron
- **Język**: cała treść po polsku
- **Framework**: Next.js App Router, React Bootstrap, SCSS
- **Wzorce**: trzymaj się wzorców z `_REFERENCE.md` (section layout, header pattern, card pattern)
- **Kolory**: używaj `$primary`, `$orange`, klasy Bootstrap (`text-primary`, `bg-light`, itp.)
- **Font**: Outfit (już załadowany globalnie)
- **Ikony**: React Icons (Remix set, prefix `Ri`), Lordicon dla animowanych
- **Responsywność**: Bootstrap grid, mobile-first
- **`'use client'`**: dodaj na górze jeśli komponent ma interakcje (state, effects)
- **Nie modyfikuj** istniejących stron bez polecenia — twórz nowe

### 4. Grafiki
- Generuj grafiki AI (screenshoty dashboardu, ilustracje, ikony)
- Rozmiary: hero 1200x600, sekcje 800-1000px wide, ikony 80x80, OG images 1200x630
- Styl: nowoczesny, flat/clean, pasujący do palety kolorów (#0b363d, #ff8945)
- Zapisuj w `landing/src/assets/images/[slug]/`
- Użyj `<Image>` z Next.js (z `unoptimized` jest włączone globalnie)

### 5. SEO
- Każda strona powinna eksportować `metadata` z Next.js:
  ```tsx
  export const metadata = {
    title: 'Tytuł — SiteSpector',
    description: 'Meta opis max 160 znaków',
  };
  ```
- Dodaj semantic HTML (h1, h2, h3 w odpowiedniej hierarchii)
- Internal linking: linkuj do powiązanych podstron
- Każda strona kończy się sekcją CTA z linkiem do `/login`

---

## Procedura dodawania nowej podstrony

```
1. Przeczytaj brief z landing/content/briefs/[slug].md
2. Utwórz landing/src/app/[slug]/page.tsx
3. Dodaj do docker/nginx/nginx.conf:
   location /[slug] {
       proxy_pass http://landing;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       ...
   }
4. Dodaj link w Footer (landing/src/component/layout/Footer/page.tsx)
5. Opcjonalnie dodaj do Topbar jeśli strona jest kluczowa
6. Wygeneruj grafiki i umieść w assets/images/
7. Przetestuj responsywność
```

---

## Procedura aktualizacji treści po nowych funkcjach

```
1. Sprawdź ostatnie commity: git log --since="[data]" --oneline
2. Zidentyfikuj nowe funkcje / zmiany
3. Zaktualizuj odpowiednie briefy w landing/content/briefs/
4. Zaktualizuj dotknięte strony (komponenty React)
5. Dodaj wpis do changelog jeśli dotyczy
6. Rozważ nowy post na bloga o nowej funkcji
```

---

## Blog

Blog używa systemu markdown:
- Pliki: `landing/content/blog/[slug].md`
- Frontmatter: `title`, `date`, `excerpt`, `author`, `slug`
- Renderowanie: Server Components z `gray-matter` + `remark`
- Lista artykułów do napisania: patrz **`_BLOG_IDEAS.md`**
- Lista case studies: patrz **`_CASE_STUDIES.md`**

---

## Tone of voice

- **Profesjonalny ale przystępny** — nie akademicki, nie kumpelski
- **Dane > przymiotniki** — konkretne liczby, czasy, ceny
- **Konkretny** — "w 1-3 minuty" zamiast "szybko"
- **Polski** — naturalny, tech terminy OK (Core Web Vitals, dashboard, workspace)
- **Bez emoji** w treściach na stronie
- **CTA z wartością** — "Rozpocznij darmowy audyt" zamiast "Kliknij tutaj"
