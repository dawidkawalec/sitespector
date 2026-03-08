# SiteSpector — Visual Identity & Brand Book

> **Dla kogo:** Graficy, designerzy, agencja kreatywna, osoba tworząca materiały reklamowe i marketingowe.  
> **Po co:** Kompletny opis tożsamości wizualnej — kolory (z dokładnymi hex/HSL), fonty, typografia, logo, styl graficzny.  
> **Źródło:** Wszystkie wartości wyekstrahowane bezpośrednio z kodu (Tailwind config, globals.css, SCSS variables, SVG logo).

---

## 1. Logo

### Budowa logotypu

Logotyp SiteSpector składa się z dwóch elementów:

**1. Znak graficzny (icon mark) — lupa**
- Stylizowana lupa z uchwytem skierowanym w lewy dół
- Kolor: **`#ea823d`** (ciepły pomarańcz, wariant brandu orange)
- Format: czyste SVG paths, pełna skalowalność

**2. Wordmark — "SiteSpector"**
- Font: geometryczny sans-serif (zbliżony do Outfit Bold 800)
- Kolor: czarny (paths bez fill = `currentColor`)
- Kerning: ciasny, nowoczesny

### Proporcje i layout
- Format: poziomy logotyp (szeroki aspect ratio ~4:1)
- ViewBox SVG: `0 0 3068 759`
- Układ: znak graficzny po lewej, wordmark po prawej
- Tło: transparentne (`.svg` i `.png`)

### Pliki logo
```
sitespector_logo_transp.svg  — wektor (preferowany)
sitespector_logo_transp.png  — raster (do użycia gdy SVG nie jest obsługiwany)
```

### Zasady użycia logo
- **Na jasnym tle:** logo w oryginalnych kolorach (pomarańcz + czarny wordmark)
- **Na ciemnym tle:** wordmark zmieniony na biały (`#ffffff`), znak graficzny bez zmian
- **Minimalna wielkość:** nie mniej niż 120px szerokości w wersji cyfrowej
- **Przestrzeń ochronna:** min. ½ wysokości znaku graficznego z każdej strony
- **Niedozwolone:** rozciąganie, zmiana proporcji, zmiana kolorów znaku, dodawanie cienia

---

## 2. Paleta kolorów

### Kolory brandowe (primary palette)

| Rola | Nazwa | Hex | HSL | Zastosowanie |
|------|-------|-----|-----|-------------|
| **Brand Teal** | Primary | `#0b363d` | `187° 69% 15%` | Główny kolor marki — nagłówki, CTA, navbar, przyciski |
| **Brand Orange** | Accent | `#ff8945` | `21° 100% 63%` | Akcenty, CTA buttons, highlight, ikona w logo |
| **Hover Orange** | Accent Dark | `#e67a3d` | — | Hover state dla elementów pomarańczowych |
| **Logo Orange** | Icon Mark | `#ea823d` | — | Wyłącznie ikona w logo (lupa) |

> **Uwaga:** Kolor ikony logo (`#ea823d`) jest nieznacznie cieplejszy od accent (`#ff8945`). Przy projektowaniu materiałów graficznych używaj `#ff8945` jako standardowego pomarańczu — `#ea823d` tylko jako wierne odwzorowanie logo w SVG.

---

### Kolory neutralne (secondary palette)

| Rola | Nazwa | Hex | HSL | Zastosowanie |
|------|-------|-----|-----|-------------|
| **Background** | Warm White | `#fff9f5` | `30° 100% 99%` | Tło stron marketingowych, jasny motyw |
| **Foreground** | Near Black | `#141822` | `220° 25% 11%` | Główny tekst, nagłówki na jasnym tle |
| **Muted Text** | Gray Medium | `#616c6e` | `180° 5% 41%` | Tekst pomocniczy, opisy, labels |
| **White** | Pure White | `#ffffff` | `0° 0% 100%` | Karty, popovery, tekst na ciemnym tle |
| **Border** | Warm Gray | `hsl(30 10% 90%)` | — | Ramki, separatory, input borders |
| **Secondary BG** | Light Warm | `hsl(30 20% 96%)` | — | Tło sekcji wtórnych, karty |
| **Muted BG** | Near White | `hsl(30 10% 94%)` | — | Tło muted elementów |

---

### Kolory semantyczne

| Rola | Hex | HSL |
|------|-----|-----|
| **Success (green)** | `#81d86f` | jasna zieleń |
| **Warning** | `#eea47f` | ciepły pomarańcz jasny |
| **Info** | `#adefd1` | jasny cyan/mięta |
| **Danger** | `#dc3545` | standardowy red |

---

