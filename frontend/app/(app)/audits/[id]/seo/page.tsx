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
import { Loader2, AlertCircle, CheckCircle2, XCircle, Info, ExternalLink, Download, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { PageStatusChart } from '@/components/AuditCharts'
import type { Audit } from '@/lib/api'

export default function SeoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analiza SEO</h1>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportuj CSV
        </Button>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strony</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crawl.pages_crawled || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Przeskanowanych stron</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Błędy 404</CardTitle>
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
            <CardTitle className="text-sm font-medium">Bez Canonical</CardTitle>
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
            <div className="space-y-4">
              {crawl.technical_seo?.broken_links > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Wykryto niedziałające linki (404)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Znaleziono {crawl.technical_seo.broken_links} linków prowadzących do nieistniejących stron.
                    </p>
                  </div>
                </div>
              )}
              
              {crawl.technical_seo?.missing_canonical > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Brak tagów canonical</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {crawl.technical_seo.missing_canonical} stron nie posiada tagu rel="canonical".
                    </p>
                  </div>
                </div>
              )}

              {crawl.technical_seo?.noindex_pages > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Strony wykluczone z indeksowania</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {crawl.technical_seo.noindex_pages} stron posiada tag noindex.
                    </p>
                  </div>
                </div>
              )}

              {crawl.technical_seo?.redirects > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <ExternalLink className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Przekierowania</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wykryto {crawl.technical_seo.redirects} przekierowań na stronie.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                  <TableHead>Word Count</TableHead>
                  <TableHead>Indexability</TableHead>
                  <TableHead>Canonical</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.length > 0 ? (
                  filteredPages.slice(0, 50).map((page: any, idx: number) => (
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Brak wyników dla wybranych filtrów.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredPages.length > 50 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Pokazano 50 z {filteredPages.length} stron. Użyj exportu CSV aby pobrać pełną listę.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Homepage Detail (Legacy view enriched) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Struktura Nagłówków (Strona Główna)</CardTitle>
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
            <CardTitle>Meta Tagi (Strona Główna)</CardTitle>
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
