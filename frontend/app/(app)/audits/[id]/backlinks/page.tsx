'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, Share2, Link2, ExternalLink, AlertCircle, 
  Search, ChevronLeft, ChevronRight, Anchor, Globe2, 
  ShieldCheck, ShieldAlert, Info
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { LinkAttributesPieChart } from '@/components/AuditCharts'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import type { Audit } from '@/lib/api'

export default function BacklinksPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

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

  const senuto = audit?.results?.senuto
  if (!senuto || !senuto.backlinks) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak danych o linkach</h1>
        <p className="text-muted-foreground">Analiza backlinków nie została przeprowadzona dla tego audytu.</p>
      </div>
    )
  }

  const bl = senuto.backlinks
  const stats = bl.statistics || {}
  const attrs = bl.link_attributes?.[audit?.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')] || []
  
  const allLinks = bl.list || []
  const filteredLinks = allLinks.filter((l: any) => 
    l.ref_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.anchor?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const paginatedLinks = filteredLinks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredLinks.length / pageSize)
  const hasAiData = !!(audit?.results?.ai_contexts?.backlinks)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="backlinks" audit={audit!} />}
      aiPanelTitle="AI: Backlinki"
      hasAiData={hasAiData}
    >
      <div className="flex items-center gap-3">
        <Share2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Profil Linkowy</h1>
          <p className="text-sm text-muted-foreground">Dane z platformy Senuto • Ostatnia aktualizacja: {new Date(senuto.fetched_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Wszystkie Linki', value: stats.backlinks_count?.toLocaleString(), id: 'backlinks_count' },
          { label: 'Domeny Ref.', value: stats.domains_count?.toLocaleString(), id: 'ref_domains' },
          { label: 'IP Referujące', value: stats.ips_count?.toLocaleString(), id: 'ref_domains' },
          { label: 'Linki Follow', value: `${Math.round((attrs.find((a:any)=>a.attribute==='follow')?.percent || 0) * 100)}%`, id: 'follow_ratio' },
        ].map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {card.label}
                <InfoTooltip id={card.id as any} />
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{card.value || 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attributes Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Atrybuty Linków
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LinkAttributesPieChart attributes={attrs} />
          </CardContent>
        </Card>

        {/* Top Anchors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Anchor className="h-4 w-4 text-primary" />
              Najczęstsze Anchory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const domainKey = Object.keys(bl.anchors || {})[0];
                const anchors = domainKey ? bl.anchors[domainKey] : [];
                return (anchors || []).slice(0, 6).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded border bg-accent/5">
                    <span className="truncate font-medium italic">"{a.anchor || 'Brak tekstu'}"</span>
                    <Badge variant="secondary">{a.count}</Badge>
                  </div>
                ));
              })()}
              {(!bl.anchors || Object.keys(bl.anchors).length === 0) && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Brak danych o anchorach.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Ref Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe2 className="h-4 w-4 text-primary" />
              Najsilniejsze Domeny
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bl.ref_domains || []).slice(0, 6).map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded border bg-accent/5">
                  <span className="truncate font-medium">{d.ref_domain}</span>
                  <span className="text-muted-foreground">{d.backlinks_count} linków</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backlinks Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Lista Linków Przychodzących
              </CardTitle>
              <CardDescription>Szczegółowy wykaz ostatnich wykrytych backlinków</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj w linkach..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strona Linkująca</TableHead>
                  <TableHead>Anchor</TableHead>
                  <TableHead className="text-center">Typ</TableHead>
                  <TableHead className="text-center">Rel</TableHead>
                  <TableHead className="text-right">Wykryto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLinks.map((l: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[300px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{l.ref_domain}</span>
                        <a href={l.ref_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex items-center gap-1">
                          {l.ref_url} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs italic">"{l.anchor}"</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">{l.link_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {l.rel.map((r: string, idx: number) => (
                          <Badge key={idx} variant={r === 'nofollow' ? 'destructive' : 'default'} className="text-[8px] h-4">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{l.first_seen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground">Strona {currentPage} z {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuditPageLayout>
  )
}
