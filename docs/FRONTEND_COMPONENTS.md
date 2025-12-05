# Frontend Components Specification
## SiteSpector.app - shadcn/ui + Tailwind

**Last Updated:** 2025-12-04  
**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui

---

## 🎨 Design System

### Colors
```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: '#eff6ff',
    500: '#2563eb',  // Main brand color
    600: '#1d4ed8',
    700: '#1e40af',
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  }
}
```

### Typography
- **Headings:** Inter Bold (sans-serif)
- **Body:** Inter Regular
- **Code:** JetBrains Mono

---

## 📦 shadcn/ui Components Used

Install these components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
```

---

## 🧩 Component Specifications

### 1. Header Component
**File:** `components/Header.tsx`

```typescript
interface HeaderProps {
  user?: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav>
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <AuthButtons />
          )}
        </nav>
      </div>
    </header>
  );
}
```

**Features:**
- Logo (links to /)
- Navigation menu
- User avatar + dropdown (if logged in)
- Login/Register buttons (if not logged in)

---

### 2. Sidebar Component
**File:** `components/Sidebar.tsx`

```typescript
interface SidebarProps {
  activeRoute: string;
}

const menuItems = [
  { icon: HomeIcon, label: 'Dashboard', href: '/dashboard' },
  { icon: FileTextIcon, label: 'Audits', href: '/audits' },
  { icon: CreditCardIcon, label: 'Billing', href: '/billing' },
  { icon: SettingsIcon, label: 'Settings', href: '/settings' },
];

