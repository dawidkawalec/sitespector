'use client'

/**
 * Audit Overview Page
 * 
 * Main audit detail page showing executive summary.
 * Other sections moved to dedicated routes.
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
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, FileJson, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Audit } from '@/lib/api'
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

  // Retry/Restart mutation (create new audit with same data)
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
      alert('Błąd podczas pobierania danych. Sprawdź logi konsoli.')
    }
  }

  if (!isAuth) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Audyt nie został znaleziony</h1>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do dashboardu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 break-all">{audit.url}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(audit.status)}>
                {audit.status === 'pending' && 'Oczekujący'}
                {audit.status === 'processing' && 'W trakcie'}
                {audit.status === 'completed' && 'Ukończony'}
                {audit.status === 'failed' && 'Błąd'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(audit.created_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {audit.status === 'completed' && (
              <>
                <Button onClick={downloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Pobierz PDF
                </Button>
                <Button variant="secondary" onClick={downloadRawData} title="Pobierz surowe dane JSON (ZIP)">
                  <FileJson className="mr-2 h-4 w-4" />
                  Raw Data
                </Button>
              </>
            )}

            <Button variant="outline" onClick={handleRetry} title="Uruchom nowy audyt dla tego URL">
                <RefreshCw className="h-4 w-4 mr-2" /> Restart
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="icon" title="Usuń audyt">
                        <Trash className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno usunąć ten audyt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Wszystkie dane audytu oraz raporty zostaną trwale usunięte.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Usuń</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {(audit.status === 'pending' || audit.status === 'processing') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {audit.status === 'pending' ? 'Oczekiwanie na rozpoczęcie...' : 'Analiza w trakcie...'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Audyt może potrwać do 10 minut. Możesz zamknąć tę stronę - wyniki będą dostępne w dashboardzie.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {audit.status === 'failed' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Wystąpił błąd podczas analizy
              </h3>
              {audit.error_message && (
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">{audit.error_message}</p>
              )}
              <Button onClick={handleRetry} className="mt-6" variant="default">Spróbuj ponownie</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed State - Overview */}
      {audit.status === 'completed' && (
        <>
          {/* Score Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Wynik ogólny</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.overall_score)}`}>
                  {formatScore(audit.overall_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>SEO</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.seo_score)}`}>
                  {formatScore(audit.seo_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Wydajność</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.performance_score)}`}>
                  {formatScore(audit.performance_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Treść</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.content_score)}`}>
                  {formatScore(audit.content_score)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Executive Summary - 4 main scores */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Wynik Ogólny</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(audit.overall_score)}`}>
                    {formatScore(audit.overall_score)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(audit.overall_score ?? 0) >= 80 ? 'Bardzo dobry' : (audit.overall_score ?? 0) >= 60 ? 'Dobry' : (audit.overall_score ?? 0) >= 40 ? 'Średni' : 'Wymaga poprawy'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>SEO</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(audit.seo_score)}`}>
                    {formatScore(audit.seo_score)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {audit.results?.crawl?.pages_crawled || 0} stron przeskanowanych
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Wydajność</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(audit.performance_score)}`}>
                    {formatScore(audit.performance_score)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    LCP: {audit.results?.lighthouse?.desktop?.lcp || 0}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Treść</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(audit.content_score)}`}>
                    {formatScore(audit.content_score)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {audit.results?.crawl?.word_count || 0} słów
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {audit.results?.crawl?.pages_crawled || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Przeskanowanych stron</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {audit.results?.crawl?.images?.total || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Obrazów znalezionych</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${(audit.results?.crawl?.links?.broken || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {audit.results?.crawl?.links?.broken || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Broken links</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${(audit.results?.crawl?.images?.without_alt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {audit.results?.crawl?.images?.without_alt || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Obrazów bez ALT</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Top Priority Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Priorytetowe Problemy</CardTitle>
                <CardDescription>Najważniejsze rzeczy do naprawienia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(audit.results?.crawl?.images?.without_alt || 0) > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          {audit.results.crawl.images.without_alt} obrazów bez ALT text
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Krytyczne dla SEO i dostępności - dodaj opisy dla wszystkich obrazów
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(audit.results?.crawl?.links?.broken || 0) > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          {audit.results.crawl.links.broken} broken links (404)
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Napraw wszystkie niedziałające linki - wpływają negatywnie na użytkowników i SEO
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(audit.results?.crawl?.technical_seo?.missing_canonical || 0) > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          {audit.results.crawl.technical_seo.missing_canonical} stron bez canonical tag
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Dodaj canonical tags aby uniknąć duplikacji treści
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(audit.results?.lighthouse?.desktop?.performance_score || 100) < 50 && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          Niska wydajność ({audit.results.lighthouse.desktop.performance_score}/100)
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Optymalizuj obrazy, zredukuj JavaScript, użyj cache - sprawdź zakładkę Wydajność
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(audit.results?.crawl?.word_count || 0) < 300 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          Za mało treści ({audit.results.crawl.word_count} słów)
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Dodaj więcej wartościowej treści (zalecane minimum 300 słów)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* If everything is good */}
                  {(audit.results?.crawl?.images?.without_alt || 0) === 0 && 
                   (audit.results?.crawl?.links?.broken || 0) === 0 && 
                   (audit.results?.crawl?.technical_seo?.missing_canonical || 0) === 0 &&
                   (audit.results?.lighthouse?.desktop?.performance_score || 0) >= 50 &&
                   (audit.results?.crawl?.word_count || 0) >= 300 && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Świetna robota! Brak krytycznych problemów
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Strona jest dobrze zoptymalizowana. Sprawdź pozostałe zakładki dla szczegółów.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* AI Summary */}
            {audit.results?.content_analysis?.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Wnioski z Analizy AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm">{audit.results.content_analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {audit.is_local_business && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  🏢 Wykryto lokalną firmę
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Strona wykazuje cechy biznesu lokalnego. Rekomendacje dla lokalnego SEO są dostępne w zakładce Analiza AI.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
