'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type AuditMode = 'data' | 'analysis' | 'plan'

interface ModeSwitcherProps {
  mode: AuditMode
  onModeChange: (mode: AuditMode) => void
  taskCount?: number
  pendingTaskCount?: number
  hasAiData?: boolean
  hasExecutionPlan?: boolean
  isAiLoading?: boolean
  isExecutionPlanLoading?: boolean
}

const modeConfig = {
  data: {
    label: 'Dane',
    color: 'blue',
    gradient: 'from-blue-500/10 to-blue-600/10',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  analysis: {
    label: 'Analiza',
    color: 'violet',
    gradient: 'from-violet-500/10 to-violet-600/10',
    borderColor: 'border-violet-500',
    bgColor: 'bg-violet-500/10 hover:bg-violet-500/20',
    textColor: 'text-violet-700 dark:text-violet-300'
  },
  plan: {
    label: 'Plan',
    color: 'emerald',
    gradient: 'from-emerald-500/10 to-emerald-600/10',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-300'
  }
}

export function ModeSwitcher({
  mode,
  onModeChange,
  taskCount = 0,
  pendingTaskCount = 0,
  hasAiData = true,
  hasExecutionPlan = true,
  isAiLoading = false,
  isExecutionPlanLoading = false
}: ModeSwitcherProps) {
  const config = modeConfig[mode]

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
        {/* Data Mode */}
        <button
          onClick={() => onModeChange('data')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            mode === 'data'
              ? `${modeConfig.data.bgColor} ${modeConfig.data.textColor}`
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {modeConfig.data.label}
        </button>

        {/* Analysis Mode */}
        <button
          onClick={() => onModeChange('analysis')}
          disabled={!hasAiData && !isAiLoading}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all relative',
            mode === 'analysis'
              ? `${modeConfig.analysis.bgColor} ${modeConfig.analysis.textColor}`
              : 'text-muted-foreground hover:text-foreground',
            (!hasAiData && !isAiLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {modeConfig.analysis.label}
          {isAiLoading && (
            <span className="ml-2 inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Plan Mode */}
        <button
          onClick={() => onModeChange('plan')}
          disabled={!hasExecutionPlan && !isExecutionPlanLoading}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all relative flex items-center gap-2',
            mode === 'plan'
              ? `${modeConfig.plan.bgColor} ${modeConfig.plan.textColor}`
              : 'text-muted-foreground hover:text-foreground',
            (!hasExecutionPlan && !isExecutionPlanLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {modeConfig.plan.label}
          {isExecutionPlanLoading && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {hasExecutionPlan && taskCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {pendingTaskCount > 0 ? `${pendingTaskCount}/${taskCount}` : taskCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Active Mode Indicator - Gradient Border */}
      <div className={cn(
        'h-1 rounded-full bg-gradient-to-r transition-all',
        config.gradient
      )} />
    </div>
  )
}

/**
 * Hook to manage mode state via URL search params
 * 
 * Usage:
 * const [mode, setMode] = useAuditMode('data')
 */
export function useAuditMode(defaultMode: AuditMode = 'data'): [AuditMode, (mode: AuditMode) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMode = (searchParams.get('mode') as AuditMode) || defaultMode

  const setMode = (newMode: AuditMode) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', newMode)
    router.push(`${pathname}?${params.toString()}`)
  }

  return [currentMode, setMode]
}
