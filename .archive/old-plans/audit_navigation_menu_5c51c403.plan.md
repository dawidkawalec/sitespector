---
name: Audit Navigation Menu
overview: "Implementacja nowego bocznego menu nawigacyjnego dla strony szczegółów audytu, zastępującego obecne zakładki (tabs). Menu będzie dostępne zarówno w wersji desktop (sidebar) jak i mobile (collapsible), zachowując strukturę z 3 sekcjami: Aktualny audyt, Narzędzia, System."
todos:
  - id: setup-dark-mode
    content: Zainstaluj next-themes, dodaj ThemeProvider do root layout, utwórz ThemeToggle component
    status: completed
  - id: create-audit-components
    content: Utwórz AuditSidebar, AuditMenuItem, AuditMobileSidebar components
    status: completed
  - id: create-audit-layout
    content: Utwórz nested layout w /audits/[id]/layout.tsx z audit sidebar
    status: completed
  - id: migrate-overview
    content: Usuń Tabs z page.tsx, zostaw tylko Overview content
    status: completed
  - id: create-seo-page
    content: Utwórz /audits/[id]/seo/page.tsx, przenieś renderSeoResults + Pages + Images + Links + Technical
    status: completed
  - id: create-performance-page
    content: Utwórz /audits/[id]/performance/page.tsx, przenieś renderPerformanceResults
    status: completed
  - id: create-ai-analysis-page
    content: Utwórz /audits/[id]/ai-analysis/page.tsx, przenieś renderContentResults
    status: completed
  - id: create-competitors-page
    content: Utwórz /audits/[id]/competitors/page.tsx, przenieś competitors tab content
    status: completed
  - id: create-debug-pdf-pages
    content: Utwórz /audits/[id]/debug i /pdf pages dla raw data i PDF preview
    status: completed
  - id: create-placeholder-pages
    content: Utwórz placeholder pages dla TODO features (comparison, architecture, benchmark, itd.)
    status: completed
  - id: add-mobile-support
    content: Zintegruj AuditMobileSidebar w layout, test responsywności
    status: completed
  - id: update-documentation
    content: Zaktualizuj .context7/frontend/COMPONENTS.md i PAGES.md
    status: completed
isProject: false
---

# Plan Implementacji Menu Audytu

## Analiza obecnego stanu

**Obecna struktura nawigacji:**

- Globalne menu w `[frontend/app/(app)/layout.tsx](frontend/app/(app)`/layout.tsx) - działa ✅
- Strona audytu w `[frontend/app/(app)/audits/[id]/page.tsx](frontend/app/(app)`/audits/[id]/page.tsx) - używa Tabs
- 9 zakładek: Overview, SEO, Performance, Content, Pages, Images, Links, Technical, Competitors

**Screen pokazuje strukturę:**

1. **Aktualny audyt** (8 pozycji)
2. **Narzędzia** (8 pozycji)
3. **System** (2 pozycje)
4. **Motyw** (theme switcher na dole)

---

## Architektura rozwiązania

### 1. Struktura komponentów

```
components/
├── audit/
│   ├── AuditSidebar.tsx          # Główny sidebar dla audytu (desktop)
│   ├── AuditMobileSidebar.tsx    # Wysuwane menu mobile
│   └── AuditMenuItem.tsx         # Pojedyncza pozycja menu (reusable)
```

### 2. Layout dla strony audytu

Utworzymy **nowy nested layout** w `app/(app)/audits/[id]/`:

```
app/(app)/audits/[id]/
├── layout.tsx          # Nowy layout z audit sidebar
└── page.tsx            # Główna strona (podzielona na sekcje)
```

**Struktura layoutu:**

```tsx
<div className="flex h-screen">
  {/* Globalny sidebar (z app layout) - już działa */}
  
  {/* Audit sidebar (nowy) */}
  <AuditSidebar auditId={params.id} />
  
  {/* Content area */}
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
</div>
```

---

## Mapowanie elementów menu

### Sekcja: "Aktualny audyt"


