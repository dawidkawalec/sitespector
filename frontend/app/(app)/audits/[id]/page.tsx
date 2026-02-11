'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { auditsAPI, CreateAuditData } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { 
  ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, 
  FileJson, CheckCircle, Search, Gauge, Sparkles, ImageIcon, 
  Link as LinkIcon, Users, Clock, ShieldCheck, Zap, ChevronDown, ChevronRight, ExternalLink,
  Terminal, Activity, Check, Timer, Globe2
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AuditDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
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
      // Poll every 3 seconds if processing or pending
      if (data?.status === 'processing' || data?.status === 'pending') {
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
      router.push('/dashboard')
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
    { id: 'ai_perf_tech', label: 'Analiza AI - Wydajność i Tech', icon: Zap },
    { id: 'ai_strategic', label: 'Analiza AI - Strategia i Bezpieczeństwo', icon: ShieldCheck },
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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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
              <Button onClick={downloadPDF} size="sm">
                <Download className="mr-2 h-4 w-4" /> Pobierz PDF
              </Button>
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

      {audit.status === 'processing' || audit.status === 'pending' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Dashboard */}
          <Card className="lg:col-span-2 border-primary/20 shadow-lg">
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
                  <div className="text-2xl font-bold text-primary">{audit.progress_percent || 0}%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Postęp</div>
                </div>
              </div>
              <Progress value={audit.progress_percent || 5} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Badge variant="outline" className="ml-2">{audit.progress_percent}%</Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Scores Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats & Navigation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <div className="text-2xl font-bold text-primary">{Math.round(senuto.visibility.dashboard?.statistics?.visibility?.recent_value || 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Widoczność</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/backlinks`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{senuto.backlinks.statistics?.backlinks_count || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Backlinki</div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href={`/audits/${params.id}/backlinks`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors h-full border-primary/10">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-primary">{senuto.backlinks.statistics?.domains_count || 0}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Domeny Ref.</div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Top Priority Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Krytyczne Problemy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {(crawl?.links?.broken || 0) > 0 && (
                      <AccordionItem value="broken-links" className="border-none">
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">Wykryto <strong>{crawl.links.broken}</strong> niedziałających linków.</p>
                              <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                            </div>
                            <AccordionContent className="pt-3 space-y-3">
                              <p className="text-xs text-muted-foreground">
                                Uszkodzone linki (404) negatywnie wpływają na doświadczenie użytkownika i indeksowanie strony przez roboty.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Link href={`/audits/${params.id}/links?filter=broken`}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                    Zobacz wszystkie <ChevronRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    )}
                    
                    {lh?.performance_score < 50 && (
                      <AccordionItem value="low-perf" className="border-none">
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100">
                          <Gauge className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">Bardzo niska wydajność (<strong>{lh.performance_score}/100</strong>).</p>
                              <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                            </div>
                            <AccordionContent className="pt-3 space-y-3">
                              <p className="text-xs text-muted-foreground">
                                Strona ładuje się zbyt wolno, co może powodować wysoki współczynnik odrzuceń i spadek pozycji w Google.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Link href={`/audits/${params.id}/performance`}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                    Analiza wydajności <ChevronRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    )}

                    {crawl?.images?.without_alt > 0 && (
                      <AccordionItem value="missing-alt" className="border-none">
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100">
                          <ImageIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm"><strong>{crawl.images.without_alt}</strong> obrazów bez tekstu ALT.</p>
                              <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                            </div>
                            <AccordionContent className="pt-3 space-y-3">
                              <p className="text-xs text-muted-foreground">
                                Brak opisów ALT utrudnia dostępność strony dla osób niedowidzących i pozbawia stronę dodatkowych sygnałów SEO.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Link href={`/audits/${params.id}/images?filter=no-alt`}>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                    Napraw obrazy <ChevronRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    )}

                    {(!crawl?.links?.broken && lh?.performance_score >= 50 && !crawl?.images?.without_alt) && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-400">Brak krytycznych problemów technicznych. Dobra robota!</p>
                      </div>
                    )}
                  </Accordion>
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
                    <p className="text-sm leading-relaxed italic text-muted-foreground">"{ai.summary}"</p>
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
                    <Badge variant="outline">{lh?.seo_score || 0}</Badge>
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