### Dark Mode — kolory aplikacji

> Strona marketingowa (landing) jest **wyłącznie jasna** (forced light).  
> Aplikacja (dashboard) obsługuje **dark/light toggle** — klasa `.dark` na root.

| Rola | HSL | Przybliżony kolor |
|------|-----|------------------|
| Background | `220° 25% 7%` | Bardzo ciemny granat |
| Card | `220° 25% 9%` | Nieco jaśniejszy granat |
| Primary (Teal) | `187° 69% 35%` | Jaśniejszy teal (dla kontrastu) |
| Secondary/Muted | `220° 25% 15%` | Ciemny blue-gray |
| Muted Foreground | `180° 5% 65%` | Jasny szary z odcieniem teal |
| Border/Input | `220° 25% 15%` | Ciemne obramowania |
| Accent (Orange) | `21° 100% 63%` = `#ff8945` | **Bez zmian** w dark mode |

---

### CSS Variables (do implementacji)

```css
/* Light Mode */
:root {
  --background: 30 100% 99%;      /* #fff9f5 */
  --foreground: 220 25% 11%;      /* #141822 */
  --primary: 187 69% 15%;         /* #0b363d */
  --primary-foreground: 30 100% 99%;
  --accent: 21 100% 63%;          /* #ff8945 */
  --accent-foreground: 0 0% 100%;
  --muted-foreground: 180 5% 41%; /* #616c6e */
  --border: 30 10% 90%;
  --radius: 0.5rem;               /* 8px */
}

/* Dark Mode */
.dark {
  --background: 220 25% 7%;
  --foreground: 210 40% 98%;
  --primary: 187 69% 35%;
  --accent: 21 100% 63%;          /* #ff8945 — unchanged */
  --border: 220 25% 15%;
}
```

---

## 3. Typografia

### Font family

**Jeden font dla całego produktu:**

| Zastosowanie | Font | Import |
|-------------|------|--------|
| **Strona marketingowa** | Outfit | Google Fonts URL |
| **Aplikacja (dashboard)** | Outfit | `next/font/google` |

```css
/* Import dla stron zewnętrznych */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');

/* Lub przez Next.js */
import { Outfit } from 'next/font/google'
```

**CSS variable:** `--font-outfit` (landing), `var(--font-sans)` (frontend app)

### Dostępne grubości
Outfit używany w 9 wagach: 100, 200, 300, **400**, **500**, **600**, **700**, **800**, 900

---

### Skala typograficzna — strona marketingowa (landing)

| Element | Rozmiar | Waga | Line-height | Letter-spacing |
|---------|---------|------|-------------|----------------|
| **H1** (fluid) | `clamp(2.1rem, 3.4vw + 1rem, 3.6rem)` ≈ 34–58px | **800** | 1.12 (hero) / 1.15 (sekcje) | `-0.02em` |
| **H2** (fluid) | `clamp(1.7rem, 2.3vw + 0.9rem, 2.7rem)` ≈ 27–43px | **800** | 1.22 | `-0.02em` |
| **H3** (fluid) | `clamp(1.25rem, 1.2vw + 0.9rem, 1.7rem)` ≈ 20–27px | **700** | 1.25 | `-0.02em` |
| **H4** | — | **600** | — | `-0.02em` |
| **H5** | — | **600** | — | `-0.02em` |
| **H6** | `18px` | **600** | — | `-0.02em` |
| **Body (p)** | `17px` | 400 | — | — |
| **Muted/Label** | `13–14px` | 500–600 | — | `0.05–0.12em` (UPPERCASE labels) |

### Zasady typograficzne
- `text-wrap: balance` — nagłówki (unikanie "wdów")
- `text-wrap: pretty` — paragrafy (lepsza czytelność)
- Nagłówki: zawsze **tight letter-spacing** (`-0.02em`)
- Labels sekcji (ALL CAPS): `letter-spacing: 0.05–0.12em`, waga 600–700
- Body text kolor: `#616c6e` (muted), nagłówki: `#141822` (near-black) lub `#ffffff` na ciemnym tle

---

## 4. Komponenty UI — styl

### Przyciski (Buttons)

**Primary button (CTA główny):**
```
Tło: #ff8945 (Brand Orange)
Tekst: #ffffff (biały)
Border-radius: 3px (landing) / 8px (app)
Hover: tło #e67a3d + transform: translateY(-3px) + box-shadow: 0px 10px 10px -8px #0b363d
Padding: 0.65rem 1.5rem
Font-weight: 600
```

**Secondary button (outline):**
```
Tło: transparent → hover rgba(11, 54, 61, 0.06)
Border: 1px solid #0b363d
Tekst: #0b363d
Hover: delikatne wypełnienie tłem
```

