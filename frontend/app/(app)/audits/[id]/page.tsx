'use client'

/**
 * Audit Overview Page
 * 
 * Main audit detail page showing executive summary.
 * Enriched with more metrics and quick navigation.
 */

import { useEffect, useState } from 'react'
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
  Link as LinkIcon, Users, Clock, ShieldCheck, Zap, ChevronDown, ChevronRight, ExternalLink
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

export default function AuditDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace } = useWorkspace()

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
      // Poll every 5 seconds if processing
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 5000
      }
      return false
    },
  })

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
  const ai = audit.results?.content_analysis

  // Calculate duration
  const duration = audit.started_at && audit.completed_at 
    ? Math.round((new Date(audit.completed_at).getTime() - new Date(audit.started_at).getTime()) / 1000)
    : null

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Powrót do listy
          </Link>
          <h1 className="text-3xl font-bold break-all">{audit.url}</h1>
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

      {audit.status === 'completed' ? (
        <>
          {/* Main Scores Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Wynik Ogólny', score: audit.overall_score, icon: ShieldCheck, tooltipId: 'overall_score' },
              { label: 'SEO', score: audit.seo_score, icon: Search, tooltipId: 'seo_score' },
              { label: 'Wydajność', score: audit.performance_score, icon: Gauge, tooltipId: 'performance_score' },
              { label: 'Treść', score: audit.content_score, icon: Sparkles, tooltipId: 'content_score' },
            ].map((item, i) => (
              <Card key={i} className="relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${getScoreColor(item.score).replace('text-', 'bg-')}`} />
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <item.icon className="h-3 w-3" /> {item.label}
                    </span>
                    <InfoTooltip id={item.tooltipId as any} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(item.score)}`}>
                    {formatScore(item.score)}
                  </div>
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
              {ai?.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> Wnioski AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">"{ai.summary}"</p>
                  </CardContent>
                </Card>
              )}
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
      ) : (
        <Card>
          <CardContent className="py-16 text-center space-y-6 max-w-md mx-auto">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary/50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Analiza w toku...</h2>
              <p className="text-sm text-muted-foreground">
                To może potrwać kilka minut (zwykle 3-8 min). Odświeżymy stronę automatycznie.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Postęp analizy</span>
                <span className="text-primary">{audit.processing_step || 'Inicjalizacja...'}</span>
              </div>
              <Progress 
                value={
                  audit.processing_step?.includes('Crawling') ? 20 :
                  audit.processing_step?.includes('Performance') ? 40 :
                  audit.processing_step?.includes('Competitor') ? 60 :
                  audit.processing_step?.includes('AI') ? 80 :
                  audit.processing_step?.includes('Finalizing') ? 95 : 10
                } 
                className="h-2"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Jeśli analiza trwa dłużej niż 10 minut, zostanie oznaczona jako nieudana.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
