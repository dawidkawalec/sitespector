# SiteSpector - Frontend Components

## Overview

SiteSpector frontend uses **shadcn/ui** components built on **Radix UI** primitives, styled with **Tailwind CSS**.

**Component location**: `frontend/components/ui/`

**Custom components**: `frontend/components/`

---

## UI Component Library (shadcn/ui)

### Installation Method

Components are **copy-pasted** (not npm installed):
- Full control over code
- No dependency on external package
- Customizable with Tailwind classes

### Components Used

#### 1. Button (`ui/button.tsx`)

**Usage**:
```tsx
import { Button } from '@/components/ui/button'

<Button>Click me</Button>
<Button variant="outline">Outlined</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Trash className="h-4 w-4" /></Button>
```

**Variants**:
- `default` - Primary button (blue)
- `destructive` - Danger button (red)
- `outline` - Outlined button
- `secondary` - Secondary button (gray)
- `ghost` - No background
- `link` - Link style

**Sizes**: `default`, `sm`, `lg`, `icon`

---

#### 2. Card (`ui/card.tsx`)

**Usage**:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Use cases**:
- Score cards (overall, SEO, performance, content)
- Audit list items
- Result sections

---

#### 3. Badge (`ui/badge.tsx`)

**Usage**:
```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outlined</Badge>
```

**Use cases**:
- Audit status (pending, processing, completed, failed)
- Subscription tiers

---

#### 4. Dialog (`ui/dialog.tsx`)

**Usage**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Use cases**:
- Create audit form (NewAuditDialog)
- Confirmation modals

---

#### 5. Alert Dialog (`ui/alert-dialog.tsx`)

**Usage**:
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Use cases**:
- Delete audit confirmation
- Destructive actions

---

#### 6. Input (`ui/input.tsx`)

**Usage**:
```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="email" 
  placeholder="Email" 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Input type="password" placeholder="Password" />
```

**Styling**: Tailwind classes for focus, border, etc.

---

#### 7. Label (`ui/label.tsx`)

**Usage**:
```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

---

#### 8. Tabs (`ui/tabs.tsx`)

**Usage**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="seo">SEO</TabsTrigger>
    <TabsTrigger value="performance">Performance</TabsTrigger>
    <TabsTrigger value="content">Content</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>

  <TabsContent value="seo">
    {/* SEO content */}
  </TabsContent>
</Tabs>
```

**Use cases**:
- Audit detail page (5 tabs: Overview, SEO, Performance, Content, Competition)

---

#### 9. Scroll Area (`ui/scroll-area.tsx`)

**Usage**:
```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-96">
  {/* Long content that needs scrolling */}
</ScrollArea>
```

**Use cases**:
- Long audit lists
- Large result sections

---

#### 10. Alert (`ui/alert.tsx`)

**Usage**:
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

<Alert variant="destructive">
  {/* Danger alert */}
</Alert>
```

**Use cases**:
- Error messages
- Info notifications (local business detected)

---

## Custom Components

### Senuto Visualization Components (Feb 2026)

`frontend/components/AuditCharts.tsx` now includes additional charts:
- `CompetitorsDualBarChart`
- `DifficultyDistributionChart`
- `SearchVolumeDistributionChart`
- `SerpFeaturesChart`
- `WordCountDistributionChart`
- `TrendsPeakChart`
- `IntentDistributionPieChart`
- `AIOPositionDistributionChart`
- `AIOCompetitorsChart`
- `PositionSparkline` / `TrendsSparkline`

Chart style rule (current product preference):
- Prefer line-like charts with **dashboard gradient style**: `AreaChart` + monotone stroke + soft vertical gradient fill + rounded tooltip card.
- Apply one visual preset across modules (`AuditCharts` + comparison trend) for consistency.
- Keep `BarChart` only for category comparisons where interpolation is misleading (e.g. grouped competitor comparisons, horizontal rank lists).

### New Shared UI Components

- `frontend/components/ui/intent-badge.tsx` - intent + journey stage badges
- `frontend/components/ui/difficulty-badge.tsx` - color-coded difficulty ranges
- `frontend/components/ui/serp-tags.tsx` - snippet tags for SERP features
- `frontend/components/KeywordFeaturesTable.tsx` - reusable feature distribution table

### DataExplorerTable Large Dataset Handling

`frontend/components/DataExplorerTable.tsx` supports:
- search + sorting + exports (existing behavior)
- optional row virtualization for large pages via `@tanstack/react-virtual`
- configurable thresholds (`virtualizeThreshold`, `virtualHeight`)

### NewAuditDialog (`components/NewAuditDialog.tsx`)

**Purpose**: Create new audit with URL and optional competitors

**Usage**:
```tsx
import NewAuditDialog from '@/components/NewAuditDialog'