**Accent/filled button (teal):**
```
Tło: #0b363d
Tekst: #fff9f5
Hover: nieco jaśniejszy teal
```

---

### Karty (Cards)

```
Tło: #ffffff (light) / hsl(220 25% 9%) (dark)
Border: 1px solid hsl(30 10% 90%)
Border-radius: 8px (--radius)
Shadow: opcjonalnie delikatny
Padding: 24–32px
```

---

### Sekcje tła

| Styl sekcji | Tło | Tekst | Zastosowanie |
|-------------|-----|-------|-------------|
| Light (domyślna) | `#fff9f5` | `#141822` | Większość sekcji |
| White | `#ffffff` | `#141822` | Karty, wyróżnione sekcje |
| Dark/Hero | `#0b363d` | `#ffffff` | Hero section, CTA sekcje |
| Overlay dark | `rgba(0, 41, 54, 0.91)` | `#ffffff` | Tła z obrazkami |
| Overlay blur | `rgba(0, 41, 54, 0.71)` + `backdrop-filter: blur(4px)` | `#ffffff` | Modalne overlaye |

---

### Efekt "highlight" na tekście (signature motiv)

Element `.text-line` — pomarańczowe podkreślenie za słowem kluczowym w nagłówkach:

```css
.text-line::after {
  content: '';
  position: absolute;
  background: rgba(255, 137, 69, 0.2);  /* #ff8945 @ 20% opacity */
  height: 34%;   /* dolne 34% elementu */
  bottom: 0;
  left: -4px;
  right: -4px;
  z-index: -1;
}
```

**Zastosowanie:** W nagłówkach hero — wyróżnienie kluczowego słowa ("SiteSpector", "SEO", "30 minut") delikatnym pomarańczowym tłem.

---

### Nawigacja (Navbar)

```
Tło: #fff9f5 (wariant "public-light")
Border-bottom: 1px solid rgba(11, 54, 61, 0.12)
Logo: lewy bok
Linki: kolor #0b363d → hover #ff8945
CTA button: #ff8945 → hover #e67a3d
```

---

## 5. Ikonografia i grafika

### Styl ikon
- Zestaw: **Lucide Icons** (React) — używane w aplikacji
- Styl: line icons, stroke-based, rounded
- Rozmiary: 16px (inline), 20px (UI elements), 24px (feature icons)
- Kolor: dziedziczy `currentColor` (dopasowuje się do kontekstu)

### Styl ilustracji / grafik produktowych
- **Screenshots UI** — pokazuj rzeczywisty dashboard (dark lub light mode)
- **Diagramy** — minimalistyczne, na jasnym tle, kolory z palety brand
- **Ikony feature** — monokolorowe lub dwukolorowe (teal + orange), zaokrąglone
- **Mockupy** — laptop/desktop z widocznym UI, ciemne lub neutralne tło urządzenia

### Grafiki dekoracyjne (chart images)
```
Border-radius: 10px
Shadow: rgba(136, 165, 191, 0.48) 6px 2px 16px 0px,
        rgba(255, 255, 255, 0.8) -6px -2px 16px 0px
```

---

## 6. Siatka i layout

### Breakpointy (Tailwind standard)
| Breakpoint | Min-width |
|------------|----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Max-width
- Kontenery treści: `max-w-7xl` = 1280px
- Sekcje wąskie (text-only): `max-w-3xl` = 768px
- Centered: `mx-auto`

### Spacing (gap, padding sekcji)
- Sekcje (padding): `py-16` (64px) → `py-24` (96px) na większych ekranach
- Gap między kartami: `gap-6` (24px) → `gap-8` (32px)
- Padding kart: `p-6` (24px) → `p-8` (32px)

---

## 7. Styl komunikacji wizualnej

### Tonacja ogólna
- **Profesjonalna, ale nie korporacyjna** — brak generycznych stock photos z uśmiechniętymi pracownikami
- **Techniczna, ale przystępna** — screenshoty UI, diagramy, dane liczbowe
- **Polska, B2B** — bez nadmiernej casualności, ale też bez sztywności

### Co używać w materiałach graficznych

**TAK:**
- Screenshoty rzeczywistego UI (dashboard, Execution Plan, PDF raportu)
- Wykresy i wizualizacje danych z audytów
- Diagramy procesu (3 fazy audytu)
- Ikony narzędzi (Screaming Frog, Lighthouse, Senuto, Gemini) — jako partnerzy
- Konkretne liczby i metryki ("30 minut", "$29", "200 zadań")
- Zrzuty Execution Plan z kodem

