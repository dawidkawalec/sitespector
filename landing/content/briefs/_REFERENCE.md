# SiteSpector Landing — Technical Reference

Dokument referencyjny dla agenta AI. Opisuje design system, stack technologiczny i wzorce komponentów istniejącego landing page'a.

---

## Stack technologiczny

- **Framework**: Next.js 15.3.4 (App Router)
- **React**: 19.0.0
- **Styling**: SCSS + Bootstrap 5.3.7
- **UI Components**: React Bootstrap 2.10.10
- **Ikony**: React Icons 5.5.0 (Remix Icon set — `ri`), Lordicon 1.11.0 (animowane JSON)
- **Animacje**: react-countup 6.5.3, Lottie-web 5.13.0
- **Carousel**: Swiper 11.2.8
- **Font**: Outfit (Google Fonts, wagi 100-900)
- **Output**: `standalone` (Docker), `assetPrefix: '/lp-assets'`

## Architektura plików

```
landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Outfit font, Bootstrap CSS, SCSS)
│   │   ├── page.tsx            # Strona główna (kompozycja sekcji)
│   │   ├── Hero.tsx            # Hero section
│   │   ├── blog/               # Blog (index + [slug])
│   │   ├── case-study/         # Case studies
│   │   ├── changelog/          # Changelog
│   │   ├── docs/               # Help center
│   │   ├── kontakt/            # Kontakt
│   │   ├── o-nas/              # O nas
│   │   ├── porownanie/         # Porównanie narzędzi
│   │   ├── login/              # Logowanie
│   │   ├── register/           # Rejestracja
│   │   ├── regulamin/          # Regulamin
│   │   ├── polityka-prywatnosci/
│   │   └── polityka-cookies/
│   ├── component/
│   │   ├── About.tsx           # "Dlaczego SiteSpector?" (6 feature cards)
│   │   ├── Brands.tsx          # Technologie (ikony React Icons)
│   │   ├── Counter.tsx         # Statystyki (react-countup)
│   │   ├── Cta.tsx             # CTA (Lordicon animacje)
│   │   ├── DemoVideo.tsx       # Demo/video placeholder
│   │   ├── Faq.tsx             # FAQ (numerowane pytania)
│   │   ├── Feature.tsx         # "Możliwości" (obraz + lista)
│   │   ├── IntegrationsSection.tsx  # Integracje (karty)
│   │   ├── Pricing.tsx         # Cennik (3 plany)
│   │   ├── Services.tsx        # Metryki (stats + lista)
│   │   ├── Testimonials.tsx    # Opinie (4 karty)
│   │   ├── TrustBadges.tsx     # Bezpieczeństwo (4 badge'e)
│   │   └── layout/
│   │       ├── Topbar/page.tsx # Nawigacja (sticky)
│   │       └── Footer/page.tsx # Stopka (gradient + newsletter)
│   ├── assets/
│   │   ├── images/             # PNG, SVG (Dashboard.png, dashbord-3.png, itp.)
│   │   ├── icons/              # Lordicon JSON (address, phone, mail)
│   │   └── scss/
│   │       ├── style.scss      # Main entry
│   │       ├── _variables.scss # Design tokens
│   │       ├── _helper.scss    # Utilities
│   │       ├── _components.scss
│   │       ├── _general.scss
│   │       ├── _menu.scss
│   │       ├── _hero.scss
│   │       ├── _brand.scss
│   │       ├── _about.scss
│   │       ├── _services.scss
│   │       ├── _price.scss
│   │       ├── _faq.scss
│   │       ├── _cta.scss
│   │       ├── _footer.scss
│   │       └── _form.scss
│   └── lib/
│       └── blog.ts             # Blog helper (gray-matter + remark)
└── content/
    ├── blog/                   # Markdown blog posts
    ├── case-studies/           # Markdown case studies
    └── briefs/                 # Briefy kreatywne (ten folder)
```