| Element ze screena     | Obecna zakładka     | Nowy route                   | Ikona          |
| ---------------------- | ------------------- | ---------------------------- | -------------- |
| **Podsumowanie**       | Overview            | `/audits/[id]`               | FileText       |
| **SEO**                | SEO                 | `/audits/[id]/seo`           | Search         |
| **Wydajność**          | Performance         | `/audits/[id]/performance`   | Gauge          |
| **Analiza AI**         | Content (częściowo) | `/audits/[id]/ai-analysis`   | Sparkles       |
| **Porównanie**         | - (nowe)            | `/audits/[id]/comparison`    | ArrowLeftRight |
| **Architektura**       | - (nowe)            | `/audits/[id]/architecture`  | Network        |
| **Debug**              | - (nowe)            | `/audits/[id]/debug`         | Bug            |
| **Raport PDF**         | Download button     | `/audits/[id]/pdf`           | FileDown       |
| **Raport dla klienta** | - (nowe)            | `/audits/[id]/client-report` | FileUser       |
| **Benchmark**          | - (nowe)            | `/audits/[id]/benchmark`     | Target         |
| **Konkurencja**        | Competitors         | `/audits/[id]/competitors`   | Users          |


### Sekcja: "Narzędzia"


| Element         | Funkcja                | Ikona        |
| --------------- | ---------------------- | ------------ |
| **Quick Wins**  | Szybkie usprawnienia   | Zap          |
| **Performance** | Szczegóły wydajności   | Gauge        |
| **SEO**         | Szczegóły SEO          | Search       |
| **Tech Stack**  | Wykryte technologie    | Code2        |
| **Security**    | Analiza bezpieczeństwa | Shield       |
| **AI Content**  | Generowanie treści     | Sparkles     |
| **UX Check**    | Analiza UX             | MousePointer |
| **Integracje**  | Zewnętrzne narzędzia   | Plug         |


### Sekcja: "System"


| Element              | Funkcja       | Ikona    |
| -------------------- | ------------- | -------- |
| **Status silników**  | System Status | Activity |
| **Zadania z audytu** | Eksport zadań | ListTodo |


### Dodatkowe


| Element             | Funkcja          | Lokalizacja    |
| ------------------- | ---------------- | -------------- |
| **Pobierz wtyczkę** | Chrome extension | Poniżej System |
| **Theme toggle**    | Dark/light mode  | Na samym dole  |


---

## Migracja danych z zakładek

### 1. Podsumowanie (Overview)

**Obecne:** `<TabsContent value="overview">`  
**Nowe:** `[/audits/[id]/page.tsx](frontend/app/(app)`/audits/[id]/page.tsx) - główna strona  
**Treść:** Executive Summary, Quick Stats, Top Priority Issues, AI Summary

### 2. SEO

**Obecne:** `renderSeoResults()` w TabsContent  
**Nowe:** `/audits/[id]/seo/page.tsx`  
**Treść:** Title, meta, H1, status code, load time, word count

### 3. Wydajność (Performance)

**Obecne:** `renderPerformanceResults()` w TabsContent  
**Nowe:** `/audits/[id]/performance/page.tsx`  
**Treść:** Core Web Vitals, diagnostics, opportunities

### 4. Content → Analiza AI

**Obecne:** `renderContentResults()` w TabsContent  
**Nowe:** `/audits/[id]/ai-analysis/page.tsx`  
**Treść:** Quality score, readability, recommendations

### 5. Wszystkie Strony (Pages)

**Obecne:** `renderAllPages()` w TabsContent  
**Nowe:** `/audits/[id]/seo/page.tsx` (jako podsekcja)  
**Lub:** `/audits/[id]/pages/page.tsx`  
**Treść:** Tabela stron z filtrowaniem i sortowaniem

### 6. Obrazy (Images)

**Obecne:** `renderImages()` w TabsContent  
**Nowe:** `/audits/[id]/seo/page.tsx` (jako podsekcja)  
**Lub:** `/audits/[id]/images/page.tsx`  
**Treść:** Lista obrazów z/bez ALT, rozmiary

### 7. Linki (Links)

**Obecne:** `renderLinks()` w TabsContent  
**Nowe:** `/audits/[id]/seo/page.tsx` (jako podsekcja)  
**Lub:** `/audits/[id]/links/page.tsx`  
**Treść:** Broken links, redirects, internal/external

### 8. Techniczne SEO (Technical)