**NIE:**
- Generyczne stock photos
- Zbyt "startupowe" ilustracje (abstrakcyjne kształty bez sensu)
- Nadmierne gradients w stylu "purple/blue AI startup"
- Emoji w materiałach drukowanych (ok w social media)

---

## 8. Materiały reklamowe — spec techniczny

### Bannery Google Display (wymiary priorytetowe)

| Format | Wymiary | Użycie |
|--------|---------|--------|
| Medium Rectangle | 300 × 250 px | Najwyższy zasięg |
| Leaderboard | 728 × 90 px | Desktop top/bottom |
| Large Rectangle | 336 × 280 px | Sidebar desktop |
| Half Page | 300 × 600 px | High impact |
| Mobile Banner | 320 × 50 px | Mobile |
| Responsive Display | — | Elastyczny (Google auto) |

### Spec bannerów
- Tło: `#0b363d` (teal) lub `#fff9f5` (jasne)
- Logo: w wersji jasnej (teal bg → biały wordmark)
- Akcentujący element: `#ff8945`
- Font: Outfit (pobierany przez system lub embedded w PNG)
- CTA button: pomarańczowy `#ff8945`, biały tekst
- Minimalne marginesy: 8px od krawędzi

### Social Media — wymiary

| Platforma | Format | Wymiary |
|-----------|--------|---------|
| LinkedIn | Post image | 1200 × 628 px |
| LinkedIn | Story | 1080 × 1920 px |
| LinkedIn | Company cover | 1128 × 191 px |
| Facebook | Post image | 1200 × 630 px |
| Instagram | Post (karuzela) | 1080 × 1080 px |
| Twitter/X | Tweet image | 1200 × 675 px |
| YouTube | Thumbnail | 1280 × 720 px |

### Karuzele LinkedIn
- Format: 1080 × 1080 px lub 1200 × 628 px
- Slajd okładki: tło `#0b363d`, tytuł `#ffffff`, akcent `#ff8945`
- Slajdy treści: tło `#ffffff` lub `#fff9f5`, tekst `#141822`
- Konsistentny header: logo (małe) + numer slajdu (prawy górny róg)

---

## 9. Design Tokens — podsumowanie dla designera

### Do Figma / Adobe / narzędzia designerskiego

```
Kolory:
├── Brand/Primary         #0b363d   (Brand Teal)
├── Brand/Accent          #ff8945   (Brand Orange)
├── Brand/Accent-Hover    #e67a3d   (Orange Hover)
├── Neutral/Background    #fff9f5   (Warm White)
├── Neutral/Foreground    #141822   (Near Black)
├── Neutral/Muted         #616c6e   (Gray Text)
├── Neutral/White         #ffffff
├── Neutral/Border        hsl(30 10% 90%)
├── Status/Success        #81d86f
├── Status/Warning        #eea47f
├── Status/Info           #adefd1
└── Status/Danger         #dc3545

Typografia:
├── Font Family           Outfit (Google Fonts)
├── Weight/Regular        400
├── Weight/Medium         500
├── Weight/SemiBold       600
├── Weight/Bold           700
└── Weight/ExtraBold      800

Border Radius:
├── Default               8px (0.5rem)
├── Medium                6px
└── Small                 4px

Shadows:
├── Button Hover          0px 10px 10px -8px #0b363d
└── Card Decorative       rgba(136, 165, 191, 0.48) 6px 2px 16px 0px, rgba(255, 255, 255, 0.8) -6px -2px 16px 0px
```

---

## 10. Czego UNIKAĆ (Anti-patterns)

| Błąd | Dlaczego |
|------|---------|
| Użycie fioletowego lub niebieskiego jako głównego koloru | Brand color to teal `#0b363d` i orange `#ff8945` |
| Zamiana Outfit na inny font | Jeden font = spójność; Outfit ma charakter techniczny ale ludzki |
| Jasny teal na jasnym tle | `#0b363d` na `#fff9f5` — dobry kontrast; odwrotnie — nie |
| Okrągłe przyciski (pill shape) | Brand używa `border-radius: 3–8px`, nie pełnego zaokrąglenia |
| Dark mode na stronie marketingowej | Landing jest wyłącznie jasny (forced light); dark mode tylko w appce |
| Gradient "AI purple→blue" | Nie pasuje do naszego brandu — unikamy generycznego "AI look" |
| Logo bez przestrzeni ochronnej | Min. ½ wysokości znaku z każdej strony |

---

*Aktualizacja: Marzec 2026 | Wersja: 1.0 | Źródło: kod produkcyjny (tailwind.config.ts, globals.css, _variables.scss, SVG logo)*
