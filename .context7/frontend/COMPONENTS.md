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
  if (score === null || score === undefined) return '-'
  return Math.round(score).toString()
}
```

**Output**: "85" or "-"

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

### Responsive Grid

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 column mobile, 2 tablet, 4 desktop */}
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

**Status**: Tailwind configured for dark mode (not implemented in UI yet)

**Config** (`tailwind.config.ts`):
```typescript
export default {
  darkMode: ['class'],
  // ...
}
```

**Usage**:
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

---

**Last Updated**: 2025-02-03  
**Component library**: shadcn/ui  
**Icon library**: Lucide React  
**Styling**: Tailwind CSS 3.x
