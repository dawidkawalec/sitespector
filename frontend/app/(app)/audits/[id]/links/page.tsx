'use client'

/**
 * Links Analysis Page
 * 
 * Displays comprehensive link analysis including:
 * - Summary metrics (internal, external, broken, redirects)
 * - Broken links list
 * - Redirect chains analysis
 * - External links list
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, XCircle, Search, Filter, ExternalLink, ArrowRight, Link2Off } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import type { Audit } from '@/lib/api'

export default function LinksPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [linkType, setLinkType] = useState('all')

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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych linków.</p>
      </div>
    )
  }

  const linksData = audit.results?.crawl?.links
  const allPages = audit.results?.crawl?.all_pages || []

  if (!linksData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych o linkach.</p>
      </div>
    )
  }

  // Filter pages for links view
  const filteredLinks = allPages.filter((page: any) => {
    const matchesSearch = page.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = linkType === 'all' || 
                       (linkType === 'broken' && page.status_code === 404) ||
                       (linkType === 'redirect' && page.status_code >= 300 && page.status_code < 400) ||
                       (linkType === 'external' && page.external_outlinks > 0)
    
    return matchesSearch && matchesType
  })

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Linków</h1>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linki Wewnętrzne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linksData.internal || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linki Zewnętrzne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linksData.external || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Broken Links (404)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(linksData.broken || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {linksData.broken || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Przekierowania</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(linksData.redirects || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {linksData.redirects || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Link Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Problemy z Linkami</CardTitle>
            <CardDescription>Wykryte błędy w strukturze linkowania</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(linksData.broken || 0) > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <Link2Off className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Wykryto niedziałające linki (404)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {linksData.broken} linków prowadzi do nieistniejących stron. Powoduje to frustrację użytkowników i marnuje "crawl budget" wyszukiwarek.
                    </p>
                  </div>
                </div>
              )}
              
              {(linksData.redirects || 0) > 5 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <ArrowRight className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Duża liczba przekierowań</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wykryto {linksData.redirects} przekierowań. Unikaj łańcuchów przekierowań, aby przyspieszyć ładowanie strony i poprawić przepływ link juice.
                    </p>
                  </div>
                </div>
              )}

              {linksData.broken === 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Brak niedziałających linków!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wszystkie linki wewnętrzne i zewnętrzne działają poprawnie.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Link Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Struktura Linkowania</CardTitle>
            <CardDescription>Rozkład linków przychodzących i wychodzących</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Linki Wewnętrzne</span>
                  <span className="font-bold">{linksData.internal || 0}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (linksData.internal / (linksData.internal + linksData.external || 1)) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Linki Zewnętrzne</span>
                  <span className="font-bold">{linksData.external || 0}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (linksData.external / (linksData.internal + linksData.external || 1)) * 100)}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                Zdrowy profil linkowania zazwyczaj zawiera przewagę linków wewnętrznych nad zewnętrznymi na pojedynczych podstronach.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Szczegóły Linkowania per Strona</CardTitle>
              <CardDescription>Analiza linków przychodzących i wychodzących dla każdej podstrony</CardDescription>
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
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="broken">Broken (404)</SelectItem>
                  <SelectItem value="redirect">Redirects</SelectItem>
                  <SelectItem value="external">Z zewn. linkami</SelectItem>
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
                  <TableHead className="w-[300px]">URL Strony</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inlinks</TableHead>
                  <TableHead>Outlinks</TableHead>
                  <TableHead>Ext. Outlinks</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.length > 0 ? (
                  filteredLinks.slice(0, 50).map((page: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium truncate max-w-[300px]" title={page.url}>
                        {page.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.status_code === 200 ? 'default' : page.status_code < 400 ? 'secondary' : 'destructive'}>
                          {page.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.inlinks || 0}</TableCell>
                      <TableCell>{page.outlinks || 0}</TableCell>
                      <TableCell>{page.external_outlinks || 0}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={page.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Brak stron spełniających kryteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
