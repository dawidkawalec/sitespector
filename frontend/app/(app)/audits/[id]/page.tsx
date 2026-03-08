'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditsAPI, CreateAuditData } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatNumber, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { 
  ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, 
  FileJson, CheckCircle, Search, Gauge, Sparkles, ImageIcon, 
  Link as LinkIcon, Users, Clock, ShieldCheck, Zap, ChevronDown, ChevronRight, ExternalLink,
  Terminal, Activity, Check, CheckCheck, Timer, Globe2, TrendingUp, TrendingDown, Bot, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { PageStatusChart } from '@/components/AuditCharts'
import type { Audit } from '@/lib/api'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { toast } from 'sonner'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

type SeverityLevel = 'error' | 'warning' | 'notice'

interface SeverityIssue {
  key: string
  label: string
  severity: SeverityLevel
  count: number
  href: string
  description: string
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function severityWeight(level: SeverityLevel): number {
  if (level === 'error') return 3
  if (level === 'warning') return 1.2
  return 0.6
}

function buildSeverityIssues(crawl: any, lh: any): SeverityIssue[] {
  const pagesByStatus = crawl?.pages_by_status || {}
  const status404 = Number(pagesByStatus?.['404'] || 0)
  const status500 = Number(pagesByStatus?.['500'] || 0)
  const statusOther = Number(pagesByStatus?.other || 0)
  const brokenLinks = Number(crawl?.links?.broken || 0)
  const missingCanonical = Number(crawl?.technical_seo?.missing_canonical || 0)
  const noindexPages = Number(crawl?.technical_seo?.noindex_pages || 0)
  const missingAlt = Number(crawl?.images?.without_alt || 0)
  const redirects = Number(crawl?.technical_seo?.redirects || crawl?.links?.redirects || 0)
  const nofollowPages = Number(crawl?.technical_seo?.nofollow_pages || 0)
  const hreflangIssues = Number(crawl?.technical_seo?.hreflang_pages || 0)
  const lhDiagnostics = Number(lh?.audits?.diagnostics?.length || 0)
  const lhOpportunities = Number(lh?.audits?.opportunities?.length || 0)
  const missingSitemap = crawl?.has_sitemap ? 0 : 1

  const issues: SeverityIssue[] = [
    {
      key: 'broken_links',
      label: 'Niedzialajace linki (404)',
      severity: 'error',
      count: brokenLinks,
      href: 'links?filter=broken',
      description: 'Linki prowadza do nieistniejacych zasobow i pogarszaja crawlability.',
    },
    {
      key: 'http_errors',
      label: 'Strony 4xx/5xx',
      severity: 'error',
      count: status404 + status500 + statusOther,
      href: 'seo',
      description: 'Bledy odpowiedzi HTTP obcinaja indeksacje i sygnal jakosci.',
    },
    {
      key: 'missing_canonical',
      label: 'Brakujace canonicale',
      severity: 'error',
      count: missingCanonical,
      href: 'seo',
      description: 'Brak canonical utrudnia konsolidacje sygnalow rankingowych.',
    },
    {
      key: 'noindex',
      label: 'Strony z noindex',
      severity: 'error',
      count: noindexPages,
      href: 'seo',
      description: 'Noindex moze blokowac indeksacje istotnych URL-i.',
    },
    {
      key: 'lh_diagnostics',
      label: 'Lighthouse diagnostics',
      severity: 'error',
      count: lhDiagnostics,
      href: 'performance',
      description: 'Krytyczne sygnaly z Lighthouse wymagajace szybkiej reakcji.',
    },
    {
      key: 'missing_alt',
      label: 'Obrazy bez ALT',
      severity: 'warning',
      count: missingAlt,
      href: 'images?filter=no-alt',
      description: 'Brak ALT oslabia SEO i dostepnosc.',
    },
    {
      key: 'redirects',
      label: 'Przekierowania',
      severity: 'warning',
      count: redirects,
      href: 'links',
      description: 'Nadmierne przekierowania spowalniaja crawl i UX.',
    },
    {
      key: 'nofollow_pages',
      label: 'Strony z nofollow',
      severity: 'warning',
      count: nofollowPages,
      href: 'seo',
      description: 'Nofollow moze blokowac przeplyw link equity.',
    },
    {
      key: 'lh_opportunities',
      label: 'Lighthouse opportunities',
      severity: 'warning',
      count: lhOpportunities,
      href: 'performance',
      description: 'Szanse optymalizacyjne z realnym wplywem na wydajnosc.',
    },
    {
      key: 'hreflang_issues',
      label: 'Problemy hreflang',
      severity: 'notice',
      count: hreflangIssues,
      href: 'seo',
      description: 'Niespojne hreflang moga zaburzac targeting jezykowy.',
    },
    {
      key: 'missing_sitemap',
      label: 'Brak sitemap.xml',
      severity: 'notice',
      count: missingSitemap,
      href: 'seo',
      description: 'Brak sitemap utrudnia szybsze odkrywanie URL-i.',
    },
  ]

  return issues
    .filter((issue) => issue.count > 0)
    .sort((a, b) => {
      const levelOrder: Record<SeverityLevel, number> = { error: 0, warning: 1, notice: 2 }
      if (levelOrder[a.severity] !== levelOrder[b.severity]) {
        return levelOrder[a.severity] - levelOrder[b.severity]
      }
      return b.count - a.count
    })
}

export default function AuditDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace } = useWorkspace()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Check authentication (client-side only)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Fetch audit details
  const {
    data: audit,
    isLoading,
  } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      const isAuditRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      // Poll every 3 seconds while technical audit or AI pipeline is running
      if (isAuditRunning || isAiRunning || isPlanRunning) {
        return 3000
      }
      return false
    },
  })

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [audit?.processing_logs])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditsAPI.delete(id),
    onSuccess: () => {
      // Invalidate all audit-related queries to clear cache
      queryClient.invalidateQueries({ queryKey: ['audits'] })
      queryClient.invalidateQueries({ queryKey: ['audit', params.id] })
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Nie udało się usunąć audytu')
    },
  })

  // Retry/Restart mutation
  const retryMutation = useMutation({
    mutationFn: (data: CreateAuditData) => 
      auditsAPI.create(currentWorkspace?.id || '', data),
    onSuccess: (newAudit) => {
      router.push(`/audits/${newAudit.id}`)
    },
  })

  const handleDelete = () => {
    if (audit) {
        deleteMutation.mutate(audit.id)
    }
  }

  const handleRetry = () => {
    if (audit) {
        retryMutation.mutate({
            url: audit.url
        })
    }
  }

  const downloadPDF = async () => {
    try {
      const blob = await auditsAPI.downloadPDF(params.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitespector_audit_${params.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const downloadRawData = async () => {
    try {
      const blob = await auditsAPI.downloadRaw(params.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_${params.id}_raw.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading raw data:', error)
    }
  }

  if (!isAuth) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Audyt nie został znaleziony</h1>
        <Link href="/dashboard">
          <Button><ArrowLeft className="mr-2 h-4 w-4" /> Powrót</Button>
        </Link>
      </div>
    )
  }

  const lh = audit.results?.lighthouse?.desktop
  const crawl = audit.results?.crawl
  const senuto = audit.results?.senuto
  const ai = audit.results?.content_analysis
  const technicalHealth = audit.results?.technical_health_index
  const visibilityMomentum = audit.results?.visibility_momentum
  const aiReadiness = crawl?.ai_readiness
  const trafficEstimation = audit.results?.traffic_estimation
  const contentQuality = audit.results?.content_quality_index
  const severityIssues = buildSeverityIssues(crawl, lh)
  const severityCounts = severityIssues.reduce(
    (acc, issue) => {
      acc[issue.severity] += issue.count
      return acc
    },
    { error: 0, warning: 0, notice: 0 }
  )
  const topCriticalIssues = severityIssues
    .filter((issue) => issue.severity !== 'notice')
    .slice(0, 5)
  const lhScores = [
    Number(lh?.performance_score || 0),
    Number(lh?.accessibility_score || 0),
    Number(lh?.best_practices_score || 0),
    Number(lh?.seo_score || 0),
  ].filter((score) => !Number.isNaN(score))
  const lhAverage = lhScores.length ? lhScores.reduce((sum, score) => sum + score, 0) / lhScores.length : 0
  const severityPenalty = severityIssues.reduce((sum, issue) => {
    return sum + issue.count * severityWeight(issue.severity)
  }, 0)
  const issueQualityScore = clampScore(100 - Math.min(85, severityPenalty))
  const fallbackHealthScore = clampScore(Math.round(lhAverage * 0.4 + issueQualityScore * 0.6))
  const healthScore = clampScore(Math.round(Number(technicalHealth?.score ?? fallbackHealthScore)))
  const healthColor = healthScore >= 80 ? '#16a34a' : healthScore >= 60 ? '#ca8a04' : '#dc2626'
  const healthLabel =
    technicalHealth?.status === 'good'
      ? 'Dobry'
      : technicalHealth?.status === 'moderate'
        ? 'Umiarkowany'
        : healthScore >= 80
          ? 'Dobry'
          : healthScore >= 60
            ? 'Umiarkowany'
            : 'Krytyczny'

  const healthBreakdown = technicalHealth?.breakdown
  const healthBreakdownItems = healthBreakdown
    ? [
        { key: 'lighthouse_pillar', label: 'Lighthouse', value: Number(healthBreakdown.lighthouse_pillar || 0) },
        { key: 'crawl_health_pillar', label: 'Crawl', value: Number(healthBreakdown.crawl_health_pillar || 0) },
        { key: 'tech_extras_pillar', label: 'Tech Extras', value: Number(healthBreakdown.tech_extras_pillar || 0) },
        { key: 'content_pillar', label: 'Content', value: Number(healthBreakdown.content_pillar || 0) },
        { key: 'security_pillar', label: 'Security', value: Number(healthBreakdown.security_pillar || 0) },
      ]
    : []

  const momentumScore = Number(visibilityMomentum?.score || 0)
  const momentumLabel =
    visibilityMomentum?.status === 'strong_growth'
      ? 'Silny wzrost'
      : visibilityMomentum?.status === 'growing'
        ? 'Wzrost'
        : visibilityMomentum?.status === 'declining'
          ? 'Spadek'
          : visibilityMomentum?.status === 'critical'
            ? 'Silny spadek'
            : 'Stabilnie'
  const momentumColor = momentumScore >= 10 ? '#16a34a' : momentumScore <= -10 ? '#dc2626' : '#ca8a04'
  const momentumGauge = clampScore(Math.round(((momentumScore + 100) / 200) * 100))
  const topMomentumWins = (visibilityMomentum?.top_wins || []).slice(0, 3)
  const topMomentumLosses = (visibilityMomentum?.top_losses || []).slice(0, 3)

  const aiReadinessScore = Number(aiReadiness?.score || 0)
  const aiReadinessLabel =
    aiReadiness?.status === 'ready'
      ? 'Ready'
      : aiReadiness?.status === 'partial'
        ? 'Partial'
        : 'Not ready'
  const aiReadinessChecks = Array.isArray(aiReadiness?.checks) ? aiReadiness.checks : []
  const aiReadinessPass = aiReadinessChecks.filter((check: any) => check?.status === 'pass').length
  const aiReadinessWarn = aiReadinessChecks.filter((check: any) => check?.status === 'warning').length
  const aiReadinessFail = aiReadinessChecks.filter((check: any) => check?.status === 'fail').length
  const trafficTotal = Number(trafficEstimation?.total_estimated_monthly || 0)
  const trafficPotentialGain = Number(trafficEstimation?.potential_gain || 0)
  const trafficBrackets = Object.entries(trafficEstimation?.by_position_bracket || {}).map(([key, value]: [string, any]) => ({
    key,
    label: value?.label || key,
    traffic: Number(value?.estimated_traffic || 0),
    keywords: Number(value?.keywords || 0),
  }))
  const trafficMax = Math.max(1, ...trafficBrackets.map((row) => row.traffic))
  const topTrafficKeywords = Array.isArray(trafficEstimation?.top_traffic_keywords)
    ? trafficEstimation.top_traffic_keywords.slice(0, 3)
    : []
  const contentQualityScore = Number(contentQuality?.site_score || 0)
  const contentQualityGrade = contentQuality?.grade || '—'
  const contentQualityDistribution = contentQuality?.distribution || {}
  const contentQualityTopIssues = Array.isArray(contentQuality?.top_issues) ? contentQuality.top_issues.slice(0, 3) : []
  const contentIssueLabel = (issue: string): string => {
    const labels: Record<string, string> = {
      thin_content: 'Thin content',
      very_long_content: 'Bardzo dluga tresc',
      low_text_ratio: 'Niski text ratio',
      missing_title: 'Brak title',
      title_length_out_of_range: 'Title poza zakresem',
      missing_meta_description: 'Brak meta description',
      meta_length_out_of_range: 'Meta poza zakresem',
      missing_h1: 'Brak H1',
      multiple_h1: 'Wiele H1',
      orphan_page: 'Orphan pages',
      deep_page: 'Duza glebokosc',
      hard_to_read: 'Niska czytelnosc',
      duplicate_title: 'Duplikaty title',
      duplicate_meta_description: 'Duplikaty meta',
      duplicate_h1: 'Duplikaty H1',
    }
    return labels[issue] || issue
  }

  // Calculate duration
  const duration = audit.started_at && audit.completed_at 
    ? Math.round((new Date(audit.completed_at).getTime() - new Date(audit.started_at).getTime()) / 1000)
    : null

  // Progress dashboard steps
  const steps = [
    { id: 'crawl', label: 'Crawling strony (Screaming Frog)', icon: Search },
    { id: 'lighthouse', label: 'Analiza Desktop & Mobile (Lighthouse)', icon: Gauge },
    { id: 'senuto', label: 'Analiza Senuto (Widoczność & Linki)', icon: Globe2 },
    { id: 'competitors', label: 'Analiza konkurencji', icon: Users },
    { id: 'ai_content', label: 'Analiza AI - Treść', icon: Sparkles },
    { id: 'ai_parallel', label: 'Analiza AI - Wydajność / UX / Security', icon: Zap },
    { id: 'ai_strategic', label: 'Analiza AI - Konkurencja / Benchmarki', icon: ShieldCheck },
    { id: 'ai_contexts', label: 'Analiza AI - Insights per obszar', icon: Sparkles },
    { id: 'ai_strategy', label: 'Analiza AI - Strategia (Roadmapa)', icon: TrendingUp },
    { id: 'execution_plan', label: 'Plan wykonania - lista zadań', icon: CheckCheck },
  ]

  const getStepStatus = (stepId: string) => {
    if (!audit.processing_logs) return 'pending'
    const stepLogs = audit.processing_logs.filter((l: any) => l.step === stepId || (stepId === 'lighthouse' && (l.step === 'lighthouse_desktop' || l.step === 'lighthouse_mobile')))
    if (stepLogs.some((l: any) => l.status === 'error')) return 'error'
    if (stepLogs.some((l: any) => l.status === 'success')) return 'success'
    if (stepLogs.some((l: any) => l.status === 'running')) return 'running'
    return 'pending'
  }

  const isTechnicalDone = audit.results?.crawl && audit.results?.lighthouse

  const progressPercent =
    typeof audit.progress_percent === 'number'
      ? audit.progress_percent
      : audit.status === 'completed'
        ? 100
        : 5

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col @md:flex-row @md:items-start justify-between gap-6">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Powrót do listy
          </Link>
          <h1 className="text-3xl font-bold break-all text-primary">
            <span className="text-line">{audit.url}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={getStatusBadgeVariant(audit.status)} className="px-3 py-1">
              {audit.status.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(audit.created_at)}
            </span>
            {duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Czas analizy: {duration}s
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {audit.status === 'completed' && (
            <>
              <Link href={`/audits/${params.id}/pdf`}>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" /> Pobierz PDF
                </Button>
              </Link>
              <Button variant="outline" onClick={downloadRawData} size="sm" title="Raw JSON">
                <FileJson className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleRetry} size="sm" title="Restart">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Usunąć audyt?</AlertDialogTitle>
                <AlertDialogDescription>Tej operacji nie można cofnąć.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600">Usuń</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* AI Failed Warning Banner */}
      {audit.ai_status === 'failed' && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Analiza AI nie powiodła się
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  Dane techniczne zostały zebrane pomyślnie, ale analiza AI nie mogła zostać ukończona. 
                  Niektóre sekcje mogą być niekompletne. Możesz ponownie uruchomić audyt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {audit.status === 'processing' || audit.status === 'pending' ? (
        <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
          {/* Progress Dashboard */}
          <Card className="@lg:col-span-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                    Analiza w toku...
                  </CardTitle>
                  <CardDescription>
                    SiteSpector sprawdza Twoją stronę pod kątem technicznym i AI.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Postęp</div>
                </div>
              </div>
              <Progress value={progressPercent} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                {steps.map((step) => {
                  const status = getStepStatus(step.id)
                  return (
                    <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      status === 'running' ? 'bg-primary/5 border-primary/30' : 
                      status === 'success' ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200/50' : 'bg-muted/30 border-transparent'
                    }`}>
                      <div className={`p-2 rounded-full ${
                        status === 'running' ? 'bg-primary text-primary-foreground animate-pulse' :
                        status === 'success' ? 'bg-green-500 text-white' :
                        status === 'error' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {status === 'success' ? <Check className="h-4 w-4" /> : 
                         status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                         status === 'error' ? <AlertCircle className="h-4 w-4" /> :
                         <step.icon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{step.label}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">
                          {status === 'running' ? 'Przetwarzanie...' : 
                           status === 'success' ? 'Ukończono' :
                           status === 'error' ? 'Błąd' : 'Oczekiwanie'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Live Logs Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase px-1">
                  <div className="flex items-center gap-1">
                    <Terminal className="h-3 w-3" /> Logi systemowe
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" /> ETA: ~3-5 min
                  </div>
                </div>
                <div className="bg-slate-950 rounded-lg p-4 font-mono text-[11px] text-slate-300 border border-slate-800 shadow-inner h-[200px] overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1" ref={scrollRef}>
                    <div className="space-y-1">
                      {audit.processing_logs?.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 border-b border-slate-900/50 pb-1 last:border-0">
                          <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`shrink-0 font-bold ${
                            log.status === 'success' ? 'text-green-400' : 
                            log.status === 'error' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {log.step.toUpperCase()}
                          </span>
                          <span className="break-words">{log.message}</span>
                          {log.duration_ms && <span className="text-slate-600 ml-auto shrink-0">{log.duration_ms}ms</span>}
                        </div>
                      ))}
                      {(audit.status === 'processing' || audit.status === 'pending') && (
                        <div className="flex gap-2 items-center text-primary animate-pulse">
                          <span>_</span>
                          <span className="h-3 w-1 bg-primary"></span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">O analizie</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-4">
                <p>
                  SiteSpector przeprowadza teraz pełny audyt Twojej witryny. Proces ten jest podzielony na dwie fazy:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                    <div><strong>Faza Techniczna:</strong> Crawling strony, analiza wydajności Lighthouse i sprawdzenie konkurencji.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                    <div><strong>Faza AI:</strong> Wykorzystanie Gemini 3.0 do głębokiej analizy treści, strategii i UX.</div>
                  </div>
                </div>
                <p className="italic">
                  Wyniki techniczne pojawią się na tej stronie natychmiast po ukończeniu pierwszej fazy, nawet jeśli analiza AI będzie jeszcze trwała.
                </p>
              </CardContent>
            </Card>
            
            {audit.status === 'pending' && (
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                  Audyt oczekuje w kolejce. Zostanie uruchomiony automatycznie, gdy tylko zwolni się miejsce w systemie.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      ) : null}

      {/* Results Display (shown if completed OR if technical results are available during AI phase) */}
      {(audit.status === 'completed' || isTechnicalDone) && (
        <>
          {audit.ai_status === 'processing' && (
            <Alert className="bg-primary/5 border-primary/20 animate-pulse mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Analiza AI jest w toku... Wyniki techniczne są już dostępne poniżej.</span>
                <Badge variant="outline" className="ml-2">{progressPercent}%</Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Scores Grid */}
          <div className="grid grid-cols-2 @lg:grid-cols-4 gap-4">
            {[
              { label: 'Wynik Ogólny', score: audit.overall_score, icon: ShieldCheck, tooltipId: 'overall_score', loading: audit.ai_status === 'processing' },
              { label: 'SEO', score: audit.seo_score, icon: Search, tooltipId: 'seo_score', loading: false },
              { label: 'Wydajność', score: audit.performance_score, icon: Gauge, tooltipId: 'performance_score', loading: false },
              { label: 'Treść', score: audit.content_score, icon: Sparkles, tooltipId: 'content_score', loading: audit.ai_status === 'processing' },
            ].map((item, i) => (
              <Card key={i} className="relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${item.loading ? 'bg-muted animate-pulse' : getScoreColor(item.score).replace('text-', 'bg-')}`} />
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <item.icon className="h-3 w-3" /> {item.label}
                    </span>
                    <InfoTooltip id={item.tooltipId as any} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.loading ? (
                    <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className={`text-4xl font-bold ${getScoreColor(item.score)}`}>
                      {formatScore(item.score)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Technical Health Index
                </CardTitle>
                <CardDescription>
                  {technicalHealth ? 'Kompozyt 5 filarow (Lighthouse, Crawl, Extras, Content, Security)' : 'Agregacja problemow SF + Lighthouse (0-100)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div
                    className="h-28 w-28 rounded-full p-2 shrink-0"
                    style={{
                      background: `conic-gradient(${healthColor} ${Math.round(healthScore * 3.6)}deg, hsl(var(--muted)) 0deg)`,
                    }}
                  >
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{healthScore}%</div>
                        <div className="text-[10px] uppercase text-muted-foreground">THI</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={healthScore >= 80 ? 'default' : healthScore >= 60 ? 'secondary' : 'destructive'}
                        className="text-[10px]"
                      >
                        {healthLabel}
                      </Badge>
                      {technicalHealth?.grade && <Badge variant="outline">Grade {technicalHealth.grade}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lighthouse avg: <strong>{Math.round(lhAverage)}%</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score jakosci problemow: <strong>{Math.round(issueQualityScore)}%</strong>
                    </p>
                  </div>
                </div>

                {healthBreakdownItems.length > 0 && (
                  <div className="space-y-2">
                    {healthBreakdownItems.map((item) => (
                      <div key={item.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                          <span>{item.label}</span>
                          <span>{Math.round(item.value)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="@lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Issue Severity Dashboard</CardTitle>
                <CardDescription>Klasyfikacja: Error / Warning / Notice + top 5 krytycznych</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/20 p-3">
                    <p className="text-[11px] uppercase font-bold text-red-700 dark:text-red-300">Errors</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatNumber(severityCounts.error)}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                    <p className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-300">Warnings</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatNumber(severityCounts.warning)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20 p-3">
                    <p className="text-[11px] uppercase font-bold text-blue-700 dark:text-blue-300">Notices</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(severityCounts.notice)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Top 5 krytycznych problemow</p>
                  {topCriticalIssues.length > 0 ? (
                    <div className="space-y-2">
                      {topCriticalIssues.map((issue) => (
                        <div key={issue.key} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-accent/5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                                {issue.severity}
                              </Badge>
                              <span className="text-sm font-semibold">{issue.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline">{formatNumber(issue.count)}</Badge>
                            <Link href={`/audits/${params.id}/${issue.href}`}>
                              <Button variant="outline" size="sm" className="h-7 text-[10px]">
                                Szczegoly <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/70 p-3">
                      <CheckCircle className="h-4 w-4 text-green-700" />
                      <p className="text-sm text-green-800">Brak krytycznych problemow w tej chwili.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {momentumScore >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-primary" />}
                  Visibility Momentum
                </CardTitle>
                <CardDescription>Senuto wins vs losses wazone search volume (-100 do +100)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Momentum</div>
                    <div className="text-lg font-bold" style={{ color: momentumColor }}>
                      {momentumScore > 0 ? '+' : ''}{momentumScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${momentumGauge}%`, backgroundColor: momentumColor }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                    <span>-100</span>
                    <Badge variant={momentumScore >= 10 ? 'default' : momentumScore <= -10 ? 'destructive' : 'secondary'}>{momentumLabel}</Badge>
                    <span>+100</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Wins</p>
                    <p className="font-bold">{formatNumber(visibilityMomentum?.wins_count || 0)}</p>
                  </div>
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Losses</p>
                    <p className="font-bold">{formatNumber(visibilityMomentum?.losses_count || 0)}</p>
                  </div>
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Net</p>
                    <p className="font-bold">{formatNumber(visibilityMomentum?.net_keywords || 0)}</p>
                  </div>
                </div>

                {(topMomentumWins.length > 0 || topMomentumLosses.length > 0) && (
                  <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                    <div className="rounded border p-3 space-y-1">
                      <p className="text-[11px] uppercase font-semibold text-green-700 dark:text-green-300">Top wins</p>
                      {topMomentumWins.length > 0 ? (
                        topMomentumWins.map((row: any, idx: number) => (
                          <p key={`${row.keyword}-${idx}`} className="text-xs truncate">
                            {row.keyword} <span className="text-muted-foreground">({formatNumber(row.search_volume || 0)} SV)</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Brak danych</p>
                      )}
                    </div>
                    <div className="rounded border p-3 space-y-1">
                      <p className="text-[11px] uppercase font-semibold text-red-700 dark:text-red-300">Top losses</p>
                      {topMomentumLosses.length > 0 ? (
                        topMomentumLosses.map((row: any, idx: number) => (
                          <p key={`${row.keyword}-${idx}`} className="text-xs truncate">
                            {row.keyword} <span className="text-muted-foreground">({formatNumber(row.search_volume || 0)} SV)</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Brak danych</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Search Readiness
                </CardTitle>
                <CardDescription>Gotowosc domeny na widocznosc w ChatGPT, Perplexity i AI Overviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(aiReadinessScore)}%</div>
                    <div className="text-xs text-muted-foreground uppercase">{aiReadinessLabel}</div>
                  </div>
                  <Badge variant={aiReadinessScore >= 75 ? 'default' : aiReadinessScore >= 45 ? 'secondary' : 'destructive'}>
                    {aiReadinessLabel}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Pass</p>
                    <p className="font-bold text-green-700 dark:text-green-300">{formatNumber(aiReadinessPass)}</p>
                  </div>
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Warn</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300">{formatNumber(aiReadinessWarn)}</p>
                  </div>
                  <div className="rounded border bg-accent/5 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Fail</p>
                    <p className="font-bold text-red-700 dark:text-red-300">{formatNumber(aiReadinessFail)}</p>
                  </div>
                </div>

                <div className="rounded border p-3 bg-accent/5">
                  <p className="text-xs text-muted-foreground">
                    Citation bots blocked: <strong>{formatNumber(aiReadiness?.citation_bots?.blocked?.length || 0)}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    llms.txt: <strong>{aiReadiness?.llms_txt?.exists ? 'wykryty' : 'brak'}</strong>
                  </p>
                </div>

                <Link href={`/audits/${params.id}/ai-readiness`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Zobacz szczegoly AI Readiness <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Estimated Traffic
                </CardTitle>
                <CardDescription>Model CTR dla wszystkich pozycji Senuto + potencjal quick wins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{formatNumber(trafficTotal)}</div>
                    <div className="text-xs text-muted-foreground uppercase">Miesiecznie (szacunek)</div>
                  </div>
                  <Badge variant={trafficPotentialGain > 0 ? 'default' : 'secondary'}>
                    +{formatNumber(trafficPotentialGain)} potencjal
                  </Badge>
                </div>

                {trafficBrackets.length > 0 && (
                  <div className="space-y-2">
                    {trafficBrackets.map((bucket) => (
                      <div key={bucket.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                          <span>{bucket.label}</span>
                          <span>{formatNumber(bucket.traffic)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(2, (bucket.traffic / trafficMax) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {topTrafficKeywords.length > 0 && (
                  <div className="rounded border p-3 space-y-1">
                    <p className="text-[11px] uppercase font-semibold">Top frazy</p>
                    {topTrafficKeywords.map((row: any, idx: number) => (
                      <p key={`${row.keyword}-${idx}`} className="text-xs truncate">
                        {row.keyword} <span className="text-muted-foreground">({formatNumber(row.estimated_traffic || 0)})</span>
                      </p>
                    ))}
                  </div>
                )}

                <Link href={`/audits/${params.id}/visibility`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Zobacz sekcje Traffic Impact <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Content Quality
                </CardTitle>
                <CardDescription>Per-page CQI 0-100 na bazie tresci, metadanych i linkowania</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{Math.round(contentQualityScore)}</div>
                    <div className="text-xs text-muted-foreground uppercase">Site CQI</div>
                  </div>
                  <Badge variant={contentQualityScore >= 80 ? 'default' : contentQualityScore >= 60 ? 'secondary' : 'destructive'}>
                    Grade {contentQualityGrade}
                  </Badge>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => (
                    <div key={grade} className="rounded border bg-accent/5 p-2 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground">{grade}</p>
                      <p className="font-bold text-sm">{formatNumber(Number(contentQualityDistribution?.[grade] || 0))}</p>
                    </div>
                  ))}
                </div>

                {contentQualityTopIssues.length > 0 && (
                  <div className="rounded border p-3 space-y-1">
                    <p className="text-[11px] uppercase font-semibold">Top problemy</p>
                    {contentQualityTopIssues.map((issue: any, idx: number) => (
                      <p key={`${issue.issue}-${idx}`} className="text-xs truncate">
                        {contentIssueLabel(String(issue.issue || ''))}:{' '}
                        <span className="text-muted-foreground">{formatNumber(Number(issue.count || 0))}</span>
                      </p>
                    ))}
                  </div>
                )}

                <Link href={`/audits/${params.id}/content-quality`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Otworz Content Quality <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
            {/* Quick Stats & Navigation */}
            <div className="@lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
                <Link href={`/audits/${params.id}/seo`} className="block">
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold">{crawl?.pages_crawled || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Strony</div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href={`/audits/${params.id}/images`} className="block">
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold">{crawl?.images?.total || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Obrazy</div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href={`/audits/${params.id}/links`} className="block">
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardContent className="pt-6 text-center">
                      <div className={`text-2xl font-bold ${(crawl?.links?.broken || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {crawl?.links?.broken || 0}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Błędy 404</div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href={`/audits/${params.id}/performance`} className="block">
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold">{lh?.lcp || 0}ms</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">LCP</div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Senuto Quick Stats */}
              {senuto?.visibility && (
                <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
                  <Link href={`/audits/${params.id}/visibility`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{senuto.visibility.statistics?.statistics?.top10?.recent_value || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">TOP 10 Frazy</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/visibility`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatNumber(
                            senuto.visibility.statistics?.statistics?.visibility?.recent_value || 
                            senuto.visibility.dashboard?.statistics?.visibility?.recent_value || 0
                          )}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Widoczność</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/links?tab=incoming`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{senuto.backlinks.statistics?.backlinks_count || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Backlinki</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/links?tab=incoming`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{senuto.backlinks.statistics?.domains_count || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Domeny Ref.</div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {senuto?.visibility?.statistics?.statistics && (
                <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
                  <Link href={`/audits/${params.id}/visibility`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{formatNumber(senuto.visibility.statistics.statistics.domain_rank?.recent_value || 0)}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Domain Rank</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/visibility`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{formatNumber(senuto.visibility.statistics.statistics.ads_equivalent?.recent_value || 0)} PLN</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Ads Equivalent</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/ai-overviews`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{formatNumber(senuto.visibility.statistics.statistics.aio_visible_keywords?.recent_value || 0)}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">AIO Frazy</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/ai-overviews`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{formatNumber(senuto.visibility.ai_overviews?.statistics?.aio_keywords_with_domain_count || 0)}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Cytowania AIO</div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {senuto?.visibility?.dashboard?.technologies?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wykryte technologie</CardTitle>
                    <CardDescription>Technologie wykryte przez Senuto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {senuto.visibility.dashboard.technologies.map((tech: any, idx: number) => (
                        <Badge key={`${tech.name}-${idx}`} variant="outline" className="normal-case tracking-normal text-[11px] py-1 px-2">
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lista problemow wg severity</CardTitle>
                </CardHeader>
                <CardContent>
                  {severityIssues.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {severityIssues.slice(0, 8).map((issue) => (
                        <AccordionItem key={issue.key} value={issue.key}>
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2 text-left">
                              <Badge variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'secondary' : 'outline'}>
                                {issue.severity}
                              </Badge>
                              <span>{issue.label}</span>
                              <Badge variant="outline">{formatNumber(issue.count)}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2">
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                            <Link href={`/audits/${params.id}/${issue.href}`}>
                              <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                Otworz modul <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50/70 p-3">
                      <CheckCircle className="h-4 w-4 text-green-700 mt-0.5" />
                      <p className="text-sm text-green-800">Brak wykrytych problemow po klasyfikacji severity.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Summary */}
              <Card className={audit.ai_status === 'processing' ? 'opacity-50 grayscale' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Wnioski AI
                    {audit.ai_status === 'processing' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audit.ai_status === 'processing' ? (
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    </div>
                  ) : ai?.summary ? (
                    <p className="text-sm leading-relaxed italic text-muted-foreground">
                      &quot;{ai.summary}&quot;
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Brak podsumowania AI.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Statusy Stron</CardTitle>
                </CardHeader>
                <CardContent>
                  <PageStatusChart statusData={crawl?.pages_by_status || {}} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Inne Wyniki Lighthouse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Dostępność</span>
                    <Badge variant="outline">{lh?.accessibility_score || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Best Practices</span>
                    <Badge variant="outline">{lh?.best_practices_score || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Lighthouse SEO</span>
                    <Badge variant="outline">{formatScore(lh?.seo_score || 0)}</Badge>
                  </div>
                </CardContent>
              </Card>

              {audit.is_local_business && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                      <Users className="h-4 w-4" /> Lokalny Biznes
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Wykryto cechy biznesu lokalnego. Sprawdź dedykowane rekomendacje w zakładce Analiza AI.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
