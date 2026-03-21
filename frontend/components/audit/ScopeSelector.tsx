'use client'

/**
 * ScopeSelector — shows detected page types and lets user generate scoped sub-reports.
 * Displayed on the audit overview or strategy page.
 */

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scopedReportsAPI, type ScopedReport } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, CheckCircle, XCircle, Clock, ArrowRight, Coins } from 'lucide-react'
import { getPageTypeInfo, type PageType } from '@/components/audit/PageTypeFilter'
import { toast } from 'sonner'
import Link from 'next/link'

interface ScopeSelectorProps {
  auditId: string
  pageTypeStats: Record<string, number> | undefined | null
  className?: string
}

const CREDIT_COST = 3

export function ScopeSelector({ auditId, pageTypeStats, className }: ScopeSelectorProps) {
  const queryClient = useQueryClient()

  const { data: scopedReports, isLoading } = useQuery<ScopedReport[]>({
    queryKey: ['scoped-reports', auditId],
    queryFn: () => scopedReportsAPI.list(auditId),
    staleTime: 10_000,
  })

  const generateMutation = useMutation({
    mutationFn: (scopeType: string) =>
      scopedReportsAPI.create(auditId, { scope_type: scopeType }),
    onSuccess: (report) => {
      toast.success(`Generowanie analizy: ${report.scope_label}`)
      queryClient.invalidateQueries({ queryKey: ['scoped-reports', auditId] })
    },
    onError: (err) => {
      const msg = (err as Error).message
      if (msg.includes('402') || msg.includes('kredyt')) {
        toast.error('Niewystarczajace kredyty. Potrzeba 3 kr.')
      } else {
        toast.error('Blad: ' + msg)
      }
    },
  })

  const existingByType = useMemo(() => {
    const map: Record<string, ScopedReport> = {}
    for (const r of scopedReports || []) {
      map[r.scope_type] = r
    }
    return map
  }, [scopedReports])

  const availableTypes = useMemo(() => {
    if (!pageTypeStats) return []
    return Object.entries(pageTypeStats)
      .filter(([type, count]) => count > 3 && type !== 'homepage')
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type: type as PageType, count }))
  }, [pageTypeStats])

  if (!pageTypeStats || availableTypes.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-teal-600" />
          Analizy per typ stron
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Generuj dodatkowe raporty AI skupione na konkretnym typie podstron.
          Kazda analiza kosztuje {CREDIT_COST} kr.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {availableTypes.map(({ type, count }) => {
          const info = getPageTypeInfo(type)
          const Icon = info.icon
          const existing = existingByType[type]

          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <div className={`rounded-md p-1.5 ${info.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{info.label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} stron</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {existing ? (
                  <>
                    {existing.status === 'completed' && (
                      <Link href={`/audits/${auditId}/scope/${existing.id}`}>
                        <Button variant="outline" size="sm" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          Zobacz raport
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    {existing.status === 'processing' && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generowanie...
                      </Badge>
                    )}
                    {existing.status === 'pending' && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        W kolejce
                      </Badge>
                    )}
                    {existing.status === 'failed' && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <XCircle className="h-3 w-3" />
                        Blad
                      </Badge>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => generateMutation.mutate(type)}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending && generateMutation.variables === type ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Coins className="h-3 w-3 text-amber-600" />
                    )}
                    Generuj ({CREDIT_COST} kr)
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
