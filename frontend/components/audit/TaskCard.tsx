'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Code2, Save } from 'lucide-react'
import { QuickWinBadge } from './QuickWinBadge'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  is_quick_win: boolean
  status: 'pending' | 'done'
  notes?: string
  fix_data?: {
    current_value?: string
    suggested_value?: string
    code_snippet?: string
    [key: string]: any
  }
}

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, status: 'pending' | 'done') => void
  onNotesChange: (taskId: string, notes: string) => void
}

const priorityColors = {
  critical: 'border-red-500 bg-red-500/5',
  high: 'border-orange-500 bg-orange-500/5',
  medium: 'border-yellow-500 bg-yellow-500/5',
  low: 'border-blue-500 bg-blue-500/5'
}

const priorityBadgeVariants = {
  critical: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
}

export function TaskCard({ task, onStatusChange, onNotesChange }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localNotes, setLocalNotes] = useState(task.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    await onNotesChange(task.id, localNotes)
    setIsSavingNotes(false)
  }

  const hasNotesChanged = localNotes !== (task.notes || '')

  return (
    <Card
      className={cn(
        'transition-all',
        priorityColors[task.priority],
        task.status === 'done' && 'opacity-60'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={(checked) => onStatusChange(task.id, checked ? 'done' : 'pending')}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                'font-medium',
                task.status === 'done' && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.is_quick_win && <QuickWinBadge showLabel={false} />}
                <Badge variant="outline" className={priorityBadgeVariants[task.priority]}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Impact: {task.impact}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Effort: {task.effort}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {task.description}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Expandable Section */}
      {task.fix_data && Object.keys(task.fix_data).length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardContent className="pt-0 space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                <ChevronDown className={cn(
                  'w-4 h-4 mr-2 transition-transform',
                  isExpanded && 'rotate-180'
                )} />
                {isExpanded ? 'Ukryj szczegóły' : 'Pokaż szczegóły implementacji'}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4">
              {/* Current Value */}
              {task.fix_data.current_value && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Obecna wartość:
                  </label>
                  <div className="p-3 rounded-md bg-muted text-sm">
                    {task.fix_data.current_value}
                  </div>
                </div>
              )}

              {/* Suggested Value */}
              {task.fix_data.suggested_value && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600 dark:text-green-400">
                    Sugerowana wartość:
                  </label>
                  <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-sm">
                    {task.fix_data.suggested_value}
                  </div>
                </div>
              )}

              {/* Code Snippet */}
              {task.fix_data.code_snippet && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Gotowy kod:
                  </label>
                  <pre className="p-3 rounded-md bg-slate-950 text-green-400 text-sm overflow-x-auto">
                    <code>{task.fix_data.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Other fix_data fields */}
              {Object.entries(task.fix_data).map(([key, value]) => {
                if (['current_value', 'suggested_value', 'code_snippet'].includes(key)) return null
                if (!value) return null

                return (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}:
                    </label>
                    <div className="p-3 rounded-md bg-muted text-sm">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  </div>
                )
              })}

              {/* Notes */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">
                  Notatki:
                </label>
                <Textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Dodaj notatki, uwagi lub postęp..."
                  className="min-h-[80px]"
                />
                {hasNotesChanged && (
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingNotes ? 'Zapisywanie...' : 'Zapisz notatki'}
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      )}
    </Card>
  )
}
