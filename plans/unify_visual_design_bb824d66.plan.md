---
name: Unify Visual Design
overview: "Ujednolicenie wizualne calej aplikacji SaaS z design systemem landing page (demosite). Przeniesienie palety kolorow (dark teal #0b363d + orange #ff8945), fontu Outfit, stylu przyciskow, kart i layoutu z demosite do calego frontendu SaaS."
todos:
  - id: phase-1-tokens
    content: "Faza 1: Fundament -- globals.css (nowe CSS variables), tailwind.config.ts (nowe kolory), layout.tsx (font Outfit)"
    status: completed
  - id: phase-2-ui
    content: "Faza 2: Komponenty UI -- button.tsx (accent variant, hover effects), card.tsx, badge.tsx, input.tsx, progress.tsx"
    status: completed
  - id: phase-3-sidebar
    content: "Faza 3: Sidebar -- UnifiedSidebar.tsx (dark teal gradient, orange active, logo), NavItem, NavSection, MobileSidebar, app layout"
    status: completed
  - id: phase-4-auth
    content: "Faza 4: Auth pages -- login/page.tsx, register/page.tsx (branded backgrounds, logo, styling)"
    status: completed
  - id: phase-5-dashboard
    content: "Faza 5: Dashboard -- dashboard/page.tsx (brand gradients, chart colors, card styling)"
    status: completed
  - id: phase-6-audits
    content: "Faza 6: Audit pages -- 18 stron audytow (hardcoded colors, section headers, score colors)"
    status: completed
  - id: phase-7-settings
    content: "Faza 7: Settings + inne -- 8 stron settings/pricing/invite (form styling, brand colors)"
    status: completed
  - id: phase-8-components
    content: "Faza 8: Shared components -- WorkspaceSwitcher, NewAuditDialog, AuditCharts, SystemStatus, utils.ts"
    status: completed
isProject: false
---

# Ujednolicenie wizualne SaaS z Landing Page

## Analiza obecnego stanu

**Demosite (Landing Page)** -- osobny kontener w `demosite/`:

- Font: **Outfit** (Google Fonts)
- Primary: `#0b363d` (ciemny teal)
- Accent/Orange: `#ff8945` (pomaranczowy - CTA, highlighty)
- Light BG: `#fff9f5` (ciepla biel)
- Success: `#81d86f`, Info/Cyan: `#adefd1`
- Body text: `#616c6e`, Dark: `#141822`
- Buttons: 3px radius, hover translateY(-3px) + shadow, padding 10px 28px
- Cards: rounded-10px, subtelne cienie
- Sekcje tytulowe: pomaranczowy "text-line" highlight pod tekstem
- Footer gradient: `linear-gradient(to right, #0b363d, #001113)`
- Ikony: `react-icons/ri` (Remix Icons)

**Frontend SaaS App** -- w `frontend/`:

- Font: **Inter**
- Kolory: domyslna paleta shadcn/ui (neutralne szarosci)
- Brak brandowych kolorow, brak gradientow w systemie
- shadcn/ui + Tailwind, ~50+ plikow do zmiany

## Strategia: podejscie warstwowe

Zmiana CSS variables w `globals.css` + `tailwind.config.ts` automatycznie wplynie na WSZYSTKIE komponenty shadcn/ui. Nastepnie aktualizacja komponentow ktore uzywaja hardcoded kolorow.

---

## Faza 1: Fundament Design Systemu (tokeny, font, konfiguracja)

**Pliki do zmiany:**

- `[frontend/app/layout.tsx](frontend/app/layout.tsx)` -- zmiana fontu Inter -> Outfit
- `[frontend/app/globals.css](frontend/app/globals.css)` -- nowe CSS variables

**Nowa paleta Light Mode:**