---

## Design System

### Paleta kolorów

```scss
$primary: #0b363d;      // Ciemny teal — główny kolor
$orange:  #ff8945;       // Pomarańczowy — akcent, CTA
$success: #81d86f;       // Zielony
$info:    #adefd1;       // Jasny cyan
$warning: #eea47f;       // Ciepły żółty
$light:   #fff9f5;       // Tło light sekcji
$dark:    #141822;       // Ciemny tekst
$white:   #fff;
$black:   #000;
```

### Typografia

```scss
Font-family: 'Outfit', sans-serif;
Font-size (base): 17px;
Font-weight (body): 400;
Font-weight (h2 .main-title): 600;
H2 size (.main-title): 42px;
Hero heading: display-3 fw-semibold (Bootstrap)
```

### Spacing

```scss
Section padding: 100px 0 (desktop) → 40px 0 (mobile)
Hero padding: 200px 0
Button padding: 10px 28px (standard), 15px 30px (large)
```

### Efekty

```scss
Border-radius: 3px (buttons), 10px (cards), rounded-4 (16px)
Shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px
Hover button: translateY(-3px)
.text-line: orange underline (34% height, rgba, z-index -1)
```

---

## Wzorce komponentów

### Wzorzec sekcji

```tsx
<section className="section [nazwa]-section [bg-class]" id="[id]">
  <Container>
    <Row className="justify-content-center">
      <Col lg={10}>
        {/* Content */}
      </Col>
    </Row>
  </Container>
</section>
```

### Wzorzec nagłówka sekcji

```tsx
<div className="title-sm">
  <span>ETYKIETA SEKCJI</span>
</div>
<div className="main-title mt-3">
  <h2 className="text-primary">
    Główny tekst <span className="text-orange text-line">akcent</span>
  </h2>
</div>
<p className="text-muted mt-3">Opis sekcji...</p>
```

### Wzorzec karty

```tsx
<Card className="border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
  <Card.Body>
    <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 mb-3">
      <RiIconName size={28} className="text-orange" />
    </div>
    <h5>Tytuł</h5>
    <p className="text-muted">Opis...</p>
  </Card.Body>
</Card>
```

### Wzorzec CTA button

```tsx
<Link href="/login" className="btn btn-primary">
  Rozpocznij Darmowy Audyt
</Link>
<Link href="#demo" className="btn btn-outline-primary ms-3">
  Zobacz Demo
</Link>
```

### Wzorzec tła sekcji

