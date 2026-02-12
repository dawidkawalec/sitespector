'use client'

/**
 * AI Strategy Page
 * 
 * Comprehensive AI strategy view with:
 * - Executive Summary
 * - Priority Roadmap (4 columns)
 * - Cross-Tool Insights
 * - All per-area AI insights (tabs)
 * - Quick Wins
 * - ROI Action Plan
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2, Sparkles, Target, TrendingUp, AlertTriangle,
  CheckCircle2, Zap, ArrowRight, RefreshCw, BarChart3,
  BrainCircuit, Lightbulb, Shield, Link2, Image as ImageIcon,
  Search as SearchIcon, Gauge, Clock, Calendar, Rocket
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'

const HEALTH_COLORS: Record<string, string> = {
  good: 'text-green-600',
  moderate: 'text-yellow-600',
  poor: 'text-orange-600',
  critical: 'text-red-600',
}

const HEALTH_BG: Record<string, string> = {
  good: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30',
  moderate: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/30',
  poor: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30',
  critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30',
}

const IMPACT_ICONS: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="h-3 w-3 text-red-500" />,
  medium: <TrendingUp className="h-3 w-3 text-yellow-500" />,
  low: <CheckCircle2 className="h-3 w-3 text-green-500" />,
}

const AREA_META: Record<string, { label: string; icon: React.ReactNode }> = {
  seo: { label: 'SEO', icon: <SearchIcon className="h-4 w-4" /> },
  performance: { label: 'Wydajność', icon: <Gauge className="h-4 w-4" /> },
  visibility: { label: 'Widoczność', icon: <TrendingUp className="h-4 w-4" /> },
  ai_overviews: { label: 'AI Overviews', icon: <Sparkles className="h-4 w-4" /> },
  backlinks: { label: 'Backlinki', icon: <Link2 className="h-4 w-4" /> },
  links: { label: 'Linki', icon: <Link2 className="h-4 w-4" /> },
  images: { label: 'Obrazy', icon: <ImageIcon className="h-4 w-4" /> },
}

function RoadmapColumn({ title, icon, items, color }: { title: string; icon: React.ReactNode; items: any[]; color: string }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className={`text-sm font-bold ${color}`}>{title}</h3>
        <Badge variant="secondary" className="text-[9px] h-4">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
            <p className="text-xs font-semibold">{item.title}</p>
            {item.description && (
              <p className="text-[10px] text-muted-foreground mt-1">{item.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              {item.impact && (
                <Badge variant="outline" className="text-[8px] h-4 gap-0.5">
                  {IMPACT_ICONS[item.impact] || IMPACT_ICONS.medium}
                  {item.impact}
                </Badge>
              )}
              {item.area && (
                <Badge variant="secondary" className="text-[8px] h-4">{item.area}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AreaInsights({ area, data }: { area: string; data: any }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-muted-foreground py-4">Brak danych AI dla tego obszaru.</p>
  }

  return (
    <div className="space-y-4">
      {data.key_findings && data.key_findings.length > 0 && (
        <div>
          <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2">
            <Target className="h-3.5 w-3.5 text-accent" /> Kluczowe wnioski
          </h4>
          <ul className="space-y-1">
            {data.key_findings.map((f: string, i: number) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.priority_issues && data.priority_issues.length > 0 && (
        <div>
          <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Problemy priorytetowe
          </h4>
          <ul className="space-y-1">
            {data.priority_issues.map((p: string, i: number) => (
              <li key={i} className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" /> Rekomendacje
          </h4>
          <ul className="space-y-1">
            {data.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.quick_wins && data.quick_wins.length > 0 && (
        <div>
          <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2">
            <Zap className="h-3.5 w-3.5 text-green-500" /> Quick Wins
          </h4>
          <div className="space-y-2">
            {data.quick_wins.map((w: any, i: number) => (
              <div key={i} className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-400">{w.title}</p>
                {w.description && <p className="text-[10px] text-muted-foreground mt-0.5">{w.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AiStrategyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAuth, setIsAuth] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      const isAuditRunning = data?.status === 'pending' || data?.status === 'processing'
      const isAiRunning = data?.ai_status === 'processing'
      return isAuditRunning || isAiRunning ? 3000 : false
    },
  })

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await auditsAPI.runAiContext(params.id)
      toast.success('Strategia AI przeliczona pomyślnie')
      queryClient.invalidateQueries({ queryKey: ['audit', params.id] })
    } catch (error) {
      toast.error('Nie udało się przeliczenie strategii AI')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const execSummary = audit.results?.executive_summary
  const roadmap = audit.results?.roadmap
  const crossTool = audit.results?.cross_tool
  const aiContexts = audit.results?.ai_contexts || {}
  const quickWins = audit.results?.quick_wins || []
  const contentAnalysis = audit.results?.content_analysis
  const isAiRunning = audit.ai_status === 'processing' || (audit.processing_step || '').startsWith('ai_')

  const hasAnyData = execSummary || roadmap || crossTool || Object.keys(aiContexts).length > 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold text-primary">Strategia AI</h1>
            <p className="text-sm text-muted-foreground">Kompleksowa analiza i rekomendacje oparte na AI</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="gap-2"
        >
          {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Przelicz strategię AI
        </Button>
      </div>

      {isAiRunning && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-accent">Analizy AI są w trakcie generowania</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aktualny etap: {audit.processing_step || 'ai:processing'}. Dane będą odświeżane automatycznie.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasAnyData && (
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Brak danych strategii AI</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Strategia AI nie została jeszcze wygenerowana. Uruchom analizę, aby otrzymać wnioski i rekomendacje.
            </p>
            <Button onClick={handleRegenerate} disabled={isRegenerating} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {isRegenerating ? 'Generowanie...' : 'Wygeneruj strategię AI'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Executive Summary */}
      {execSummary && (
        <Card className={`border ${HEALTH_BG[execSummary.overall_health] || HEALTH_BG.moderate}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-4xl font-black ${HEALTH_COLORS[execSummary.overall_health] || 'text-yellow-600'}`}>
                  {execSummary.health_score || '—'}
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Health Score</p>
              </div>
              <div className="flex-1">
                <Badge className={`mb-2 ${HEALTH_COLORS[execSummary.overall_health]}`} variant="outline">
                  {execSummary.overall_health?.toUpperCase()}
                </Badge>
                {execSummary.summary && (
                  <p className="text-sm leading-relaxed">{execSummary.summary}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {execSummary.strengths && execSummary.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20">
                  <h4 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mocne strony
                  </h4>
                  <ul className="space-y-1">
                    {execSummary.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-[11px] text-green-800 dark:text-green-300">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {execSummary.critical_issues && execSummary.critical_issues.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20">
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Krytyczne problemy
                  </h4>
                  <ul className="space-y-1">
                    {execSummary.critical_issues.map((c: string, i: number) => (
                      <li key={i} className="text-[11px] text-red-800 dark:text-red-300">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {execSummary.growth_potential && (
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <h4 className="text-xs font-bold text-accent mb-1 flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5" /> Potencjał wzrostu
                </h4>
                <p className="text-[11px] text-muted-foreground">{execSummary.growth_potential}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 2: Priority Roadmap */}
      {roadmap && (roadmap.immediate_actions?.length > 0 || roadmap.short_term?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Roadmapa priorytetów
            </CardTitle>
            <CardDescription>Plan wdrożenia uporządkowany według priorytetu i horyzontu czasowego</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <RoadmapColumn
                title="Natychmiast"
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                items={roadmap.immediate_actions || []}
                color="text-red-600"
              />
              <RoadmapColumn
                title="Krótkoterminowe"
                icon={<Clock className="h-4 w-4 text-yellow-500" />}
                items={roadmap.short_term || []}
                color="text-yellow-600"
              />
              <RoadmapColumn
                title="Średnioterminowe"
                icon={<Calendar className="h-4 w-4 text-blue-500" />}
                items={roadmap.medium_term || []}
                color="text-blue-600"
              />
              <RoadmapColumn
                title="Długoterminowe"
                icon={<Rocket className="h-4 w-4 text-green-500" />}
                items={roadmap.long_term || []}
                color="text-green-600"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Cross-Tool Insights */}
      {crossTool && (crossTool.correlations?.length > 0 || crossTool.unified_recommendations?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cross-Tool Insights
            </CardTitle>
            <CardDescription>Korelacje i wnioski z połączenia danych ze wszystkich narzędzi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {crossTool.correlations && crossTool.correlations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold mb-2">Korelacje</h4>
                <ul className="space-y-1.5">
                  {crossTool.correlations.map((c: string, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crossTool.synergies && crossTool.synergies.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20">
                  <h4 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">Synergię</h4>
                  <ul className="space-y-1">
                    {crossTool.synergies.map((s: string, i: number) => (
                      <li key={i} className="text-[11px]">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {crossTool.conflicts && crossTool.conflicts.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20">
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">Konflikty</h4>
                  <ul className="space-y-1">
                    {crossTool.conflicts.map((c: string, i: number) => (
                      <li key={i} className="text-[11px]">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {crossTool.unified_recommendations && crossTool.unified_recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold mb-2">Ujednolicone rekomendacje</h4>
                <ul className="space-y-1.5">
                  {crossTool.unified_recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                      <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 4: All per-area insights */}
      {Object.keys(aiContexts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Wnioski AI per obszar
            </CardTitle>
            <CardDescription>Szczegółowe wnioski AI dla każdego obszaru audytu</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(aiContexts)[0]} className="w-full">
              <TabsList className="flex-wrap h-auto">
                {Object.keys(aiContexts).map(area => {
                  const meta = AREA_META[area]
                  return (
                    <TabsTrigger key={area} value={area} className="gap-1.5 text-xs">
                      {meta?.icon}
                      {meta?.label || area}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {Object.entries(aiContexts).map(([area, data]) => (
                <TabsContent key={area} value={area} className="mt-4">
                  <AreaInsights area={area} data={data} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Quick Wins */}
      {quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Quick Wins
            </CardTitle>
            <CardDescription>Szybkie wygrane z największym wpływem przy najmniejszym nakładzie pracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickWins.map((win: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{win.title}</h4>
                    <div className="flex gap-1 shrink-0">
                      {win.impact && (
                        <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                          {IMPACT_ICONS[win.impact] || IMPACT_ICONS.medium}
                          {win.impact}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {win.description && (
                    <p className="text-xs text-muted-foreground mt-1.5">{win.description}</p>
                  )}
                  {win.effort && (
                    <Badge variant="secondary" className="text-[9px] mt-2">
                      Nakład: {win.effort}
                    </Badge>
                  )}
                  {win.category && (
                    <Badge variant="outline" className="text-[9px] mt-2 ml-2">
                      {win.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: ROI Action Plan */}
      {contentAnalysis?.roi_action_plan && contentAnalysis.roi_action_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ROI Action Plan
            </CardTitle>
            <CardDescription>Plan działań z szacowanym zwrotem z inwestycji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-xs font-bold">Akcja</th>
                    <th className="text-center p-3 text-xs font-bold w-24">Impact</th>
                    <th className="text-center p-3 text-xs font-bold w-24">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {contentAnalysis.roi_action_plan.map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-xs">{item.action}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[9px] gap-0.5">
                          {IMPACT_ICONS[item.impact] || IMPACT_ICONS.medium}
                          {item.impact}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className="text-[9px]">{item.effort}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
