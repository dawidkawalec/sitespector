'use client'

/**
 * PersonaDashboard — Simplified dashboard view for persona-based audits.
 * Shows KPI cards + action cards + persona context.
 */

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionCardsAPI, type ActionCardData, type PersonaConfig, type Audit } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2, Sparkles, CheckCircle, XCircle, Zap, AlertTriangle,
  Activity, Gauge, Search, TrendingUp, Users, FileText, Timer,
  Move, Shield, ShoppingBag, Code2, ListTodo,
} from 'lucide-react'
import { cn, formatScore, getScoreColor } from '@/lib/utils'
import { toast } from 'sonner'

const ICON_MAP: Record<string, any> = {
  Activity, Gauge, Search, TrendingUp, Users, FileText, Timer,
  Move, Shield, ShoppingBag, Code2, ListTodo, Zap, AlertTriangle, Sparkles,
}

interface PersonaDashboardProps {
  audit: Audit
  persona: PersonaConfig
}

function resolveKpiValue(audit: Audit, source: string): number | string | null {
  const parts = source.split('.')
  let value: any = audit

  if (parts[0] === 'audit') {
    value = audit[parts[1] as keyof Audit] ?? null
  } else if (parts[0] === 'lighthouse') {
    value = audit.results?.lighthouse
    for (const p of parts.slice(1)) value = value?.[p]
  } else if (parts[0] === 'senuto') {
    const vis = audit.results?.senuto?.visibility?.statistics?.statistics || {}
    value = vis[parts[1]] ?? 0
  } else if (parts[0] === 'page_types') {
    value = audit.results?.crawl?.page_type_stats?.[parts[1]] ?? 0
  } else if (parts[0] === 'traffic_estimation') {
    value = audit.results?.traffic_estimation?.total ?? 0
  } else if (parts[0] === 'tasks') {
    // Will be filled with actual task counts
    value = null
  }

  return value ?? null
}

function formatKpiValue(value: any, format: string): string {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (isNaN(num)) return String(value)

  switch (format) {
    case 'score': return Math.round(num).toString()
    case 'count': return num.toLocaleString('pl-PL')
    case 'ms': return num > 1000 ? `${(num / 1000).toFixed(1)}s` : `${Math.round(num)}ms`
    case 'decimal': return num.toFixed(3)
    case 'boolean': return num ? 'Tak' : 'Nie'
    default: return Math.round(num).toString()
  }
}

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  low: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  suggested: { label: 'Sugerowana', icon: Sparkles, color: 'text-teal-600' },
  accepted: { label: 'Zaakceptowana', icon: CheckCircle, color: 'text-emerald-600' },
  dismissed: { label: 'Odrzucona', icon: XCircle, color: 'text-stone-400' },
  completed: { label: 'Zrobione', icon: CheckCircle, color: 'text-emerald-600' },
}

export function PersonaDashboard({ audit, persona }: PersonaDashboardProps) {
  const queryClient = useQueryClient()
  const kpiCards = persona.dashboard_config?.kpi_cards || []

  const { data: actionCards, isLoading: cardsLoading } = useQuery<ActionCardData[]>({
    queryKey: ['action-cards', audit.id],
    queryFn: () => actionCardsAPI.list(audit.id),
    staleTime: 10_000,
  })

  const updateCard = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: { status?: string } }) =>
      actionCardsAPI.update(audit.id, cardId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['action-cards', audit.id] }),
  })

  const generateCards = useMutation({
    mutationFn: () => actionCardsAPI.generate(audit.id),
    onSuccess: () => {
      toast.success('Action cards wygenerowane')
      queryClient.invalidateQueries({ queryKey: ['action-cards', audit.id] })
    },
    onError: () => toast.error('Nie udalo sie wygenerowac kart'),
  })

  const activeCards = useMemo(
    () => (actionCards || []).filter((c) => c.status !== 'dismissed'),
    [actionCards]
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiCards.length > 0 && (
        <div className={cn('grid gap-4', kpiCards.length <= 3 ? 'grid-cols-3' : 'grid-cols-4')}>
          {kpiCards.map((kpi) => {
            const Icon = ICON_MAP[kpi.icon || 'Activity'] || Activity
            const value = resolveKpiValue(audit, kpi.source)
            const formatted = formatKpiValue(value, kpi.format)
            const scoreColor = kpi.format === 'score' ? getScoreColor(Number(value)) : ''

            return (
              <Card key={kpi.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</p>
                  </div>
                  <p className={cn('text-2xl font-bold', scoreColor || 'text-stone-900 dark:text-white')}>
                    {formatted}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            Rekomendowane akcje
          </h3>
          {(!actionCards || actionCards.length === 0) && audit.ai_status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateCards.mutate()}
              disabled={generateCards.isPending}
              className="text-xs gap-1.5"
            >
              {generateCards.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Generuj akcje
            </Button>
          )}
        </div>

        {cardsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeCards.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {audit.ai_status === 'completed'
                  ? 'Brak action cards. Kliknij "Generuj akcje" lub zapytaj w chacie.'
                  : 'Action cards pojawia sie po zakonczeniu analizy AI.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activeCards.map((card) => {
              const statusConfig = STATUS_CONFIG[card.status] || STATUS_CONFIG.suggested
              const StatusIcon = statusConfig.icon
              return (
                <Card key={card.id} className="relative overflow-hidden">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white">{card.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
                      </div>
                      <StatusIcon className={cn('h-4 w-4 shrink-0', statusConfig.color)} />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {card.priority && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.medium)}>
                          {card.priority}
                        </span>
                      )}
                      {card.category && (
                        <Badge variant="secondary" className="text-[10px]">{card.category}</Badge>
                      )}
                      {card.kpi_impact?.metric && (
                        <Badge variant="outline" className="text-[10px]">
                          {card.kpi_impact.metric}: {card.kpi_impact.improvement}
                        </Badge>
                      )}
                    </div>

                    {card.status === 'suggested' && (
                      <div className="flex gap-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-6 px-2"
                          onClick={() => updateCard.mutate({ cardId: card.id, data: { status: 'accepted' } })}
                        >
                          Akceptuj
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 px-2 text-muted-foreground"
                          onClick={() => updateCard.mutate({ cardId: card.id, data: { status: 'dismissed' } })}
                        >
                          Odrzuc
                        </Button>
                      </div>
                    )}
                    {card.status === 'accepted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-emerald-600"
                        onClick={() => updateCard.mutate({ cardId: card.id, data: { status: 'completed' } })}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Oznacz jako zrobione
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