<NewAuditDialog />
```

**Features**:
- URL input with validation
- Up to 3 competitor URLs
- Auto-prepends `https://` if missing
- React Hook Form validation
- TanStack Query mutation
- Redirects to audit detail page on success

**Code structure**:
```tsx
export default function NewAuditDialog() {
  const [open, setOpen] = useState(false)
  const [competitorCount, setCompetitorCount] = useState(0)
  
  const form = useForm<FormData>({
    defaultValues: {
      url: '',
      competitors: []
    }
  })
  
  const createMutation = useMutation({
    mutationFn: (data) => auditsAPI.create(data),
    onSuccess: (audit) => {
      router.push(`/audits/${audit.id}`)
      setOpen(false)
    }
  })
  
  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ New Audit</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Providers (`components/Providers.tsx`)

**Purpose**: Wrap app with TanStack Query provider

**Usage** (in `app/layout.tsx`):
```tsx
import Providers from '@/components/Providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Code**:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Utility Functions

**Location**: `frontend/lib/utils.ts`

### Format Date

```typescript
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

**Output**: "3 lutego 2025, 10:30"

---

### Format Score

```typescript
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A'
  // Scores are always shown with 2 decimals to avoid long floats in UI.
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(score)
}
```

**Output**: "85,00" or "N/A"

---

### Format Number (Max 2 Decimals)

Use for general metrics/statistics to avoid long floats while keeping integers readable.

```typescript
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A'
  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 2,
  }).format(num)
}
```

---

### Get Score Color

```typescript
export function getScoreColor(score: number | null | undefined): string {
  if (!score) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}
```

**Returns**: Tailwind class for score color

---

### Get Status Badge Variant

```typescript
export function getStatusBadgeVariant(
  status: 'pending' | 'processing' | 'completed' | 'failed'
): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'processing':
      return 'default'
    case 'completed':
      return 'success'  // Custom variant (need to add)
    case 'failed':
      return 'destructive'
  }
}
```

---

## Icons

**Library**: Lucide React

**Installation**: `npm install lucide-react`

**Usage**:
```tsx
import { ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, FileJson } from 'lucide-react'

<Button>
  <Download className="mr-2 h-4 w-4" />
  Download PDF
</Button>

<Loader2 className="h-8 w-8 animate-spin" />
```

**Common icons**:
- `ArrowLeft` - Back button
- `Download` - Download PDF
- `FileJson` - Download raw data
- `RefreshCw` - Refresh/restart
- `Trash` - Delete
- `Loader2` - Loading spinner
- `AlertCircle` - Error/warning

---

## Styling Patterns

### Container Queries (App RWD with persistent ChatPanel)

The authenticated app (`frontend/app/(app)/*`) uses a **persistent ChatPanel** that reduces available width of the content area. Viewport-based breakpoints (`md:`, `lg:`, `xl:`) can look "too wide" when the chat is open, causing layouts to squish.

**Decision**: Prefer **container-query breakpoints** inside the app shell:
- Mark the scrollable content area as a container (`@container`) in `frontend/app/(app)/layout.tsx`
- Use `@md:`, `@lg:`, `@xl:` (instead of `md:`, `lg:`, `xl:`) in pages/components that should adapt to the *content container width*

**Tailwind config**:
- Plugin: `@tailwindcss/container-queries` enabled in `frontend/tailwind.config.ts`
- Custom container breakpoints are mapped to the familiar sizes (`sm`, `md`, `lg`, `xl`, `2xl`)

### Responsive Grid

```tsx
<div className="grid gap-4 @md:grid-cols-2 @lg:grid-cols-4">
  {/* 1 column by default, then adapts to container width */}
</div>
```

### Spacing

```tsx
<div className="space-y-4">  {/* Vertical spacing between children */}
  <Card />
  <Card />
</div>

<div className="flex gap-2">  {/* Horizontal gap */}
  <Button />
  <Button />
</div>
```

### Container

```tsx
<div className="container mx-auto py-8 px-4">
  {/* Centered container with padding */}
</div>
```

If you want children to use `@md:` / `@lg:` etc, ensure the parent is a container:

```tsx
<main className="flex-1 overflow-y-auto relative @container">
  {children}
</main>
```

### Text Colors

```tsx
<p className="text-muted-foreground">  {/* Muted text */}
<p className="text-destructive">       {/* Error text */}
<p className="text-primary">           {/* Primary color */}
```

---

## Component Best Practices

### 1. Always Use Proper Types

```tsx
// ✅ GOOD
interface AuditCardProps {
  audit: Audit
  onDelete: (id: string) => void
}

// ❌ BAD
function AuditCard({ audit, onDelete }: any)
```

### 2. Handle Loading and Error States

```tsx
const { data, isLoading, isError, error } = useQuery(...)