**Obecne:** `renderTechnicalSEO()` w TabsContent  
**Nowe:** `/audits/[id]/seo/page.tsx` (jako podsekcja)  
**Lub:** `/audits/[id]/technical/page.tsx`  
**Treść:** Canonical tags, noindex pages

### 9. Konkurencja (Competitors)

**Obecne:** TabsContent z competitor.results  
**Nowe:** `/audits/[id]/competitors/page.tsx`  
**Treść:** Lista konkurentów z wynikami

---

## Routing Structure

```
/audits/[id]/
├── page.tsx                    # Podsumowanie (Overview)
├── layout.tsx                  # Layout z AuditSidebar
├── seo/
│   └── page.tsx                # SEO + Pages + Images + Links + Technical
├── performance/
│   └── page.tsx                # Wydajność
├── ai-analysis/
│   └── page.tsx                # Analiza AI (była Content)
├── comparison/
│   └── page.tsx                # Porównanie (TODO - future)
├── competitors/
│   └── page.tsx                # Konkurencja
├── architecture/
│   └── page.tsx                # Architektura tech stack (TODO)
├── debug/
│   └── page.tsx                # Debug data (raw JSON viewer)
├── pdf/
│   └── page.tsx                # Podgląd/download PDF
├── client-report/
│   └── page.tsx                # Raport dla klienta (TODO)
└── benchmark/
    └── page.tsx                # Benchmark (TODO)
```

**Sekcja "Narzędzia"** - TODO (future features):

- Quick Wins
- Tech Stack
- Security
- AI Content
- UX Check
- Integracje

---

## Komponenty do utworzenia

### 1. AuditSidebar.tsx

```tsx
'use client'

import { AuditMenuItem } from './AuditMenuItem'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FileText, Search, Gauge, Sparkles, /* ... */ } from 'lucide-react'

interface AuditSidebarProps {
  auditId: string
}

export function AuditSidebar({ auditId }: AuditSidebarProps) {
  return (
    <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground">
          Aktualny audyt
        </h2>
      </div>

      {/* Section 1: Aktualny audyt */}
      <nav className="p-2">
        <AuditMenuItem 
          href={`/audits/${auditId}`}
          icon={FileText}
          label="Podsumowanie"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/seo`}
          icon={Search}
          label="SEO"
        />
        {/* ... more items */}
      </nav>

      {/* Section 2: Narzędzia */}
      <div className="p-2 mt-4">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground">
          Narzędzia
        </h3>
        {/* TODO items */}
      </div>

      {/* Section 3: System */}
      <div className="p-2 mt-4">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground">
          System
        </h3>
        {/* System items */}
      </div>

      {/* Theme toggle at bottom */}
      <div className="p-4 border-t mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  )
}
```

### 2. AuditMenuItem.tsx

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditMenuItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
}

export function AuditMenuItem({ href, icon: Icon, label, badge }: AuditMenuItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </Link>
  )
}
```

### 3. ThemeToggle.tsx

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 mr-3" />
      ) : (
        <Moon className="h-4 w-4 mr-3" />
      )}
      Motyw: {theme === 'dark' ? 'Ciemny' : 'Jasny'}
    </Button>
  )
}
```

### 4. AuditMobileSidebar.tsx

```tsx
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AuditSidebar } from './AuditSidebar'

interface AuditMobileSidebarProps {
  auditId: string
}

