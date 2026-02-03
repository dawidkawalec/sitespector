'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { auditsAPI, isAuthenticated, CreateAuditData } from '@/lib/api'
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

  // Check authentication (client-side only)
  useEffect(() => {
    const authStatus = isAuthenticated()
    setIsAuth(authStatus)
    if (!authStatus) {
      router.push('/login')
    }
  }, [router])

  // Fetch audit details
  const {
    data: audit,
    isLoading,
    refetch,
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
    mutationFn: (data: CreateAuditData) => auditsAPI.create(data),
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
      // Direct download via browser to handle headers better
      // We need to get the token
      const token = localStorage.getItem('access_token')
      if (!token) {
          console.error('No access token found')
          return
      }

      // Using fetch to get blob with auth header
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/audits/${params.id}/raw`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
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
              <Card>
                  <CardHeader>
                      <CardTitle>Analiza Treści</CardTitle>
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
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Czytelność</div>
                              <div className="text-2xl font-bold mt-1">{content.readability_score || 0}/100</div>
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
    const [sortBy, setSortBy] = useState('url')
    const [filterStatus, setFilterStatus] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const PER_PAGE = 50
    
    if (pages.length === 0) {
      return <p className="text-muted-foreground">Brak danych o stronach.</p>
    }
    
    // Filter by status
    const filtered = pages.filter((p: any) => {
      if (filterStatus === 'all') return true
      return p.status_code.toString() === filterStatus
    })
    
    // Sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortBy === 'url') return a.url.localeCompare(b.url)
      if (sortBy === 'response_time') return b.response_time - a.response_time
      if (sortBy === 'word_count') return b.word_count - a.word_count
      if (sortBy === 'size') return b.size_bytes - a.size_bytes
      return 0
    })
    
    // Paginate
    const totalPages = Math.ceil(sorted.length / PER_PAGE)
    const paginated = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Wszystkie Strony ({pages.length})</CardTitle>
            <CardDescription>Kompletna lista przeskanowanych stron z szczegółami</CardDescription>
            <div className="flex gap-4 mt-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
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
              
              <Select value={sortBy} onValueChange={setSortBy}>
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
                      <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1 max-w-md truncate"
                          >
                            <span className="truncate">{page.url}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                Strona {currentPage} z {totalPages} (wyświetlono {paginated.length} z {filtered.length})
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Poprzednia
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
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
    const [filterAlt, setFilterAlt] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const PER_PAGE = 50
    
    if (images.length === 0) {
      return <p className="text-muted-foreground">Brak danych o obrazach.</p>
    }
    
    // Filter
    const filtered = images.filter((img: any) => {
      if (filterAlt === 'all') return true
      if (filterAlt === 'with') return !!img.alt_text
      if (filterAlt === 'without') return !img.alt_text
      return true
    })
    
    // Paginate
    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
    
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
              <Select value={filterAlt} onValueChange={setFilterAlt}>
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
                Strona {currentPage} z {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Poprzednia
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
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
        
        {brokenPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Broken Links - Wymagają Naprawy! ({brokenPages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
        
        {redirectPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Redirects ({redirectPages.length})</CardTitle>
              <CardDescription>Strony z przekierowaniami 301/302</CardDescription>
            </CardHeader>
            <CardContent>
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
                          <td className="p-3 font-mono text-xs max-w-sm truncate">{page.url}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{page.status_code}</Badge>
                          </td>
                          <td className="p-3 font-mono text-xs max-w-sm truncate">
                            {page.redirect_url || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
        
        {missingCanonical.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strony Bez Canonical Tag ({missingCanonical.length})</CardTitle>
              <CardDescription>Każda strona powinna mieć tag canonical aby uniknąć duplikacji</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">URL</th>
                        <th className="p-3 text-center font-medium">Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingCanonical.slice(0, 50).map((page: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-mono text-xs max-w-lg truncate">{page.url}</td>
                          <td className="p-3 max-w-md truncate">{page.title || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {noindexPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strony NoIndex ({noindexPages.length})</CardTitle>
              <CardDescription>Sprawdź czy te strony mają być wykluzone z indeksowania</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {noindexPages.slice(0, 20).map((page: any, i: number) => (
                  <div key={i} className="p-3 bg-muted rounded-md">
                    <div className="font-mono text-xs text-blue-600">{page.url}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Robots: {page.meta_robots}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
                <Button variant="secondary" onClick={downloadRawData} title="Pobierz surowe dane (ZIP)">
                  <FileJson className="mr-2 h-4 w-4" />
                  Raw Data
                </Button>
              </>
            )}
            
             <Button variant="outline" onClick={() => refetch()} disabled={isLoading} title="Odśwież status">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" onClick={handleRetry} title="Uruchom ponownie audyt">
                <RefreshCw className="h-4 w-4 mr-2" /> Restart
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="icon">
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
              <Card>
                <CardHeader>
                  <CardTitle>Podsumowanie audytu</CardTitle>
                  <CardDescription>
                    Kluczowe informacje i rekomendacje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {audit.is_local_business && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          🏢 Wykryto lokalną firmę
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Strona wykazuje cechy biznesu lokalnego. Rekomendacje dla lokalnego SEO są dostępne w zakładce SEO.
                        </p>
                      </div>
                    )}
                    
                    {audit.results?.content_analysis?.summary && (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-2">Wnioski z analizy AI</h4>
                            <p>{audit.results.content_analysis.summary}</p>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
