'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { auditsAPI, CreateAuditData } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, FileJson, CheckCircle, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Audit } from '@/lib/api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageStatusChart, ResponseTimeChart, WordCountChart, ImageSizeChart } from '@/components/AuditCharts'
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
  
  // State for All Pages tab
  const [pagesSortBy, setPagesSortBy] = useState('url')
  const [pagesFilterStatus, setPagesFilterStatus] = useState('all')
  const [pagesCurrentPage, setPagesCurrentPage] = useState(1)
  
  // State for Images tab
  const [imagesFilterAlt, setImagesFilterAlt] = useState('all')
  const [imagesCurrentPage, setImagesCurrentPage] = useState(1)
  
  // State for expandable rows
  const [expandedPageRow, setExpandedPageRow] = useState<number | null>(null)

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

  const renderSeoResults = (results: any) => {
      const crawl = results?.crawl
      if (!crawl) return <p className="text-muted-foreground">Brak danych z crawlowania.</p>
      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Meta Title</CardTitle></CardHeader>
                      <CardContent>
                          <div className="text-lg font-semibold break-words">{crawl.title || '-'}</div>
                          <p className="text-xs text-muted-foreground mt-1">Długość: {crawl.title?.length || 0} znaków</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Meta Description</CardTitle></CardHeader>
                      <CardContent>
                           <div className="text-sm break-words">{crawl.meta_desc || '-'}</div>
                           <p className="text-xs text-muted-foreground mt-1">Długość: {crawl.meta_desc?.length || 0} znaków</p>
                      </CardContent>
                  </Card>
              </div>
              
               <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Nagłówki H1</CardTitle></CardHeader>
                  <CardContent>
                      {crawl.h1_tags && crawl.h1_tags.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                              {crawl.h1_tags.map((h1: string, i: number) => (
                                  <li key={i} className="text-sm">{h1}</li>
                              ))}
                          </ul>
                      ) : (
                          <span className="text-yellow-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Brak nagłówków H1</span>
                      )}
                  </CardContent>
              </Card>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Status Code</div>
                       <div className="text-2xl font-bold mt-1">{crawl.status_code || '-'}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Load Time</div>
                       <div className="text-2xl font-bold mt-1">{crawl.load_time ? `${Math.round(crawl.load_time * 1000)}ms` : '-'}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Word Count</div>
                       <div className="text-2xl font-bold mt-1">{crawl.word_count || 0}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Page Size</div>
                       <div className="text-2xl font-bold mt-1">{crawl.size_bytes ? `${Math.round(crawl.size_bytes / 1024)} KB` : '-'}</div>
                   </div>
               </div>
          </div>
      )
  }

  const renderPerformanceResults = (results: any) => {
      const lh = results?.lighthouse?.desktop
      const lhMobile = results?.lighthouse?.mobile
      if (!lh) return <p className="text-muted-foreground">Brak danych Lighthouse.</p>
      
      const metrics = [
          { label: 'First Contentful Paint', value: lh.fcp ? `${lh.fcp}ms` : '-', score: lh.performance_score },
          { label: 'Largest Contentful Paint', value: lh.lcp ? `${lh.lcp}ms` : '-', score: lh.performance_score },
          { label: 'Total Blocking Time', value: lh.total_blocking_time ? `${lh.total_blocking_time}ms` : '-', score: lh.performance_score },
          { label: 'Cumulative Layout Shift', value: lh.cls !== undefined ? lh.cls.toFixed(3) : '-', score: lh.performance_score },
          { label: 'Speed Index', value: lh.speed_index ? `${lh.speed_index}ms` : '-', score: lh.performance_score },
          { label: 'Time to First Byte', value: lh.ttfb ? `${lh.ttfb}ms` : '-', score: lh.performance_score },
      ]
      
      const diagnostics = lh.audits?.diagnostics || []
      const opportunities = lh.audits?.opportunities || []
      const passed = lh.audits?.passed || []

      return (
          <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                      <CardHeader className="pb-3">
                          <CardDescription>Performance</CardDescription>
                          <CardTitle className={`text-3xl ${getScoreColor(lh.performance_score)}`}>
                              {formatScore(lh.performance_score)}
                          </CardTitle>
                      </CardHeader>
                  </Card>
                  <Card>
                      <CardHeader className="pb-3">
                          <CardDescription>Accessibility</CardDescription>
                          <CardTitle className={`text-3xl ${getScoreColor(lh.accessibility_score)}`}>
                              {formatScore(lh.accessibility_score)}
                          </CardTitle>
                      </CardHeader>
                  </Card>
                  <Card>
                      <CardHeader className="pb-3">
                          <CardDescription>Best Practices</CardDescription>
                          <CardTitle className={`text-3xl ${getScoreColor(lh.best_practices_score)}`}>
                              {formatScore(lh.best_practices_score)}
                          </CardTitle>
                      </CardHeader>
                  </Card>
                  <Card>
                      <CardHeader className="pb-3">
                          <CardDescription>SEO</CardDescription>
                          <CardTitle className={`text-3xl ${getScoreColor(lh.seo_score)}`}>
                              {formatScore(lh.seo_score)}
                          </CardTitle>
                      </CardHeader>
                  </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {metrics.map((metric, i) => (
                      <Card key={i}>
                          <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                                  {metric.value || '-'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">Desktop: {metric.value}</div>
                              {lhMobile && (
                                <div className="text-xs text-muted-foreground">Mobile: {
                                  metric.label.includes('First Content') ? `${lhMobile.fcp}ms` :
                                  metric.label.includes('Largest Content') ? `${lhMobile.lcp}ms` :
                                  metric.label.includes('Blocking') ? `${lhMobile.total_blocking_time}ms` :
                                  metric.label.includes('Layout') ? lhMobile.cls?.toFixed(3) :
                                  metric.label.includes('Speed') ? `${lhMobile.speed_index}ms` :
                                  metric.label.includes('Byte') ? `${lhMobile.ttfb}ms` : '-'
                                }</div>
                              )}
                          </CardContent>
                      </Card>
                  ))}
              </div>
              
              {diagnostics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Diagnostyka - Problemy Wymagające Naprawy ({diagnostics.length})
                    </CardTitle>
                    <CardDescription>Audyty które nie przeszły (wynik &lt; 50%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {diagnostics.slice(0, 20).map((audit: any, i: number) => (
                        <AccordionItem key={i} value={`diagnostic-${i}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Badge variant="destructive" className="flex-shrink-0">
                                {Math.round(audit.score * 100)}
                              </Badge>
                              <span className="font-medium">{audit.title}</span>
                              {audit.displayValue && (
                                <span className="text-sm text-muted-foreground ml-auto mr-4">
                                  {audit.displayValue}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              <p className="text-sm text-muted-foreground">{audit.description}</p>
                              {audit.numericValue && (
                                <div className="text-xs bg-muted p-2 rounded">
                                  <strong>Wartość:</strong> {audit.numericValue} {audit.numericUnit}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
              
              {opportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                      Możliwości Optymalizacji ({opportunities.length})
                    </CardTitle>
                    <CardDescription>Audyty które można poprawić (wynik 50-99%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {opportunities.slice(0, 20).map((audit: any, i: number) => (
                        <AccordionItem key={i} value={`opportunity-${i}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Badge variant="secondary" className="flex-shrink-0">
                                {Math.round(audit.score * 100)}
                              </Badge>
                              <span className="font-medium">{audit.title}</span>
                              {audit.displayValue && (
                                <span className="text-sm text-muted-foreground ml-auto mr-4">
                                  {audit.displayValue}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              <p className="text-sm text-muted-foreground">{audit.description}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
              
              {passed.length > 0 && (
                <details className="border rounded-lg">
                  <summary className="cursor-pointer p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Audyty Pozytywne ({passed.length}) - kliknij aby rozwinąć</span>
                    </div>
                  </summary>
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                      {passed.map((audit: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{audit.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}
          </div>
      )
  }

  const renderContentResults = (results: any) => {
      const content = results?.content_analysis
      if (!content) return <p className="text-muted-foreground">Brak analizy treści AI.</p>
      
      return (
          <div className="space-y-6">
              {/* Info Boxes - Wyjaśnienia */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Skąd pochodzi Quality Score?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Wynik jakości treści jest obliczany automatycznie na podstawie:
                    </p>
                    <ul className="text-xs space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-fit">•</span>
                        <span><strong>Title tag (30-70 znaków):</strong> -20 pkt jeśli brak, -10 za krótki</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-fit">•</span>
                        <span><strong>Meta description (120-170 znaków):</strong> -15 pkt jeśli brak</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-fit">•</span>
                        <span><strong>Tag H1 (dokładnie 1):</strong> -15 pkt jeśli brak</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-fit">•</span>
                        <span><strong>Obrazy z ALT:</strong> -2 pkt za każdy obraz bez ALT</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-fit">•</span>
                        <span><strong>Liczba słów (min 300):</strong> -10 pkt jeśli mniej</span>
                      </li>
                    </ul>
                    <p className="text-xs font-semibold mt-3 text-blue-900 dark:text-blue-100">
                      Start: 100 punktów → odejmowane za każdy problem
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Co to jest Readability Score?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Wynik czytelności używa algorytmu <strong>Flesch Reading Ease</strong> (ze Screaming Frog):
                    </p>
                    <ul className="text-xs space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">90-100</Badge>
                        <span>Bardzo łatwy (dzieci 11 lat)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">60-70</Badge>
                        <span>Łatwy (uczniowie 13-15 lat)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">30-50</Badge>
                        <span>Trudny (studenci)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">0-30</Badge>
                        <span>Bardzo trudny (absolwenci)</span>
                      </li>
                    </ul>
                    <p className="text-xs font-semibold mt-3 text-purple-900 dark:text-purple-100">
                      Twój wynik: {content.readability_score || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Metryki Treści</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                          <div className="bg-card p-4 rounded-lg border">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Jakość Treści</div>
                              <div className="text-2xl font-bold mt-1">{content.quality_score || 0}/100</div>
                          </div>
                          <div className="bg-card p-4 rounded-lg border">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Liczba Słów</div>
                              <div className="text-2xl font-bold mt-1">{content.word_count || 0}</div>
                          </div>
                          <div className="bg-card p-4 rounded-lg border">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Czytelność (Flesch)</div>
                              <div className="text-2xl font-bold mt-1">{content.readability_score || 0}</div>
                          </div>
                      </div>
                  </CardContent>
              </Card>

               <Card>
                  <CardHeader>
                      <CardTitle>Rekomendacje SEO</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-3">
                           {content.recommendations?.map((item: string, i: number) => (
                                  <li key={i} className="text-sm bg-muted p-3 rounded-md border flex gap-3">
                                      <span className="font-bold text-muted-foreground">{i+1}.</span>
                                      <span>{item}</span>
                                  </li>
                              )) || <p className="text-muted-foreground">Brak rekomendacji.</p>}
                      </ul>
                  </CardContent>
              </Card>
          </div>
      )
  }

  const renderAllPages = (results: any) => {
    const pages = results?.crawl?.all_pages || []
    const PER_PAGE = 50
    
    if (pages.length === 0) {
      return <p className="text-muted-foreground">Brak danych o stronach.</p>
    }
    
    // Filter by status
    const filtered = pages.filter((p: any) => {
      if (pagesFilterStatus === 'all') return true
      return p.status_code.toString() === pagesFilterStatus
    })
    
    // Sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (pagesSortBy === 'url') return a.url.localeCompare(b.url)
      if (pagesSortBy === 'response_time') return b.response_time - a.response_time
      if (pagesSortBy === 'word_count') return b.word_count - a.word_count
      if (pagesSortBy === 'size') return b.size_bytes - a.size_bytes
      return 0
    })
    
    // Paginate
    const totalPages = Math.ceil(sorted.length / PER_PAGE)
    const paginated = sorted.slice((pagesCurrentPage - 1) * PER_PAGE, pagesCurrentPage * PER_PAGE)
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Wszystkie Strony ({pages.length})</CardTitle>
            <CardDescription>Kompletna lista przeskanowanych stron z szczegółami</CardDescription>
            <div className="flex gap-4 mt-4">
              <Select value={pagesFilterStatus} onValueChange={setPagesFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie ({pages.length})</SelectItem>
                  <SelectItem value="200">200 OK ({results?.crawl?.pages_by_status?.['200'] || 0})</SelectItem>
                  <SelectItem value="301">301 Redirect ({results?.crawl?.pages_by_status?.['301'] || 0})</SelectItem>
                  <SelectItem value="404">404 Not Found ({results?.crawl?.pages_by_status?.['404'] || 0})</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pagesSortBy} onValueChange={setPagesSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sortuj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="response_time">Czas odpowiedzi</SelectItem>
                  <SelectItem value="word_count">Liczba słów</SelectItem>
                  <SelectItem value="size">Rozmiar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium">URL</th>
                      <th className="p-3 text-center font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Title</th>
                      <th className="p-3 text-center font-medium">Słowa</th>
                      <th className="p-3 text-center font-medium">Inlinks</th>
                      <th className="p-3 text-center font-medium">Czas (ms)</th>
                      <th className="p-3 text-center font-medium">Rozmiar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((page: any, i: number) => (
                      <>
                        <tr 
                          key={i} 
                          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedPageRow(expandedPageRow === i ? null : i)}
                        >
                          <td className="p-3">
                            <a 
                              href={page.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1 max-w-md truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{page.url || 'Brak URL'}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={page.status_code === 200 ? 'default' : page.status_code >= 400 ? 'destructive' : 'secondary'}>
                              {page.status_code}
                            </Badge>
                          </td>
                          <td className="p-3 max-w-xs truncate" title={page.title}>
                            {page.title || <span className="text-muted-foreground italic">Brak title</span>}
                          </td>
                          <td className="p-3 text-center">{page.word_count}</td>
                          <td className="p-3 text-center">{page.inlinks}</td>
                          <td className="p-3 text-center">{Math.round(page.response_time * 1000)}</td>
                          <td className="p-3 text-center">{Math.round(page.size_bytes / 1024)} KB</td>
                        </tr>
                        
                        {/* Expanded details row */}
                        {expandedPageRow === i && (
                          <tr className="border-b bg-muted/30">
                            <td colSpan={7} className="p-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Meta Description</p>
                                    <p className="text-sm">
                                      {page.meta_description || <span className="text-red-600 font-semibold">BRAK - Dodaj opis!</span>}
                                    </p>
                                    {page.meta_description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Długość: {page.meta_description_length} znaków
                                        {page.meta_description_length < 120 && ' (za krótka)'}
                                        {page.meta_description_length > 170 && ' (za długa)'}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Nagłówki</p>
                                    {page.h1 && (
                                      <div className="mb-2">
                                        <Badge className="mr-2">H1</Badge>
                                        <span className="text-sm">{page.h1}</span>
                                      </div>
                                    )}
                                    {page.h2 && (
                                      <div>
                                        <Badge variant="secondary" className="mr-2">H2</Badge>
                                        <span className="text-sm">{page.h2}</span>
                                      </div>
                                    )}
                                    {!page.h1 && !page.h2 && (
                                      <span className="text-muted-foreground italic text-sm">Brak nagłówków</span>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Canonical URL</p>
                                    {page.canonical ? (
                                      <a href={page.canonical} target="_blank" className="text-blue-600 hover:underline text-xs break-all">
                                        {page.canonical}
                                      </a>
                                    ) : (
                                      <span className="text-yellow-600 font-semibold text-sm">BRAK - Dodaj canonical!</span>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Meta Robots</p>
                                    <Badge variant={page.meta_robots?.includes('noindex') ? 'destructive' : 'default'}>
                                      {page.meta_robots || 'brak'}
                                    </Badge>
                                    {page.indexability && (
                                      <Badge variant="outline" className="ml-2">
                                        {page.indexability}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Linki</p>
                                    <div className="text-sm space-y-1">
                                      <p>Outlinks: {page.outlinks}</p>
                                      <p>External: {page.external_outlinks}</p>
                                      <p>Internal: {page.outlinks - page.external_outlinks}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Czytelność</p>
                                    {page.flesch_reading_ease ? (
                                      <div>
                                        <p className="text-sm font-bold">{page.flesch_reading_ease.toFixed(1)}</p>
                                        <p className="text-xs text-muted-foreground">{page.readability || 'Flesch Reading Ease'}</p>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic text-sm">Brak danych</span>
                                    )}
                                  </div>
                                  
                                  {page.redirect_url && (
                                    <div className="col-span-2">
                                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Redirect Do</p>
                                      <a href={page.redirect_url} target="_blank" className="text-blue-600 hover:underline text-xs break-all">
                                        {page.redirect_url}
                                      </a>
                                      <Badge variant="secondary" className="ml-2">{page.redirect_type}</Badge>
                                    </div>
                                  )}
                                </div>
                                
                                {/* SEO Analysis for this page */}
                                <div className="mt-4 p-3 bg-background rounded-lg border">
                                  <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">Analiza SEO tej strony</p>
                                  <ul className="space-y-2 text-sm">
                                    {!page.title && (
                                      <li className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Brak title tag
                                      </li>
                                    )}
                                    {page.title && page.title_length < 30 && (
                                      <li className="flex items-center gap-2 text-yellow-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Title za krótki ({page.title_length} znaków, zalecane 30-70)
                                      </li>
                                    )}
                                    {!page.meta_description && (
                                      <li className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Brak meta description
                                      </li>
                                    )}
                                    {!page.canonical && page.status_code === 200 && (
                                      <li className="flex items-center gap-2 text-yellow-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Brak canonical tag
                                      </li>
                                    )}
                                    {page.word_count < 300 && page.status_code === 200 && (
                                      <li className="flex items-center gap-2 text-yellow-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Za mało treści ({page.word_count} słów, zalecane min. 300)
                                      </li>
                                    )}
                                    {page.response_time > 2 && (
                                      <li className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Bardzo wolna strona ({Math.round(page.response_time * 1000)}ms, zalecane max 2000ms)
                                      </li>
                                    )}
                                    {page.title && page.title_length >= 30 && page.title_length <= 70 && 
                                     page.meta_description && page.canonical && 
                                     page.word_count >= 300 && page.response_time <= 2 && (
                                      <li className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        Strona dobrze zoptymalizowana!
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Strona {pagesCurrentPage} z {totalPages} (wyświetlono {paginated.length} z {filtered.length})
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPagesCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagesCurrentPage === 1}
                >
                  Poprzednia
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPagesCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={pagesCurrentPage >= totalPages}
                >
                  Następna
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {results?.crawl?.pages_by_status?.['200'] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Status 200 OK</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {results?.crawl?.pages_by_status?.['301'] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Redirects 301</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {results?.crawl?.pages_by_status?.['302'] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Redirects 302</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {results?.crawl?.pages_by_status?.['404'] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Not Found 404</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {results?.crawl?.pages_by_status?.['other'] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Inne statusy</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Rozkład Status Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <PageStatusChart statusData={results?.crawl?.pages_by_status || {}} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rozkład Czasu Odpowiedzi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseTimeChart pages={pages} />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rozkład Liczby Słów</CardTitle>
          </CardHeader>
          <CardContent>
            <WordCountChart pages={pages} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderImages = (results: any) => {
    const images = results?.crawl?.images?.all_images || []
    const imagesStats = results?.crawl?.images || {}
    const PER_PAGE = 50
    
    if (images.length === 0) {
      return <p className="text-muted-foreground">Brak danych o obrazach.</p>
    }
    
    // Filter
    const filtered = images.filter((img: any) => {
      if (imagesFilterAlt === 'all') return true
      if (imagesFilterAlt === 'with') return !!img.alt_text
      if (imagesFilterAlt === 'without') return !img.alt_text
      return true
    })
    
    // Paginate
    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((imagesCurrentPage - 1) * PER_PAGE, imagesCurrentPage * PER_PAGE)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{imagesStats.total || 0}</div>
              <div className="text-xs text-muted-foreground">Wszystkie obrazy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{imagesStats.with_alt || 0}</div>
              <div className="text-xs text-muted-foreground">Z ALT text</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{imagesStats.without_alt || 0}</div>
              <div className="text-xs text-muted-foreground">Bez ALT text</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{imagesStats.total_size_mb || 0} MB</div>
              <div className="text-xs text-muted-foreground">Całkowity rozmiar</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rozkład Rozmiaru Obrazów</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageSizeChart images={images} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista Obrazów ({images.length})</CardTitle>
            <div className="flex gap-4 mt-4">
              <Select value={imagesFilterAlt} onValueChange={setImagesFilterAlt}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtruj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie ({images.length})</SelectItem>
                  <SelectItem value="with">Z ALT text ({imagesStats.with_alt || 0})</SelectItem>
                  <SelectItem value="without">Bez ALT text ({imagesStats.without_alt || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium">URL Obrazu</th>
                      <th className="p-3 text-left font-medium">ALT Text</th>
                      <th className="p-3 text-center font-medium">Rozmiar</th>
                      <th className="p-3 text-center font-medium">Format</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((img: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <a 
                            href={img.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1 max-w-lg truncate"
                          >
                            <span className="truncate">{img.url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="p-3 max-w-md truncate">
                          {img.alt_text ? (
                            <span className="text-green-600">{img.alt_text}</span>
                          ) : (
                            <span className="text-red-600 font-semibold">BRAK ALT</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{Math.round(img.size_bytes / 1024)} KB</td>
                        <td className="p-3 text-center text-xs">{img.format}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Strona {imagesCurrentPage} z {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setImagesCurrentPage(p => Math.max(1, p - 1))}
                  disabled={imagesCurrentPage === 1}
                >
                  Poprzednia
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setImagesCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={imagesCurrentPage >= totalPages}
                >
                  Następna
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLinks = (results: any) => {
    const links = results?.crawl?.links || {}
    const pages = results?.crawl?.all_pages || []
    
    const brokenPages = pages.filter((p: any) => p.status_code >= 400)
    const redirectPages = pages.filter((p: any) => p.status_code >= 300 && p.status_code < 400)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{links.internal || 0}</div>
              <div className="text-xs text-muted-foreground">Linki wewnętrzne</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{links.external || 0}</div>
              <div className="text-xs text-muted-foreground">Linki zewnętrzne</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{links.broken || 0}</div>
              <div className="text-xs text-muted-foreground">Broken links</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{links.redirects || 0}</div>
              <div className="text-xs text-muted-foreground">Redirects</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {brokenPages.length > 0 ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Broken Links - Wymagają Naprawy! ({brokenPages.length})
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Broken Links ({brokenPages.length})
                </>
              )}
            </CardTitle>
            <CardDescription>
              {brokenPages.length > 0 
                ? 'Strony zwracające błędy 404+ - wymagają natychmiastowej naprawy' 
                : 'Wszystkie linki działają poprawnie'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {brokenPages.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">URL</th>
                        <th className="p-3 text-center font-medium">Status</th>
                        <th className="p-3 text-center font-medium">Inlinks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokenPages.slice(0, 50).map((page: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-mono text-xs max-w-lg truncate">{page.url}</td>
                          <td className="p-3 text-center">
                            <Badge variant="destructive">{page.status_code}</Badge>
                          </td>
                          <td className="p-3 text-center">{page.inlinks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-600">Brak broken links!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wszystkie strony zwracają poprawne statusy - świetna robota!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {redirectPages.length > 10 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Redirects ({redirectPages.length})
            </CardTitle>
            <CardDescription>
              Strony z przekierowaniami 301/302
              {redirectPages.length > 10 && ' - rozważ redukcję łańcuchów redirectów'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redirectPages.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Źródło</th>
                        <th className="p-3 text-center font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Cel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirectPages.slice(0, 50).map((page: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <a href={page.url} target="_blank" className="font-mono text-xs text-blue-600 hover:underline max-w-sm truncate block">
                              {page.url}
                            </a>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{page.status_code}</Badge>
                          </td>
                          <td className="p-3">
                            <a href={page.redirect_url} target="_blank" className="font-mono text-xs text-blue-600 hover:underline max-w-sm truncate block">
                              {page.redirect_url || '-'}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-600">Brak redirectów!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wszystkie strony zwracają finalne URL-e bez przekierowań
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTechnicalSEO = (results: any) => {
    const tech = results?.crawl?.technical_seo || {}
    const pages = results?.crawl?.all_pages || []
    
    const missingCanonical = pages.filter((p: any) => !p.canonical && p.status_code === 200)
    const noindexPages = pages.filter((p: any) => p.meta_robots?.toLowerCase().includes('noindex'))
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${tech.missing_canonical > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {tech.missing_canonical || 0}
              </div>
              <div className="text-xs text-muted-foreground">Brak Canonical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tech.noindex_pages || 0}</div>
              <div className="text-xs text-muted-foreground">Strony NoIndex</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${tech.broken_links > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {tech.broken_links || 0}
              </div>
              <div className="text-xs text-muted-foreground">Broken Links</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tech.redirects || 0}</div>
              <div className="text-xs text-muted-foreground">Redirects</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {missingCanonical.length > 0 ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Strony Bez Canonical Tag ({missingCanonical.length})
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Canonical Tags ({missingCanonical.length})
                </>
              )}
            </CardTitle>
            <CardDescription>
              {missingCanonical.length} z {pages.length} stron ({((missingCanonical.length / pages.length) * 100).toFixed(1)}%)
              {missingCanonical.length > 0 
                ? ' - dodaj canonical tags aby uniknąć duplikacji treści'
                : ' - wszystkie strony mają canonical tag!'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missingCanonical.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {missingCanonical.slice(0, 100).map((page: any, i: number) => (
                  <div key={i} className="p-3 bg-muted rounded-md flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <a 
                        href={page.url} 
                        target="_blank"
                        className="font-mono text-xs text-blue-600 hover:underline block truncate"
                      >
                        {page.url}
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {page.title || 'Brak title'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {page.status_code}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-600">Wszystkie strony mają canonical tag!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Canonical tags pomagają wyszukiwarkom zidentyfikować główną wersję każdej strony
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Strony NoIndex ({noindexPages.length})
            </CardTitle>
            <CardDescription>
              Strony wykluzone z indeksowania - sprawdź czy to zamierzone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {noindexPages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {noindexPages.slice(0, 50).map((page: any, i: number) => (
                  <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-900">
                    <a 
                      href={page.url} 
                      target="_blank"
                      className="font-mono text-xs text-blue-600 hover:underline block break-all"
                    >
                      {page.url}
                    </a>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="destructive" className="text-xs">NoIndex</Badge>
                      <span className="text-xs text-muted-foreground">{page.meta_robots}</span>
                    </div>
                    {page.title && (
                      <p className="text-xs text-muted-foreground mt-1">{page.title}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-600">Brak stron NoIndex</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wszystkie strony są dostępne dla wyszukiwarek
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Completed State */}
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

          {/* Detailed Results */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 gap-1">
              <TabsTrigger value="overview">Podsumowanie</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="performance">Wydajność</TabsTrigger>
              <TabsTrigger value="content">Treść</TabsTrigger>
              <TabsTrigger value="pages">Wszystkie Strony</TabsTrigger>
              <TabsTrigger value="images">Obrazy</TabsTrigger>
              <TabsTrigger value="links">Linki</TabsTrigger>
              <TabsTrigger value="technical">Techniczne SEO</TabsTrigger>
              <TabsTrigger value="competitors">Konkurencja</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Executive Summary - 4 main scores */}
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
                    Strona wykazuje cechy biznesu lokalnego. Rekomendacje dla lokalnego SEO są dostępne w zakładce Treść.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
                 {renderSeoResults(audit.results)}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
                 {renderPerformanceResults(audit.results)}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
                 {renderContentResults(audit.results)}
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              {renderAllPages(audit.results)}
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              {renderImages(audit.results)}
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              {renderLinks(audit.results)}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              {renderTechnicalSEO(audit.results)}
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              {audit.competitors && audit.competitors.length > 0 ? (
                audit.competitors.map((competitor) => (
                  <Card key={competitor.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{competitor.url}</CardTitle>
                      <CardDescription>
                        <Badge variant={getStatusBadgeVariant(competitor.status)}>
                          {competitor.status}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {competitor.status === 'completed' ? (
                             renderSeoResults(competitor.results)
                         ) : (
                             <p className="text-muted-foreground">Brak wyników dla tego konkurenta.</p>
                         )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Brak dodanych konkurentów
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
