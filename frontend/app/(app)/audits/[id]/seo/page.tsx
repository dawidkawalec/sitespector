'use client'

/**
 * SEO Analysis Page
 * 
 * Displays comprehensive SEO metrics including:
 * - Meta tags (title, description)
 * - Header structure (H1 tags)
 * - Technical metrics (status code, load time, word count, page size)
 * - All Pages table (Screaming Frog view)
 * - Status Code distribution chart
 * - Technical SEO panel
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Lightbulb,
  Sparkles
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PageStatusChart } from '@/components/AuditCharts'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { Audit } from '@/lib/api'
import Link from 'next/link'

export default function SeoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingFix, setLoadingFix] = useState<string | null>(null)
  const [fixSuggestions, setFixSuggestions] = useState<Record<string, any>>({})
  const pageSize = 20

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

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych SEO.</p>
      </div>
    )
  }

  const crawl = audit.results?.crawl
  if (!crawl) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych z crawlowania.</p>
      </div>
    )
  }

  const allPages = crawl.all_pages || []
  
  // Filter pages
  const filteredPages = allPages.filter((page: any) => {
    const matchesSearch = page.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === '404' && page.status_code === 404) ||
                         (statusFilter === '3xx' && page.status_code >= 300 && page.status_code < 400) ||
                         (statusFilter === '200' && page.status_code === 200) ||
                         (statusFilter === 'noindex' && page.indexability === 'non-indexable')
    
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalFiltered = filteredPages.length
  const totalPages = Math.ceil(totalFiltered / pageSize)
  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const exportToCSV = () => {
    const headers = ['URL', 'Title', 'Title Length', 'Meta Description', 'Description Length', 'Status Code', 'Word Count', 'Indexability']
    const rows = allPages.map((p: any) => [
      p.url,
      p.title || '',
      p.title_length || 0,
      p.meta_description || '',
      p.meta_description_length || 0,
      p.status_code || '',
      p.word_count || 0,
      p.indexability || ''
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `audit_${params.id}_pages.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGetFixSuggestion = async (issueType: string, urls: string[]) => {
    if (loadingFix) return
    setLoadingFix(issueType)
    try {
      const suggestion = await auditsAPI.getFixSuggestion(params.id, issueType, urls)
      setFixSuggestions(prev => ({ ...prev, [issueType]: suggestion }))
      toast.success('Wygenerowano sugestię AI')
    } catch (error) {
      console.error('Error fetching fix suggestion:', error)
      toast.error('Nie udało się wygenerować sugestii AI')
    } finally {
      setLoadingFix(null)
    }
  }

  const renderFixSuggestion = (issueType: string, urls: string[]) => {
    const suggestion = fixSuggestions[issueType]
    const isLoading = loadingFix === issueType

    return (
      <div className="mt-4 space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Jak to naprawić?
          </h4>
          {!suggestion && !isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleGetFixSuggestion(issueType, urls)}
              className="text-xs h-7"
            >
              <Sparkles className="mr-2 h-3 w-3" /> Wygeneruj sugestię AI
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Generowanie sugestii przez AI...
          </div>
        )}

        {suggestion && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
              <p className="font-semibold text-primary mb-1">Dlaczego to ważne?</p>
              <p>{suggestion.importance}</p>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Kroki naprawcze:</p>
              <ul className="list-decimal list-inside text-xs space-y-1 text-muted-foreground">
                {suggestion.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="text-[10px] p-2 bg-accent/30 rounded italic">
              <span className="font-bold not-italic">Weryfikacja:</span> {suggestion.verification}
            </div>

            {suggestion.ai_tip && (
              <div className="flex gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-100 dark:border-yellow-900/30 text-[10px]">
                <Sparkles className="h-3 w-3 text-yellow-600 shrink-0" />
                <p><span className="font-bold">AI Tip:</span> {suggestion.ai_tip}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Dotknięte strony (top 5):</p>
          <div className="flex flex-col gap-1">
            {urls.slice(0, 5).map((url, i) => (
              <div key={i} className="text-[10px] truncate p-1 bg-accent/20 rounded flex items-center justify-between group">
                <span className="truncate">{url}</span>
                <Link href={`/audits/${params.id}/pages/${allPages.findIndex((p: any) => p.url === url)}`}>
                  <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100">
                    <Eye className="h-2 w-2" />
                  </Button>
                </Link>
              </div>
            ))}
            {urls.length > 5 && (
              <p className="text-[9px] text-muted-foreground italic">...i {urls.length - 5} więcej. Filtruj tabelę poniżej aby zobaczyć wszystkie.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          <span className="text-line">Analiza SEO</span>
        </h1>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportuj CSV
        </Button>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Strony
              <InfoTooltip id="word_count" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crawl.pages_crawled || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Przeskanowanych stron</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Błędy 404
              <InfoTooltip id="broken_links" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(crawl.technical_seo?.broken_links || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {crawl.technical_seo?.broken_links || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Niedziałające linki</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Bez Canonical
              <InfoTooltip id="canonical" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(crawl.technical_seo?.missing_canonical || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {crawl.technical_seo?.missing_canonical || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Brak tagu canonical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sitemap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {crawl.has_sitemap ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-bold">{crawl.has_sitemap ? 'Wykryto' : 'Brak'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status mapy strony</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technical SEO Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Problemy Techniczne</CardTitle>
            <CardDescription>Krytyczne błędy i ostrzeżenia SEO</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {crawl.technical_seo?.broken_links > 0 && (
                <AccordionItem value="broken-links" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Wykryto niedziałające linki (404)</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Znaleziono {crawl.technical_seo.broken_links} linków prowadzących do nieistniejących stron.
                      </p>
                      <AccordionContent>
                        {renderFixSuggestion('broken_links', allPages.filter((p: any) => p.status_code >= 400).map((p: any) => p.url))}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}
              
              {crawl.technical_seo?.missing_canonical > 0 && (
                <AccordionItem value="missing-canonical" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Brak tagów canonical</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {crawl.technical_seo.missing_canonical} stron nie posiada tagu rel="canonical".
                      </p>
                      <AccordionContent>
                        {renderFixSuggestion('missing_canonical', allPages.filter((p: any) => !p.canonical).map((p: any) => p.url))}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}

              {crawl.technical_seo?.noindex_pages > 0 && (
                <AccordionItem value="noindex-pages" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Strony wykluczone z indeksowania</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {crawl.technical_seo.noindex_pages} stron posiada tag noindex.
                      </p>
                      <AccordionContent>
                        {renderFixSuggestion('noindex_pages', allPages.filter((p: any) => p.indexability === 'non-indexable').map((p: any) => p.url))}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}

              {crawl.technical_seo?.redirects > 0 && (
                <AccordionItem value="redirects" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <ExternalLink className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Przekierowania</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wykryto {crawl.technical_seo.redirects} przekierowań na stronie.
                      </p>
                      <AccordionContent>
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Ostatnie przekierowania:</p>
                          {allPages.filter((p: any) => p.status_code >= 300 && p.status_code < 400).slice(0, 5).map((p: any, i: number) => (
                            <div key={i} className="text-[10px] p-2 bg-accent/20 rounded border">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="h-4 text-[8px]">{p.status_code}</Badge>
                                <span className="truncate font-medium">{p.url}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                                <ChevronRight className="h-2 w-2" />
                                <span className="truncate">{p.redirect_url || 'Unknown'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>

        {/* Status Code Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Statusy HTTP</CardTitle>
            <CardDescription>Rozkład kodów odpowiedzi serwera</CardDescription>
          </CardHeader>
          <CardContent>
            <PageStatusChart statusData={crawl.pages_by_status || {}} />
          </CardContent>
        </Card>
      </div>

      {/* All Pages Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Wszystkie Strony</CardTitle>
              <CardDescription>Szczegółowa lista wszystkich wykrytych adresów URL (Screaming Frog View)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj URL..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtruj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="200">200 OK</SelectItem>
                  <SelectItem value="3xx">3xx Przekierowania</SelectItem>
                  <SelectItem value="404">404 Błędy</SelectItem>
                  <SelectItem value="noindex">Noindex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Word Count
                      <InfoTooltip id="word_count" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Indexability
                      <InfoTooltip id="indexability" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Canonical
                      <InfoTooltip id="canonical" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPages.length > 0 ? (
                  paginatedPages.map((page: any, idx: number) => {
                    const actualIdx = allPages.findIndex((p: any) => p.url === page.url)
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium truncate max-w-[300px]" title={page.url}>
                          {page.url}
                        </TableCell>
                        <TableCell>
                          <Badge variant={page.status_code === 200 ? 'default' : page.status_code < 400 ? 'secondary' : 'destructive'}>
                            {page.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={page.title}>
                          {page.title || <span className="text-red-500 text-xs italic">Brak tytułu</span>}
                        </TableCell>
                        <TableCell>{page.word_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant={page.indexability === 'indexable' ? 'outline' : 'destructive'}>
                            {page.indexability}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={page.canonical}>
                          {page.canonical ? 'Tak' : <span className="text-yellow-600">Brak</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/audits/${params.id}/pages/${actualIdx}`}>
                            <Button variant="ghost" size="icon" title="Szczegóły strony">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Brak wyników dla wybranych filtrów.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-xs text-muted-foreground">
                Pokazano {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalFiltered)} z {totalFiltered} stron
              </p>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-medium">Strona</span>
                  <Input 
                    className="h-8 w-12 text-center text-xs px-1" 
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 1 && val <= totalPages) {
                        setCurrentPage(val)
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">z {totalPages}</span>
                </div>

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Homepage Detail (Legacy view enriched) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Struktura Nagłówków (Strona Główna)
              <InfoTooltip id="h1_tag" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Nagłówki H1</p>
                {crawl.h1_tags && crawl.h1_tags.length > 0 ? (
                  <div className="space-y-2">
                    {crawl.h1_tags.map((h1: string, i: number) => (
                      <div key={i} className="p-2 bg-accent/30 rounded text-sm border-l-2 border-primary">{h1}</div>
                    ))}
                    {crawl.h1_tags.length > 1 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Wykryto więcej niż jeden nagłówek H1!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 rounded text-sm border-l-2 border-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Brak nagłówka H1
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Meta Tagi (Strona Główna)
              <div className="flex gap-2">
                <InfoTooltip id="meta_title" />
                <InfoTooltip id="meta_description" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Title Tag</p>
                <Badge variant={(crawl.title?.length || 0) < 30 || (crawl.title?.length || 0) > 70 ? 'destructive' : 'default'}>
                  {crawl.title?.length || 0} znaków
                </Badge>
              </div>
              <div className="p-3 bg-accent/30 rounded text-sm border font-medium">
                {crawl.title || <span className="text-red-500 italic">Brak tytułu</span>}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Meta Description</p>
                <Badge variant={(crawl.meta_desc?.length || 0) < 120 || (crawl.meta_desc?.length || 0) > 170 ? 'destructive' : 'default'}>
                  {crawl.meta_desc?.length || 0} znaków
                </Badge>
              </div>
              <div className="p-3 bg-accent/30 rounded text-sm border leading-relaxed">
                {crawl.meta_desc || <span className="text-red-500 italic">Brak opisu meta</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