- `--background`: ciepla biel (`30 100% 99%` ~ #fff9f5)
- `--foreground`: ciemny (`220 25% 11%` ~ #141822)
- `--primary`: dark teal (`174 72% 14%` ~ #0b363d)
- `--primary-foreground`: bialy
- `--accent`: orange (`21 100% 63%` ~ #ff8945)  -- NOWY token
- `--accent-foreground`: bialy
- `--muted`: jasnoszary cieplejszy
- `--muted-foreground`: `180 5% 41%` ~ #616c6e
- `--card`: bialy
- `--border`: jasnoszary cieplejszy
- `--destructive`: czerwony (bez zmian)

**Nowa paleta Dark Mode:**

- `--background`: bardzo ciemny (`220 25% 7%`)
- `--foreground`: off-white
- `--primary`: jasniejszy teal / teal zachowany
- `--accent`: ten sam orange #ff8945

**Tailwind config** -- `[frontend/tailwind.config.ts](frontend/tailwind.config.ts)`:

- Dodanie `accent` jako osobny kolor
- Dodanie `brand` kolorow (teal, orange) dla bezposredniego uzycia

---

## Faza 2: Komponenty UI (shadcn/ui)

**Pliki:**

- `[frontend/components/ui/button.tsx](frontend/components/ui/button.tsx)` -- nowy variant "accent" (pomaranczowy), hover z translateY(-2px) + shadow
- `[frontend/components/ui/card.tsx](frontend/components/ui/card.tsx)` -- zaktualizowane shadow, radius
- `[frontend/components/ui/badge.tsx](frontend/components/ui/badge.tsx)` -- nowe warianty z brandowymi kolorami
- `[frontend/components/ui/input.tsx](frontend/components/ui/input.tsx)` -- cieplejsze obramowania, focus ring w kolorze teal
- `[frontend/components/ui/progress.tsx](frontend/components/ui/progress.tsx)` -- brand kolory dla paskow

---

## Faza 3: Sidebar i Layout

**Pliki:**

- `[frontend/components/layout/UnifiedSidebar.tsx](frontend/components/layout/UnifiedSidebar.tsx)`:
  - Tlo: gradient od `#0b363d` do ciemniejszego (jak footer w demosite)
  - Teksty: jasne (bialy/off-white)
  - Active items: pomaranczowy accent
  - Logo: ikona `RiSearchEyeFill` z pomaranczowym kolorem (jak w demosite topbar)
  - Workspace switcher: ciemne tlo z subtelnymi obramowaniami
- `[frontend/components/layout/NavItem.tsx](frontend/components/layout/NavItem.tsx)` -- jasne kolory tekstu, orange active
- `[frontend/components/layout/NavSection.tsx](frontend/components/layout/NavSection.tsx)` -- dopasowanie
- `[frontend/components/layout/MobileSidebar.tsx](frontend/components/layout/MobileSidebar.tsx)` -- analogicznie
- `[frontend/app/(app)/layout.tsx](frontend/app/(app)`/layout.tsx) -- mobile header styling

---

## Faza 4: Strony Auth (Login/Register)

**Pliki:**

- `[frontend/app/login/page.tsx](frontend/app/login/page.tsx)`:
  - Dekoracyjne tlo z gradientem/patternem
  - Branding SiteSpector z logo
  - Przycisk "Sign in" w kolorze primary (teal)
  - OAuth przyciski z lepszym stylem
- `[frontend/app/register/page.tsx](frontend/app/register/page.tsx)` -- analogicznie
- `[frontend/app/page.tsx](frontend/app/page.tsx)` -- zastapienie minimalnej strony bardziej prezentacyjna wersja (opcjonalnie - lub redirect na login)

---

## Faza 5: Dashboard

**Plik:** `[frontend/app/(app)/dashboard/page.tsx](frontend/app/(app)`/dashboard/page.tsx)

- Gradienty kart: cieplejsze z tintem teal/orange
- Karta "Activity": bg-primary (dark teal) zamiast generycznego
- Wykresy: kolory brand (teal, orange, green)
- Progress bary: brand kolory
- Audit karty: hover shadow z teal/orange tintem
- Header: dodanie brandowego akcentu

---

## Faza 6: Strony Audytow (~18 stron)

**Podejscie:** Wiekszosc stron uzywaja komponentow Card, Badge, Button ktore juz beda zaktualizowane przez Faze 1-2. Trzeba zaktualizowac:

- Hardcoded kolory (`text-blue-500`, `bg-slate-100`, itp.)
- Naglowki sekcji -- dodanie stylu "text-line" (pomaranczowy highlight pod tekstem)
- Score kolory -- ujednolicenie z paleta

**Pliki** (wszystkie w `frontend/app/(app)/audits/[id]/`):

- `page.tsx`, `seo/page.tsx`, `performance/page.tsx`, `ai-analysis/page.tsx`
- `ai-content/page.tsx`, `comparison/page.tsx`, `competitors/page.tsx`
- `benchmark/page.tsx`, `client-report/page.tsx`, `pdf/page.tsx`
- `architecture/page.tsx`, `debug/page.tsx`, `images/page.tsx`
- `links/page.tsx`, `quick-wins/page.tsx`, `security/page.tsx`
- `ux-check/page.tsx`, `pages/[pageIndex]/page.tsx`

---

## Faza 7: Settings i inne strony

**Pliki:**

- `frontend/app/(app)/settings/profile/page.tsx`
- `frontend/app/(app)/settings/team/page.tsx`
- `frontend/app/(app)/settings/billing/page.tsx`
- `frontend/app/(app)/settings/schedules/page.tsx`
- `frontend/app/(app)/settings/appearance/page.tsx`
- `frontend/app/(app)/settings/notifications/page.tsx`
- `frontend/app/(app)/pricing/page.tsx`
- `frontend/app/(app)/invite/[token]/page.tsx`

---

## Faza 8: Komponenty wspolne

- `[frontend/components/WorkspaceSwitcher.tsx](frontend/components/WorkspaceSwitcher.tsx)` -- dark-bg gdy w sidebar
- `[frontend/components/NewAuditDialog.tsx](frontend/components/NewAuditDialog.tsx)` -- brand styling
- `[frontend/components/AuditCharts.tsx](frontend/components/AuditCharts.tsx)` -- brand chart colors
- `[frontend/components/SystemStatus.tsx](frontend/components/SystemStatus.tsx)` -- dopasowanie
- `[frontend/components/ThemeToggle.tsx](frontend/components/ThemeToggle.tsx)` -- dopasowanie
- `[frontend/lib/utils.ts](frontend/lib/utils.ts)` -- score color helper z nowymi kolorami

---

## Podsumowanie zmian

- ~50+ plikow do modyfikacji
- Faza 1 (fundament) automatycznie zmieni wyglad ~60% komponentow
- Fazy 2-3 (UI components + sidebar) pokryja kolejne ~25%
- Fazy 4-8 (strony) to dokladanie szczegolowych brandingowych akcentow
- Priorytet: Light mode (zgodnie z wyborem)
- Dark mode: komplementarna paleta utrzymana