- `bg-light` — jasne tło (#fff9f5)
- `bg-white` / brak — białe
- `bg-primary` — ciemny teal (używane w Counter)
- Gradient w footer: `linear-gradient(to right, #0b363d, #001113)`

---

## Nawigacja

### Topbar (sticky)
- Logo: `RiSearchEyeFill` + "SiteSpector"
- Linki: Start, Funkcje, Cennik, Blog, Dokumentacja, Kontakt
- CTA (gdy niezalogowany): "Zaloguj się" → `/login` oraz "Załóż konto" → `/register`
- CTA (gdy zalogowany): "Przejdź do panelu" → `${NEXT_PUBLIC_APP_URL}/dashboard`
- Scroll: `.nav-sticky` po 100px

### Footer
- Gradient ciemny
- 4 kolumny linków: Produkt, Firma, Prawne, Wsparcie
- Newsletter (email → API)
- Social: Twitter

---

## Routing — Nginx

Landing app obsługuje publiczne route'y. Frontend app obsługuje dashboard (`/dashboard`, `/audits/*`, `/settings/*`).

Aby dodać nową podstronę:
1. Utwórz `landing/src/app/[slug]/page.tsx`
2. Dodaj `location /[slug]` w `docker/nginx/nginx.conf` → `proxy_pass http://landing`
3. Dodaj link w Footer / Topbar

---

## Blog system

- Pliki: `landing/content/blog/*.md`
- Frontmatter: `title`, `date`, `excerpt`, `author`, `slug`
- Helper: `landing/src/lib/blog.ts` → `getSortedPostsData()`, `getPostData(slug)`
- Rendering: `gray-matter` + `remark` + `remark-html`

---

## Obecna kolejność sekcji na stronie głównej

1. Topbar
2. Hero (headline + CTA + screenshot)
3. DemoVideo (placeholder)
4. Brands (ikony technologii)
5. About (6 feature cards)
6. Feature (lista + screenshot)
7. IntegrationsSection (6 kart integracji)
8. Services (metryki + lista)
9. Counter (4 statystyki, animated)
10. TrustBadges (4 badge'e bezpieczeństwa)
11. Pricing (3 plany)
12. Testimonials (4 opinie)
13. FAQ (8 pytań)
14. CTA (kontakt z Lordicon)
15. Footer

---

## Platforma SiteSpector — aktualny stan funkcji

### 3-fazowy audyt
1. **Faza techniczna**: Screaming Frog (crawl) + Lighthouse (desktop+mobile) + Senuto (widoczność+backlinki+AI Overviews) + konkurenci
2. **Faza AI**: analiza treści, wydajności, UX, security, Local SEO, tech stack, benchmarki, kontekstowe analizy per obszar, cross-tool korelacje, roadmapa, executive summary, quick wins
3. **Execution Plan**: AI generuje konkretne zadania z kodem, priorytetami, tagami quick win, statusem do odznaczania

### Moduły audytu (zakładki w dashboardzie)
- SEO (crawl data, meta tagi, nagłówki, linki, obrazy)
- Performance (Core Web Vitals desktop + mobile)
- Visibility (Senuto — pozycje, trendy, wins/losses, kanibalizacja)
- AI Overviews (statystyki, keyword explorer, konkurenci)
- Backlinks (via Senuto — statystyki, anchory, ref domains)
- Links (wewnętrzne + przychodzące)
- Images (ALT tagi, rozmiary, optymalizacja)
- AI Strategy (cross-tool, roadmapa, executive summary)
- Quick Wins (zunifikowana lista priorytetów)
- Deep Content (thin content, duplikaty)
- UX Check (dostępność, użyteczność)
- Security (HTTPS, nagłówki, mixed content)
- Competitors (porównanie z 3 konkurentami)
- Benchmark (branżowy)
- Architecture (wizualizacja struktury)
- Execution Plan (zadania z kodem, statusy, notatki)
- Client Report (widok dla klienta)
- PDF (raport z 9 sekcjami)
- Raw Data (crawl data explorer, Lighthouse data)
- Per-page Analysis (deep dive per strona)

### Plany i ceny
- **Free**: $0/mc — 5 audytów, 1 user, podstawowy audyt + PDF
- **Pro**: $29/mc — 50 audytów, zespoły, konkurenci (3), Senuto, harmonogramy, white-label PDF, API
- **Enterprise**: $99/mc — bez limitów, nielimitowani userzy, dedykowane wsparcie, SLA, custom

### Integracje
- Screaming Frog SEO Spider (crawling, Docker container)
- Google Lighthouse (wydajność, Docker container)
- Senuto (widoczność, backlinki, AI Overviews, API)
- Google Gemini 3.0 Flash (AI analiza, multi-key fallback)
- Stripe (płatności, subskrypcje, Customer Portal)
- Supabase (auth, RLS, zespoły)

### Kluczowe USP
- Jedno narzędzie zamiast 5+ (SF + LH + Senuto + AI + raporty)
- Execution Plan z kodem — nie tylko "co poprawić" ale "jak poprawić"
- AI Overviews monitoring — jedyni to robią
- 3-fazowy audyt — technika → AI → plan wykonania
- $29/mc vs $300+/mc u konkurencji
- Dane w UE (Hetzner DE), RODO
