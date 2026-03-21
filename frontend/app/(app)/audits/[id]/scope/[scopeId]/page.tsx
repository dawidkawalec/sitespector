'use client'

/**
 * Scoped Report Detail Page
 *
 * Displays a scoped sub-report (AI analysis focused on a specific page type).
 * Reuses AnalysisView for each AI context area + shows scoped executive summary.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { scopedReportsAPI, auditsAPI, type ScopedReport } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2, ArrowLeft, Sparkles, CheckCircle, AlertCircle,
  Zap, Search, FileText, Link as LinkIcon, ImageIcon, Network,
} from 'lucide-react'
import { getPageTypeInfo } from '@/components/audit/PageTypeFilter'
import { AnalysisView } from '@/components/audit/AnalysisView'
import Link from 'next/link'

const AREA_CONFIG: Record<string, { label: string; icon: any }> = {
  seo: { label: 'SEO', icon: Search },
  content_quality: { label: 'Content Quality', icon: FileText },
  links: { label: 'Linki', icon: LinkIcon },
  images: { label: 'Obrazy', icon: ImageIcon },
  architecture: { label: 'Architektura', icon: Network },
}

export default function ScopedReportPage({
  params,
}: {
  params: { id: string; scopeId: string }
}) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuth(true)
    }
    checkAuth()
  }, [router])

  const { data: report, isLoading } = useQuery<ScopedReport>({
    queryKey: ['scoped-report', params.scopeId],
    queryFn: () => scopedReportsAPI.get(params.scopeId),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as ScopedReport | undefined
      if (data?.status === 'processing' || data?.status === 'pending') return 3000
      return false
    },
  })

  if (!isAuth || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-muted-foreground">Nie znaleziono raportu.</p>
      </div>
    )
  }

  const scopeInfo = getPageTypeInfo(report.scope_type)
  const ScopeIcon = scopeInfo.icon
  const results = report.results || {}
  const aiContexts = results.ai_contexts || {}
  const executiveSummary = results.executive_summary || {}
  const quickWins = results.quick_wins || []
  const scopeStats = results.scope_stats || {}

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 @md:px-6 @md:py-8 min-w-0 space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/audits/${params.id}`}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Powrot do audytu
        </Link>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2.5 ${scopeInfo.color}`}>
            <ScopeIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
              {report.scope_label}
            </h1>
            <p className="text-sm text-muted-foreground">
              Analiza skupiona na {scopeStats.total_pages || 0} stronach typu{' '}
              <span className="font-medium">{report.scope_type}</span>
            </p>
          </div>
          <Badge
            variant={
              report.status === 'completed'
                ? 'outline'
                : report.status === 'failed'
                  ? 'destructive'
                  : 'secondary'
            }
            className="ml-auto"
          >
            {report.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {report.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {report.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Processing state */}
      {(report.status === 'processing' || report.status === 'pending') && (
        <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20">
          <CardContent className="p-6 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-sm text-muted-foreground">
              AI analizuje {scopeStats.total_pages || '...'} stron typu {report.scope_label}...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {report.status === 'failed' && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-700">{report.error_message || 'Analiza nie powiodla sie.'}</p>
          </CardContent>
        </Card>
      )}

      {/* Completed: Results */}
      {report.status === 'completed' && (
        <>
          {/* Scope Stats */}
          <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Stron</p>
                <p className="text-2xl font-bold">{scopeStats.total_pages || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Problemy</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(scopeStats.broken_links || 0) +
                    (scopeStats.missing_title || 0) +
                    (scopeStats.missing_meta || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Brak title</p>
                <p className="text-2xl font-bold text-red-600">{scopeStats.missing_title || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Brak meta</p>
                <p className="text-2xl font-bold text-red-600">{scopeStats.missing_meta || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          {executiveSummary.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  Podsumowanie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {executiveSummary.summary}
                </p>
                {executiveSummary.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Mocne strony:</p>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
                      {executiveSummary.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {executiveSummary.critical_issues?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">Krytyczne problemy:</p>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
                      {executiveSummary.critical_issues.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {executiveSummary.top_recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">Top rekomendacje:</p>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
                      {executiveSummary.top_recommendations.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  Quick Wins ({quickWins.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickWins.slice(0, 10).map((qw: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border border-stone-200/80 p-2.5 dark:border-white/10"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {qw.title || qw}
                      </p>
                      {qw.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{qw.description}</p>
                      )}
                    </div>
                    {qw.impact && (
                      <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                        {qw.impact}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Context Areas */}
          {Object.entries(aiContexts).map(([area, ctx]) => {
            const config = AREA_CONFIG[area]
            if (!config || !ctx || (ctx as any).error) return null
            const AreaIcon = config.icon

            return (
              <Card key={area}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AreaIcon className="h-4 w-4 text-teal-600" />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalysisView aiContext={ctx as any} area={area} />
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
