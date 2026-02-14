# 3-Phase Audit System - Frontend Module Refactoring Guide

## Overview

This guide provides the pattern for refactoring all 8 audit module pages to support the 3-mode system:
- **Dane** (Data): Current overview + RAW tabs
- **Analiza** (Analysis): Full-width AI insights (replaces cramped sidebar)
- **Plan** (Execution): Interactive task list with status tracking

## Core Components Created

All components are in `frontend/components/audit/`:

- **ModeSwitcher.tsx** - 3-segment mode control with color-coding
- **AnalysisView.tsx** - Full-width AI insights display
- **TaskListView.tsx** - Filterable, sortable task list
- **TaskCard.tsx** - Expandable task with fix_data and notes
- **QuickWinBadge.tsx** - Quick win indicator

## Module Refactoring Pattern

### 1. Add imports

```typescript
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { auditsAPI } from '@/lib/api'
```

### 2. Add state and data fetching

```typescript
export default function SEOPage({ params }: { params: { id: string } }) {
  // Mode state
  const [mode, setMode] = useAuditMode('data')
  
  // Existing audit query
  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id)
  })
  
  // NEW: Tasks query
  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'seo'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'seo' }),
    enabled: !!audit && mode === 'plan'
  })
  
  // Extract data
  const crawl = audit?.results?.crawl
  const aiContext = audit?.results?.ai_contexts?.seo
  const tasks = tasksResponse?.items || []
  
  // Task handlers
  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (error) {
      toast.error('Nie udało się zaktualizować zadania')
    }
  }
  
  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (error) {
      toast.error('Nie udało się zapisać notatek')
    }
  }
}
```

### 3. Replace content with 3-mode structure

```typescript
return (
  <div className="space-y-6">
    {/* Mode Switcher */}
    <ModeSwitcher
      mode={mode}
      onModeChange={setMode}
      taskCount={tasks.length}
      pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
      hasAiData={!!aiContext && !aiContext.ai_unavailable}
      hasExecutionPlan={audit?.execution_plan_status === 'completed'}
      isAiLoading={audit?.ai_status === 'processing'}
      isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
    />
    
    {/* Data Mode */}
    {mode === 'data' && (
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* EXISTING OVERVIEW CONTENT - Keep as is */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metrics cards */}
          </div>
          {/* Charts, tables, etc. */}
        </TabsContent>
        
        <TabsContent value="raw">
          {/* EXISTING RAW TAB - Keep as is */}
          <RawDataTab crawl={crawl} audit={audit} />
        </TabsContent>
      </Tabs>
    )}
    
    {/* Analysis Mode */}
    {mode === 'analysis' && (
      <AnalysisView
        area="seo"
        aiContext={aiContext}
        isLoading={audit?.ai_status === 'processing'}
      />
    )}
    
    {/* Plan Mode */}
    {mode === 'plan' && (
      <TaskListView
        tasks={tasks}
        module="seo"
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
      />
    )}
  </div>
)
```

## Module-Specific Notes

### SEO Module
- Extract existing overview cards/charts into Data mode
- AI context key: `results.ai_contexts.seo`
- Task module filter: `seo`

### Performance Module
- Keep nested Desktop/Mobile tabs in Data mode
- AI context key: `results.ai_contexts.performance`
- Task module filter: `performance`

### Visibility Module
- Keep complex multi-tab structure in Data mode (Przegląd, Pozycje, Wzrosty/Spadki, etc.)
- AI context key: `results.ai_contexts.visibility`
- Task module filter: `visibility`
- Extra AI fields: `keyword_opportunities`, `competitor_gaps`, `seasonality_strategy`

### AI Overviews Module
- AI context key: `results.ai_contexts.ai_overviews`
- Task module filter: `ai_overviews`
- Extra AI fields: `aio_opportunities`, `competitor_gaps`, `content_rewrite_targets`

### Links Module
- Combine Internal + Incoming tabs in Data mode
- AI context key: `results.ai_contexts.links`
- Task module filter: `links`
- Extra AI fields: `orphan_pages`, `link_juice_distribution`, `silo_suggestions`

### Images Module
- AI context key: `results.ai_contexts.images`
- Task module filter: `images`
- Extra AI fields: `missing_alt_count`, `oversized_images`, `format_suggestions`

### UX Check Module
- AI context key: `results.ux`
- Task module filter: `ux`

### Security Module
- AI context key: `results.security`
- Task module filter: `security`

## Common Patterns

### Empty States

**No AI Data:**
```typescript
{mode === 'analysis' && !aiContext && (
  <Card>
    <CardContent className="py-12">
      <p className="text-center text-muted-foreground">
        Analiza AI nie została jeszcze uruchomiona.
      </p>
      <Button onClick={() => auditsAPI.runAi(params.id)}>
        Uruchom analizę AI
      </Button>
    </CardContent>
  </Card>
)}
```

**No Execution Plan:**
```typescript
{mode === 'plan' && audit?.execution_plan_status !== 'completed' && (
  <Card>
    <CardContent className="py-12">
      <p className="text-center text-muted-foreground">
        Plan wykonania nie został jeszcze wygenerowany.
      </p>
      <Button onClick={() => auditsAPI.runExecutionPlan(params.id)}>
        Wygeneruj plan wykonania
      </Button>
    </CardContent>
  </Card>
)}
```

### Loading States

Use ModeSwitcher's built-in loading indicators for Analysis and Plan modes.

### Mode Persistence

The `useAuditMode` hook automatically persists mode via URL search params (`?mode=data|analysis|plan`).

## Testing Checklist

For each refactored module:

- [ ] Mode switcher displays correctly with proper colors
- [ ] Data mode shows existing overview + RAW tabs
- [ ] Analysis mode displays AI insights full-width
- [ ] Plan mode shows filterable task list
- [ ] Task status toggle works (pending ↔ done)
- [ ] Task notes can be saved
- [ ] Quick wins are highlighted
- [ ] Empty states show appropriate CTAs
- [ ] Loading states work correctly
- [ ] URL mode param updates on mode change
- [ ] Direct links with ?mode=X work correctly

## Implementation Order

Recommended order (easiest to hardest):

1. **Security** - Simplest module
2. **UX Check** - Simple module
3. **Images** - Moderate complexity
4. **Links** - Moderate complexity
5. **SEO** - Complex (many metrics)
6. **Performance** - Complex (nested tabs)
7. **AI Overviews** - Complex (specialized data)
8. **Visibility** - Most complex (multi-tab structure)

## Time Estimates

- Simple modules (Security, UX): 30-45 min each
- Moderate modules (Images, Links): 45-60 min each
- Complex modules (SEO, Performance, AI Overviews, Visibility): 60-90 min each

**Total estimated time: 8-12 hours** for all 8 modules.