if (isLoading) return <Loader2 className="animate-spin" />
if (isError) return <Alert variant="destructive">{error.message}</Alert>
if (!data) return <p>No data</p>

return <div>{/* Render data */}</div>
```

### 3. Use Optional Chaining

```tsx
// ✅ GOOD
const title = audit.results?.crawl?.title ?? 'No title'

// ❌ BAD
const title = audit.results.crawl.title  // Can crash
```

### 4. Extract Reusable Components

If a component pattern is used 3+ times, extract it:

```tsx
// Reusable metric card
function MetricCard({ label, value, unit }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
      </CardContent>
    </Card>
  )
}
```

---

## Dark Mode Support

**Status**: ✅ **IMPLEMENTED** (2025-02-04)

**Package**: `next-themes` installed

**Config** (`tailwind.config.ts`):
```typescript
export default {
  darkMode: ['class'],
  // ...
}
```

**Provider** (`app/layout.tsx`):
```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <Providers>{children}</Providers>
</ThemeProvider>
```

**Usage**:
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

---

## Audit Navigation Components

### UnifiedSidebar (`components/layout/UnifiedSidebar.tsx`)

**Purpose**: Single sidebar for the entire application, context-aware.

**Features**:
- **Logo + Strona główna**: Logotyp linkuje do /dashboard; przycisk (strzałka wstecz) obok logotypu kieruje na stronę główną (/) z tooltipem „Strona główna”.
- **Main Navigation**: Dashboard and core links.
- **Audit Context**: Automatically shows audit-specific sections (Overview, Reports, Advanced, Tools) when on an audit route.
- **Collapsible Sections**: Uses `NavSection` with smooth CSS grid animations for expanding/collapsing.
- **Visual Indicators**: Active state with a vertical primary-color indicator and subtle background highlights.
- **Mobile Support**: Integration with `MobileSidebar` using an `onAction` callback to close the drawer on navigation.

---

### NavSection (`components/layout/NavSection.tsx`)

**Purpose**: Collapsible navigation group.

**Features**:
- **Smooth Animations**: Uses CSS `grid-template-rows` for height transitions.
- **Accessibility**: Semantic button trigger with chevron indicator.
- **Variants**: Supports 'default' and 'audit' styling.

---

### NavItem (`components/layout/NavItem.tsx`)

**Purpose**: Individual navigation link.

**Features**:
- **Active State**: Visual indicator bar and primary color text.
- **Badges**: Small, uppercase tracking-wider badges for status or counts.
- **Disabled State**: Muted styling for upcoming features.

---

### MobileSidebar (`components/layout/MobileSidebar.tsx`)

**Purpose**: Mobile slide-in menu using `UnifiedSidebar`.

---

### ThemeToggle (`components/ThemeToggle.tsx`)

**Purpose**: Toggle between light and dark mode

**Usage**:
```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle />
```

**Features**:
- Uses `next-themes` for theme management
- Prevents hydration mismatch
- Shows current theme (Jasny/Ciemny)
- Icon changes based on theme

---

### AuditMenuItem (`components/audit/AuditMenuItem.tsx`)

**Purpose**: Single menu item for audit navigation

**Usage**:
```tsx
import { AuditMenuItem } from '@/components/audit/AuditMenuItem'
import { FileText } from 'lucide-react'

<AuditMenuItem 
  href="/audits/123"
  icon={FileText}
  label="Podsumowanie"
  badge="5"
  disabled={false}
/>
```

**Features**:
- Active route highlighting
- Optional badge
- Disabled state for coming soon features
- Icon support

---

### AuditSidebar (`components/audit/AuditSidebar.tsx`)

**Purpose**: Main sidebar navigation for audit pages

**Usage**:
```tsx
import { AuditSidebar } from '@/components/audit/AuditSidebar'

<AuditSidebar auditId="123" />
```

**Features**:
- 3 sections: Aktualny audyt, Narzędzia, System
- Theme toggle at bottom
- Scrollable sidebar
- Disabled items for future features

---

### AuditMobileSidebar (`components/audit/AuditMobileSidebar.tsx`)

**Purpose**: Mobile slide-in menu for audit pages

**Usage**:
```tsx
import { AuditMobileSidebar } from '@/components/audit/AuditMobileSidebar'

<AuditMobileSidebar auditId="123" />
```

**Features**:
- Sheet component (slide from left)
- Hamburger menu trigger
- Hidden on desktop (lg+)
- Contains full AuditSidebar

---

**Last Updated**: 2026-02-16  
**Component library**: shadcn/ui  
**Icon library**: Lucide React  
**Styling**: Tailwind CSS 3.x  
**Theme**: next-themes
