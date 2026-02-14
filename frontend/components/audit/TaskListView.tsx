'use client'

import { useState, useMemo } from 'react'
import { TaskCard } from './TaskCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, CheckCheck } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  module: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  is_quick_win: boolean
  status: 'pending' | 'done'
  notes?: string
  fix_data?: any
}

interface TaskListViewProps {
  tasks: Task[]
  module?: string  // If provided, filters to this module only
  onStatusChange: (taskId: string, status: 'pending' | 'done') => void
  onNotesChange: (taskId: string, notes: string) => void
  showModuleFilter?: boolean
}

export function TaskListView({
  tasks,
  module,
  onStatusChange,
  onNotesChange,
  showModuleFilter = false
}: TaskListViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [quickWinFilter, setQuickWinFilter] = useState(false)

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    // Module filter (if provided as prop)
    if (module) {
      filtered = filtered.filter(t => t.module === module)
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      )
    }

    // Priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    // Status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    // Quick wins
    if (quickWinFilter) {
      filtered = filtered.filter(t => t.is_quick_win)
    }

    return filtered
  }, [tasks, module, searchTerm, priorityFilter, statusFilter, quickWinFilter])

  // Stats
  const stats = useMemo(() => {
    const total = filteredTasks.length
    const pending = filteredTasks.filter(t => t.status === 'pending').length
    const done = filteredTasks.filter(t => t.status === 'done').length
    const quickWins = filteredTasks.filter(t => t.is_quick_win).length

    return { total, pending, done, quickWins }
  }, [filteredTasks])

  // Group by priority
  const tasksByPriority = useMemo(() => {
    const critical = filteredTasks.filter(t => t.priority === 'critical')
    const high = filteredTasks.filter(t => t.priority === 'high')
    const medium = filteredTasks.filter(t => t.priority === 'medium')
    const low = filteredTasks.filter(t => t.priority === 'low')

    return { critical, high, medium, low }
  }, [filteredTasks])

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CheckCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Brak zadań</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Plan wykonania nie został jeszcze wygenerowany. Wygeneruj plan, aby zobaczyć konkretne zadania do wdrożenia.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          Wszystkich: {stats.total}
        </Badge>
        <Badge variant="outline" className="text-sm text-orange-600 dark:text-orange-400">
          Do zrobienia: {stats.pending}
        </Badge>
        <Badge variant="outline" className="text-sm text-green-600 dark:text-green-400">
          Zrobione: {stats.done}
        </Badge>
        {stats.quickWins > 0 && (
          <Badge variant="outline" className="text-sm border-orange-500 text-orange-600 dark:text-orange-400">
            Quick Wins: {stats.quickWins}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj zadań..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Priorytet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie priorytety</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="pending">Do zrobienia</SelectItem>
            <SelectItem value="done">Zrobione</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick Win Filter */}
        <Button
          variant={quickWinFilter ? 'default' : 'outline'}
          size="default"
          onClick={() => setQuickWinFilter(!quickWinFilter)}
          className="w-full sm:w-auto"
        >
          Quick Wins
        </Button>
      </div>

      {/* Task List - Grouped by Priority */}
      <div className="space-y-8">
        {tasksByPriority.critical.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
              Critical ({tasksByPriority.critical.length})
            </h3>
            <div className="space-y-3">
              {tasksByPriority.critical.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              ))}
            </div>
          </div>
        )}

        {tasksByPriority.high.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              High ({tasksByPriority.high.length})
            </h3>
            <div className="space-y-3">
              {tasksByPriority.high.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              ))}
            </div>
          </div>
        )}

        {tasksByPriority.medium.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
              Medium ({tasksByPriority.medium.length})
            </h3>
            <div className="space-y-3">
              {tasksByPriority.medium.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              ))}
            </div>
          </div>
        )}

        {tasksByPriority.low.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Low ({tasksByPriority.low.length})
            </h3>
            <div className="space-y-3">
              {tasksByPriority.low.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nie znaleziono zadań spełniających kryteria filtrowania.
        </div>
      )}
    </div>
  )
}