export function AuditMobileSidebar({ auditId }: AuditMobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <AuditSidebar auditId={auditId} />
      </SheetContent>
    </Sheet>
  )
}
```

---

## Dark Mode Setup

**Instalacja:** `npm install next-themes`

**Provider w root layout:**

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Migracja treści

### Krok 1: Przenieś rendering functions

- Skopiuj `renderSeoResults()`, `renderPerformanceResults()`, itd. do osobnych komponentów
- Usuń Tabs z `[frontend/app/(app)/audits/[id]/page.tsx](frontend/app/(app)`/audits/[id]/page.tsx)

### Krok 2: Utwórz nowe strony

- `/audits/[id]/seo/page.tsx` → `<SeoResults />`
- `/audits/[id]/performance/page.tsx` → `<PerformanceResults />`
- `/audits/[id]/ai-analysis/page.tsx` → `<ContentResults />`

### Krok 3: Zachowaj istniejącą logikę

- Polling (useQuery refetchInterval)
- Delete/Retry buttons
- Download PDF/Raw

---

## Responsywność

**Desktop (≥1024px):**

- Globalny sidebar (256px) + Audit sidebar (256px) + Content
- Total width: ~512px + content

**Tablet (768-1023px):**

- Globalny sidebar zwinięty (64px icons-only) + Audit sidebar (256px) + Content

**Mobile (<768px):**

- Oba sidebary ukryte
- Hamburger menu otwiera Sheet z combined navigation

---

## Kolejność implementacji

1. **Setup dark mode** (next-themes)
2. **Utwórz komponenty** (AuditSidebar, AuditMenuItem, ThemeToggle)
3. **Utwórz layout** `/audits/[id]/layout.tsx`
4. **Migruj Overview** - zostaw na głównej stronie
5. **Utwórz /seo** - przenieś SEO tab
6. **Utwórz /performance** - przenieś Performance tab
7. **Utwórz /ai-analysis** - przenieś Content tab
8. **Utwórz /competitors** - przenieś Competitors tab
9. **Dodaj mobile support** (AuditMobileSidebar)
10. **Dodaj TODO routes** (placeholder pages)
11. **Usuń stare Tabs** z page.tsx

---

## Uwagi techniczne

- **Route Group**: Używamy już `(app)` dla dashboard layout
- **Nested Layout**: Audit layout będzie dziedziczyć po `(app)` layout
- **Data Fetching**: useQuery pozostaje w page.tsx, przekazujemy props do child components
- **URL State**: Active route = active menu item (usePathname)
- **Icons**: Lucide React (już używamy)
- **Styling**: Tailwind + shadcn/ui (konsystentne z resztą)

---

## Co NIE robimy (TODO - future)

Według screena są elementy które nie mają jeszcze danych/funkcji:

- ❌ Porównanie (wymaga historii audytów)
- ❌ Architektura (wykrywanie tech stack)
- ❌ Debug (już jest jako Download Raw Data)
- ❌ Raport dla klienta (custom template)
- ❌ Benchmark (porównanie z industry standards)
- ❌ Quick Wins (AI-generated quick fixes)
- ❌ Tech Stack (technology detection)
- ❌ Security (security audit)
- ❌ AI Content (content generation)
- ❌ UX Check (UX analysis)
- ❌ Integracje (external tools)

**Dla tych utworzymy placeholder pages z "Coming Soon"**

---

## Pliki do utworzenia/edycji

### Nowe pliki:

1. `frontend/components/audit/AuditSidebar.tsx`
2. `frontend/components/audit/AuditMenuItem.tsx`
3. `frontend/components/audit/AuditMobileSidebar.tsx`
4. `frontend/components/ThemeToggle.tsx`
5. `frontend/app/(app)/audits/[id]/layout.tsx`
6. `frontend/app/(app)/audits/[id]/seo/page.tsx`
7. `frontend/app/(app)/audits/[id]/performance/page.tsx`
8. `frontend/app/(app)/audits/[id]/ai-analysis/page.tsx`
9. `frontend/app/(app)/audits/[id]/competitors/page.tsx`
10. `frontend/app/(app)/audits/[id]/debug/page.tsx`
11. `frontend/app/(app)/audits/[id]/pdf/page.tsx`
12. Placeholder pages dla TODO features

### Edycja:

1. `[frontend/app/(app)/audits/[id]/page.tsx](frontend/app/(app)`/audits/[id]/page.tsx) - usuń Tabs, zostaw Overview
2. `[frontend/app/layout.tsx](frontend/app/layout.tsx)` - dodaj ThemeProvider
3. `[frontend/package.json](frontend/package.json)` - dodaj next-themes
4. `.context7/frontend/COMPONENTS.md` - update dokumentacji

---

## Testing Checklist

- Desktop: Oba sidebary widoczne, scroll działa
- Tablet: Globalny sidebar zwinięty, audit sidebar pełny
- Mobile: Sheet z hamburger menu
- Active route highlighting
- Dark mode toggle działa
- Wszystkie linki prowadzą do właściwych stron
- Data fetching w nowych page.tsx
- Polling dla processing audits
- Delete/Retry buttons działają
- PDF download działa

