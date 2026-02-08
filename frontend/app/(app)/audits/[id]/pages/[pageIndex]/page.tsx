'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, ArrowLeft, Globe, FileText, Layout, 
  BarChart, ImageIcon, Link2, Sparkles, AlertCircle,
  CheckCircle2, XCircle, Clock, Zap, Lightbulb, TrendingUp, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { cn, formatFileSize, formatDuration } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

export default function PageDetailsPage({ params }: { params: { id: string, pageIndex: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const idx = parseInt(params.pageIndex)

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
  })

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const page = audit?.results?.crawl?.all_pages?.[idx]
  const aiAnalysis = audit?.results?.page_analyses?.[params.pageIndex]

  const handleAnalyze = async () => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    try {
      await auditsAPI.analyzePages(params.id, [idx])
      toast.success('Analiza AI ukończona!')
    } catch (error) {
      console.error('AI analysis failed:', error)
      toast.error('Nie udało się przeprowadzić analizy AI.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!page) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Strona nie została znaleziona</h1>
        <Link href={`/audits/${params.id}/seo`}>
          <Button><ArrowLeft className="mr-2 h-4 w-4" /> Powrót do SEO</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href={`/audits/${params.id}/seo`} 
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Powrót do listy stron
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold break-all flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary shrink-0" />
              {page.url}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={page.status_code === 200 ? 'default' : 'destructive'}>
                Status: {page.status_code}
              </Badge>
              <Badge variant={page.indexability === 'indexable' ? 'outline' : 'destructive'}>
                {page.indexability}
              </Badge>
              {page.canonical && (
                <Badge variant="secondary" className="text-[10px]">
                  Canonical: {page.canonical === page.url ? 'Self' : 'External'}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(page.url, '_blank')}>
            Otwórz stronę <Zap className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Meta & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meta Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5 text-primary" />
                Tagi Meta & Nagłówki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    Title Tag
                    <InfoTooltip id="meta_title" iconClassName="h-3 w-3" />
                  </label>
                  <Badge variant={(page.title_length || 0) < 30 || (page.title_length || 0) > 70 ? 'destructive' : 'outline'}>
                    {page.title_length || 0} znaków
                  </Badge>
                </div>
                <div className="p-3 bg-accent/30 rounded border text-sm font-medium">
                  {page.title || <span className="text-destructive italic text-xs">Brak tytułu</span>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    Meta Description
                    <InfoTooltip id="meta_description" iconClassName="h-3 w-3" />
                  </label>
                  <Badge variant={(page.meta_description_length || 0) < 70 || (page.meta_description_length || 0) > 155 ? 'destructive' : 'outline'}>
                    {page.meta_description_length || 0} znaków
                  </Badge>
                </div>
                <div className="p-3 bg-accent/30 rounded border text-sm leading-relaxed">
                  {page.meta_description || <span className="text-destructive italic text-xs">Brak opisu meta</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    Nagłówek H1
                    <InfoTooltip id="h1_tag" iconClassName="h-3 w-3" />
                  </label>
                  <div className="p-2 bg-accent/20 rounded border-l-2 border-primary text-xs italic">
                    {page.h1 || "Brak nagłówka H1"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nagłówek H2 (pierwszy)</label>
                  <div className="p-2 bg-accent/10 rounded border-l-2 border-muted-foreground/30 text-xs italic">
                    {page.h2 || "Brak nagłówka H2"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className={cn("border-primary/20", aiAnalysis ? "bg-white dark:bg-gray-950" : "bg-primary/5")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Analiza AI
                </CardTitle>
                {aiAnalysis && (
                  <Badge className={cn(
                    aiAnalysis.page_score >= 80 ? "bg-green-500" : 
                    aiAnalysis.page_score >= 50 ? "bg-yellow-500" : "bg-red-500"
                  )}>
                    AI Score: {aiAnalysis.page_score}/100
                  </Badge>
                )}
              </div>
              <CardDescription>Głęboka analiza treści i optymalizacji dla tej konkretnej podstrony.</CardDescription>
            </CardHeader>
            <CardContent>
              {!aiAnalysis ? (
                <div className="text-center py-10 space-y-4">
                  <div className="max-w-xs mx-auto space-y-4">
                    <p className="text-sm text-muted-foreground">
                      AI przeanalizuje treść pod kątem słów kluczowych, czytelności i intencji użytkownika.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizowanie...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Analizuj tę stronę
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="p-4 bg-accent/30 rounded-lg border border-border/50">
                    <p className="text-sm italic leading-relaxed">"{aiAnalysis.summary}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Problemy
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.issues.map((issue: string, i: number) => (
                          <li key={i} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-100 dark:border-red-900/30">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Rekomendacje
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-xs p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900/30">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Wpływ na ranking:
                    </div>
                    <Badge variant={aiAnalysis.impact === 'high' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                      {aiAnalysis.impact} Impact
                    </Badge>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] text-muted-foreground hover:text-primary"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Odśwież analizę AI
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Links */}
        <div className="space-y-6">
          {/* Page Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Statystyki Strony</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Liczba słów
                  <InfoTooltip id="word_count" iconClassName="h-3 w-3" />
                </span>
                <span className="font-bold">{page.word_count || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Czytelność (Flesch)
                  <InfoTooltip id="readability" iconClassName="h-3 w-3" />
                </span>
                <span className="font-bold">{page.flesch_reading_ease || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Czas odpowiedzi</span>
                <span className="font-bold">{formatDuration(page.response_time)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Rozmiar strony</span>
                <span className="font-bold">{formatFileSize(page.size_bytes)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Links Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Struktura Linków</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Linki przychodzące (Inlinks)
                  <InfoTooltip id="internal_links" iconClassName="h-3 w-3" />
                </span>
                <Badge variant="secondary">{page.inlinks || 0}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Linki wychodzące (Outlinks)</span>
                <Badge variant="secondary">{page.outlinks || 0}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Linki zewnętrzne
                  <InfoTooltip id="external_links" iconClassName="h-3 w-3" />
                </span>
                <Badge variant="secondary">{page.external_outlinks || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Indexing & Robots */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Indeksowanie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Meta Robots</p>
                <div className="p-2 bg-accent/30 rounded text-[11px] font-mono">
                  {page.meta_robots || "index, follow"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Canonical URL</p>
                <div className="p-2 bg-accent/30 rounded text-[11px] font-mono break-all leading-tight">
                  {page.canonical || page.url}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