export function Sidebar({ activeRoute }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-gray-50">
      <nav className="space-y-1 p-4">
        {menuItems.map(item => (
          <SidebarItem 
            key={item.href}
            {...item}
            active={activeRoute === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}
```

**Features:**
- Fixed left sidebar
- Active state highlighting
- Icons from lucide-react

---

### 3. AuditCard Component
**File:** `components/AuditCard.tsx`

```typescript
interface AuditCardProps {
  audit: Audit;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AuditCard({ audit, onView, onDelete }: AuditCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{audit.url}</CardTitle>
            <CardDescription>
              {formatDate(audit.created_at)}
            </CardDescription>
          </div>
          <StatusBadge status={audit.status} />
        </div>
      </CardHeader>
      
      <CardContent>
        {audit.status === 'completed' && (
          <div className="space-y-2">
            <ScoreDisplay 
              label="Overall"
              score={audit.overall_score}
            />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <ScorePill label="SEO" score={audit.seo_score} />
              <ScorePill label="Performance" score={audit.performance_score} />
              <ScorePill label="Content" score={audit.content_score} />
            </div>
          </div>
        )}
        
        {audit.status === 'processing' && (
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-sm text-gray-600">
              Analyzing website...
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          onClick={() => onView(audit.id)}
          disabled={audit.status !== 'completed'}
        >
          View Report
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onDelete(audit.id)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Features:**
- Shows URL, date, status
- Score visualization (if completed)
- Loading state (if processing)
- Action buttons (View, Delete)

---

### 4. StatusBadge Component
**File:** `components/StatusBadge.tsx`

```typescript
type Status = 'pending' | 'processing' | 'completed' | 'failed';

const statusConfig: Record<Status, { label: string; variant: string; icon: ReactNode }> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary',
    icon: <ClockIcon className="h-3 w-3" />
  },
  processing: { 
    label: 'Processing', 
    variant: 'default',
    icon: <Loader2Icon className="h-3 w-3 animate-spin" />
  },
  completed: { 
    label: 'Completed', 
    variant: 'success',
    icon: <CheckCircleIcon className="h-3 w-3" />
  },
  failed: { 
    label: 'Failed', 
    variant: 'destructive',
    icon: <XCircleIcon className="h-3 w-3" />
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
```

**Features:**
- Color-coded by status
- Animated spinner for "processing"
- Icons for visual clarity

---

### 5. ScoreDisplay Component
**File:** `components/ScoreDisplay.tsx`

```typescript
interface ScoreDisplayProps {
  label: string;
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ label, score, size = 'md' }: ScoreDisplayProps) {
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const sizeClasses = {
    sm: 'h-16 w-16 text-sm',
    md: 'h-24 w-24 text-xl',
    lg: 'h-32 w-32 text-3xl',
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "relative flex items-center justify-center rounded-full border-4",
        sizeClasses[size],
        `border-${color}`
      )}>
        <span className="font-bold">{score}</span>
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}
```

**Features:**
- Circular score visualization
- Color-coded (green/yellow/red)
- Three sizes (sm/md/lg)

---

### 6. NewAuditDialog Component
**File:** `components/NewAuditDialog.tsx`

```typescript
interface NewAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string, competitors?: string[]) => Promise<void>;
}

export function NewAuditDialog({ open, onOpenChange, onSubmit }: NewAuditDialogProps) {
  const form = useForm<{ url: string; competitors: string[] }>({
    resolver: zodResolver(auditSchema),
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Website Audit</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to audit
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="competitors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitors (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="One URL per line (max 3)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Compare your site with up to 3 competitors
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Audit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**Features:**
- URL validation (HTTPS required)
- Optional competitor URLs (max 3)
- Form validation with Zod
- Loading state

---

### 7. AuditTable Component
**File:** `components/AuditTable.tsx`

```typescript
interface AuditTableProps {
  audits: Audit[];
  onRowClick: (audit: Audit) => void;
}

const columns: ColumnDef<Audit>[] = [
  {
    accessorKey: 'url',
    header: 'Website',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('url')}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'overall_score',
    header: 'Score',
    cell: ({ row }) => {
      const score = row.getValue('overall_score') as number;
      return <ScorePill score={score} />;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => formatDate(row.getValue('created_at')),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => viewAudit(row.original.id)}>
            <EyeIcon className="mr-2 h-4 w-4" />
            View Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadPdf(row.original.id)}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => deleteAudit(row.original.id)}
            className="text-red-600"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function AuditTable({ audits, onRowClick }: AuditTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={audits}
      onRowClick={onRowClick}
    />
  );
}
```

**Features:**
- Sortable columns
- Row click to view details
- Actions dropdown (View, Download, Delete)
- Pagination (built into DataTable)

---

### 8. CodeBlock Component
**File:** `components/CodeBlock.tsx`

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  copyable?: boolean;
}

export function CodeBlock({ code, language, title, copyable = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative rounded-lg overflow-hidden border">
      {title && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 flex items-center justify-between">
          <span>{title}</span>
          {copyable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-300 hover:text-white"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
```

**Features:**
- Syntax highlighting (20+ languages)
- Copy button
- Optional title
- Dark theme

---

### 9. RecommendationCard Component
**File:** `components/RecommendationCard.tsx`

```typescript
interface Recommendation {
  id: string;
  category: 'seo' | 'performance' | 'content';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  code_snippet?: string;
  estimated_impact: string;
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityConfig = {
    high: { color: 'red', icon: <AlertCircleIcon /> },
    medium: { color: 'yellow', icon: <AlertTriangleIcon /> },
    low: { color: 'blue', icon: <InfoIcon /> },
  };
  
  const config = priorityConfig[recommendation.priority];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${config.color}-100`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-base">{recommendation.issue}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {recommendation.category.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Badge variant={config.color}>
            {recommendation.priority.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium text-sm mb-1">How to fix:</h4>
          <p className="text-sm text-gray-600">{recommendation.fix}</p>
        </div>
        
        {recommendation.code_snippet && (
          <CodeBlock
            code={recommendation.code_snippet}
            language="html"
            title="Implementation"
          />
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <TrendingUpIcon className="h-4 w-4 text-green-600" />
          <span className="text-gray-600">
            Expected impact: {recommendation.estimated_impact}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Priority-based styling
- Category badge
- Code snippet with copy button
- Impact estimate

---

## 🎨 Layout Components

### DashboardLayout
**File:** `components/layouts/DashboardLayout.tsx`

```typescript
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeRoute={usePathname()} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 📱 Responsive Design

All components use Tailwind responsive classes:
```typescript
// Mobile-first approach
className="flex flex-col md:flex-row lg:gap-8"

// Hide on mobile
className="hidden md:block"

// Full width on mobile, fixed on desktop
className="w-full md:w-64"
```

---

## ♿ Accessibility

All components follow WCAG 2.1 AA:
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- ARIA labels where needed
- Keyboard navigation support
- Focus states visible
- Color contrast ratio > 4.5:1

---

## 🧪 Component Testing

Example test for AuditCard:
```typescript
// __tests__/AuditCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditCard } from '@/components/AuditCard';

describe('AuditCard', () => {
  const mockAudit = {
    id: '123',
    url: 'https://example.com',
    status: 'completed',
    overall_score: 75,
    created_at: new Date(),
  };
  
  it('renders audit URL', () => {
    render(<AuditCard audit={mockAudit} />);
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
  
  it('calls onView when button clicked', () => {
    const onView = jest.fn();
    render(<AuditCard audit={mockAudit} onView={onView} />);
    
    fireEvent.click(screen.getByText('View Report'));
    expect(onView).toHaveBeenCalledWith('123');
  });
});
```

---

**Document Status:** ✅ COMPLETE  
**Total Components:** 9 core + 1 layout  
**Next:** TESTING_STRATEGY.md
