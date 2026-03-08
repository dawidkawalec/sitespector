'use client'

/**
 * Links Analysis Page - 3-Phase System
 * 
 * Dane: Internal links, incoming links, raw data
 * Analiza: AI link insights
 * Plan: Actionable link tasks
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ExternalLink,
  ArrowRight,
  Link2Off,
  Info,
} from 'lucide-react'
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
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { CrawlDepthDistributionChart, InternalLinkDistributionChart, LinkAttributesPieChart } from '@/components/AuditCharts'
import { formatNumber } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoTooltip } from '@/components/ui/info-tooltip'

export default function LinksPage({ params }: { params: { id: string } }) {
  // Next.js requires useSearchParams() usage to be wrapped in a Suspense boundary.
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4" />}>
      <LinksPageInner params={params} />
    </Suspense>
  )
}

function InternalLinksTab({ linksData, allPages }: { linksData: any; allPages: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [linkType, setLinkType] = useState('all')

  const filteredLinks = allPages.filter((page: any) => {
    const matchesSearch = page.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = linkType === 'all' || 
                       (linkType === 'broken' && page.status_code === 404) ||
                       (linkType === 'redirect' && page.status_code >= 300 && page.status_code < 400) ||
                       (linkType === 'external' && page.external_outlinks > 0)
    return matchesSearch && matchesType
  })

  const columns = [
    { key: 'url', label: 'URL Strony', className: 'font-medium truncate', maxWidth: '300px' },
    { 
      key: 'status_code', 
      label: 'Status',
      render: (v: any) => (
        <Badge variant={v === 200 ? 'default' : v < 400 ? 'secondary' : 'destructive'}>
          {v}
        </Badge>
      )
    },
    { key: 'inlinks', label: 'Inlinks' },
    { key: 'outlinks', label: 'Outlinks' },
    { key: 'external_outlinks', label: 'Ext. Outlinks' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
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
                      {linksData.broken} linków prowadzi do nieistniejących stron.
                    </p>
                  </div>
                </div>
              )}
              {linksData.broken === 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Brak niedziałających linków!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col @md:flex-row @md:items-center justify-between gap-4">
            <CardTitle>Szczegóły Linkowania per Strona</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full @md:w-64">
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
          <DataExplorerTable
            data={filteredLinks}
            columns={columns}
            pageSize={20}
            exportFilename="linki_wewnetrzne"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function OrphanPagesTab({ allPages }: { allPages: any[] }) {
  const [scope, setScope] = useState<'indexable' | 'all'>('indexable')
  const orphanPages = (allPages || []).filter((page: any) => Number(page?.inlinks || 0) === 0)
  const filteredOrphans = orphanPages.filter((page: any) => {
    if (scope === 'all') return true
    return String(page?.indexability || '').toLowerCase() !== 'non-indexable'
  })
  const highValueOrphans = filteredOrphans.filter((page: any) => Number(page?.word_count || 0) > 300)

  const columns = [
    { key: 'url', label: 'URL', className: 'font-medium max-w-[320px]', maxWidth: '320px' },
    { key: 'title', label: 'Title', className: 'max-w-[260px]', maxWidth: '260px' },
    {
      key: 'word_count',
      label: 'Word Count',
      render: (value: any) => {
        const words = Number(value || 0)
        return (
          <div className="flex items-center gap-2">
            <span>{formatNumber(words)}</span>
            {words > 300 ? (
              <Badge variant="destructive" className="text-[9px] h-4 px-1">High Value</Badge>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'status_code',
      label: 'Status',
      render: (value: any) => (
        <Badge variant={Number(value) === 200 ? 'default' : 'destructive'}>
          {value || '—'}
        </Badge>
      ),
    },
    { key: 'indexability', label: 'Indexability' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orphan Pages</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(filteredOrphans.length)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Strony bez linków wewnętrznych.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Value Orphans</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(highValueOrphans.length)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Orphany z word_count &gt; 300.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Zakres</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={scope} onValueChange={(value: 'indexable' | 'all') => setScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indexable">Tylko indexable</SelectItem>
                <SelectItem value="all">Wszystkie</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Orphan Pages</CardTitle>
          <CardDescription>URL, tytuł i metryki stron bez inlinków.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={filteredOrphans}
            columns={columns}
            pageSize={20}
            exportFilename="linki_orphan_pages"
            searchPlaceholder="Szukaj orphan page..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InternalLinkDistributionTab({ allPages }: { allPages: any[] }) {
  const inlinksValues = (allPages || []).map((page: any) => Number(page?.inlinks || 0)).sort((a, b) => a - b)
  const depthValues = (allPages || []).map((page: any) => Number(page?.crawl_depth || 0))
  const totalPages = inlinksValues.length
  const meanInlinks = totalPages > 0 ? inlinksValues.reduce((sum, value) => sum + value, 0) / totalPages : 0
  const medianInlinks =
    totalPages === 0
      ? 0
      : totalPages % 2 === 0
      ? (inlinksValues[totalPages / 2 - 1] + inlinksValues[totalPages / 2]) / 2
      : inlinksValues[Math.floor(totalPages / 2)]
  const linkDeserts = inlinksValues.filter((value) => value === 0).length
  const deepPages = depthValues.filter((value) => value > 3).length
  const hasCrawlDepthData = depthValues.some((value) => value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Link deserts</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(linkDeserts)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Strony bez żadnego inlinka.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Średnia inlinków / strona</CardDescription>
            <CardTitle className="text-3xl font-bold">{meanInlinks.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mediana inlinków</CardDescription>
            <CardTitle className="text-3xl font-bold">{medianInlinks.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dystrybucja linkowania wewnętrznego</CardTitle>
          <CardDescription>Histogram: 0, 1-3, 4-10, 11-50, 50+ inlinków na stronę.</CardDescription>
        </CardHeader>
        <CardContent>
          <InternalLinkDistributionChart pages={allPages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rozkład głębokości crawla</CardTitle>
          <CardDescription>Ile stron jest na poziomach 1,2,3,4,5+ kliknięć od homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCrawlDepthData ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={deepPages > 0 ? 'destructive' : 'default'}>
                  Strony &gt; 3 kliknięcia: {formatNumber(deepPages)}
                </Badge>
              </div>
              <CrawlDepthDistributionChart pages={allPages} />
            </>
          ) : (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Uruchom nowy audyt, aby zobaczyć dane o głębokości crawla (`crawl_depth`).
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function IncomingLinksTab({ senuto, audit }: { senuto: any; audit: Audit }) {
  const [searchTerm, setSearchTerm] = useState('')
  const bl = senuto?.backlinks || {}
  const hasBacklinksData = Boolean(senuto?.backlinks)

  const stats = bl.statistics || {}
  const attrs = bl.link_attributes?.[audit.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')] || []
  const allLinks = bl.list || []
  const refDomains = bl.ref_domains || []
  const anchorsMerged = useMemo(() => {
    const merged = new Map<string, number>()
    const allAnchors = Object.values(bl.anchors || {}).flat() as any[]
    allAnchors.forEach((item: any) => {
      const anchorText = (item?.anchor || 'Brak tekstu').trim() || 'Brak tekstu'
      const count = Number(item?.count || 0)
      merged.set(anchorText, (merged.get(anchorText) || 0) + count)
    })
    return Array.from(merged.entries())
      .map(([anchor, count]) => ({ anchor, count }))
      .sort((a, b) => b.count - a.count)
  }, [bl.anchors])
  const tldDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      '.pl': 0,
      '.com': 0,
      '.org': 0,
      '.edu': 0,
      '.gov': 0,
      other: 0,
    }

    const localRefDomains = bl.ref_domains || []
    localRefDomains.forEach((row: any) => {
      const domain = String(row?.ref_domain || '').toLowerCase()
      const count = Number(row?.backlinks_count || 0)
      if (domain.endsWith('.pl')) buckets['.pl'] += count
      else if (domain.endsWith('.com')) buckets['.com'] += count
      else if (domain.endsWith('.org')) buckets['.org'] += count
      else if (domain.endsWith('.edu')) buckets['.edu'] += count
      else if (domain.endsWith('.gov')) buckets['.gov'] += count
      else buckets.other += count
    })

    return Object.entries(buckets)
      .map(([attribute, count]) => ({ attribute, count }))
      .filter((item) => item.count > 0)
  }, [bl.ref_domains])
  const anchorTypeDistribution = useMemo(() => {
    const urlHost = String(audit?.url || '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase()
    const brandToken = urlHost.split('.')[0]
    const genericWords = new Set([
      'kliknij tutaj',
      'kliknij',
      'sprawdz',
      'sprawdź',
      'read more',
      'learn more',
      'zobacz',
      'wiecej',
      'więcej',
      'link',
      'tutaj',
      'here',
      'more',
    ])
    const byType = new Map<string, { count: number; examples: string[] }>([
      ['brand', { count: 0, examples: [] }],
      ['exact-match', { count: 0, examples: [] }],
      ['naked-url', { count: 0, examples: [] }],
      ['generic', { count: 0, examples: [] }],
    ])

    const detectType = (rawAnchor: string) => {
      const anchor = rawAnchor.trim().toLowerCase()
      if (!anchor) return 'generic'
      if (anchor.includes('http://') || anchor.includes('https://') || anchor.includes('www.')) return 'naked-url'
      if (anchor.includes(urlHost) || (brandToken && anchor.includes(brandToken))) return 'brand'
      if (genericWords.has(anchor)) return 'generic'
      return 'exact-match'
    }

    anchorsMerged.forEach((row: any) => {
      const anchor = String(row?.anchor || '')
      const count = Number(row?.count || 0)
      const type = detectType(anchor)
      const target = byType.get(type)
      if (!target) return
      target.count += count
      if (anchor && target.examples.length < 5) {
        target.examples.push(anchor)
      }
    })

    const pieData = Array.from(byType.entries())
      .map(([attribute, payload]) => ({ attribute, count: payload.count }))
      .filter((item) => item.count > 0)
    const tableData = Array.from(byType.entries())
      .map(([type, payload]) => ({
        type,
        count: payload.count,
        examples: payload.examples.join(', ') || '—',
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)

    return { pieData, tableData }
  }, [anchorsMerged, audit?.url])
  const maxAnchorCount = anchorsMerged[0]?.count || 1
  const filteredLinks = allLinks.filter((l: any) => 
    String(l?.ref_url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l?.anchor || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { 
      key: 'ref_url', 
      label: 'Strona Linkująca', 
      className: 'max-w-[300px]',
      render: (_: any, l: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase">{l.ref_domain}</span>
          <a href={l.ref_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex items-center gap-1">
            {l.ref_url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )
    },
    { key: 'anchor', label: 'Anchor', className: 'text-xs italic' },
    { key: 'link_type', label: 'Typ', render: (v: any) => <Badge variant="outline" className="text-[10px]">{v}</Badge> },
    { 
      key: 'rel', 
      label: 'Rel', 
      render: (v: any) => (
        <div className="flex flex-wrap gap-1">
          {v?.map((r: string, idx: number) => (
            <Badge key={idx} variant={r === 'nofollow' ? 'destructive' : 'default'} className="text-[8px] h-4">
              {r}
            </Badge>
          ))}
        </div>
      )
    },
    { key: 'first_seen', label: 'Wykryto', className: 'text-right text-xs text-muted-foreground' },
  ]
  const refDomainColumns = [
    { key: 'ref_domain', label: 'Domena referujaca', className: 'max-w-[320px]' },
    { key: 'backlinks_count', label: 'Liczba backlinkow' },
  ]
  const anchorColumns = [
    { key: 'anchor', label: 'Anchor', className: 'max-w-[360px]' },
    { key: 'count', label: 'Wystapienia' },
  ]
  const anchorTypeColumns = [
    { key: 'type', label: 'Typ anchora', className: 'font-medium' },
    { key: 'count', label: 'Liczba', render: (value: any) => formatNumber(value) },
    { key: 'examples', label: 'Przykłady', className: 'max-w-[360px]', maxWidth: '360px' },
  ]

  if (!hasBacklinksData) return <p className="text-muted-foreground py-8 text-center">Brak danych o linkach przychodzących.</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
        {[
          { label: 'Wszystkie Linki', value: formatNumber(stats.backlinks_count), id: 'backlinks_count' },
          { label: 'Domeny Ref.', value: formatNumber(stats.domains_count), id: 'ref_domains' },
          { label: 'IP Referujące', value: formatNumber(stats.ips_count), id: 'ref_domains' },
          { label: 'Linki Follow', value: `${formatNumber((attrs.find((a:any)=>a.attribute==='follow')?.percent || 0) * 100)}%`, id: 'follow_ratio' },
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

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Atrybuty Linków</CardTitle></CardHeader>
          <CardContent><LinkAttributesPieChart attributes={attrs} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rozkład TLD backlinków</CardTitle>
            <CardDescription>.pl / .com / .org / .edu / .gov / other</CardDescription>
          </CardHeader>
          <CardContent><LinkAttributesPieChart attributes={tldDistribution} /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Typy anchorów</CardTitle>
            <CardDescription>brand / exact-match / naked-url / generic</CardDescription>
          </CardHeader>
          <CardContent><LinkAttributesPieChart attributes={anchorTypeDistribution.pieData} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Anchor Cloud (pełny)</CardTitle>
            <CardDescription>Top {Math.min(120, anchorsMerged.length)} z {formatNumber(anchorsMerged.length)} anchorow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 max-h-[240px] overflow-y-auto pr-1">
              {anchorsMerged.slice(0, 120).map((anchor) => (
                <span
                  key={`${anchor.anchor}-${anchor.count}`}
                  className="inline-flex items-center rounded-md border bg-accent/5 px-2 py-1 leading-none"
                  style={{ fontSize: `${Math.max(11, Math.min(24, 10 + (anchor.count / maxAnchorCount) * 14))}px` }}
                  title={`${anchor.anchor} (${anchor.count})`}
                >
                  {anchor.anchor}
                </span>
              ))}
            </div>
            <DataExplorerTable
              data={anchorsMerged}
              columns={anchorColumns}
              pageSize={10}
              exportFilename="linki_anchory_pelne"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klasyfikacja typów anchorów</CardTitle>
          <CardDescription>Podział anchor textów na 4 klasy z przykładami.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={anchorTypeDistribution.tableData}
            columns={anchorTypeColumns}
            pageSize={10}
            exportFilename="linki_anchory_typy"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domeny Referujace (pełna tabela)</CardTitle>
          <CardDescription>Wszystkie rekordy `senuto.backlinks.ref_domains`</CardDescription>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={refDomains}
            columns={refDomainColumns}
            pageSize={20}
            exportFilename="linki_ref_domains_pelne"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col @md:flex-row @md:items-center justify-between gap-4">
            <CardTitle>Lista Linków Przychodzących</CardTitle>
            <div className="relative w-full @md:w-64">
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
          <DataExplorerTable
            data={filteredLinks}
            columns={columns}
            pageSize={20}
            exportFilename="linki_przychodzace"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function RawDataTab({ audit }: { audit: Audit }) {
  const [activeDataset, setActiveDataset] = useState('internal')
  const rawTabs = audit.results?.crawl?.sf_raw_tabs || {}
  const senutoBl = audit.results?.senuto?.backlinks || {}

  const datasets: Record<string, { label: string; data: any[] }> = {
    internal: { label: 'Wszystkie (Crawl)', data: rawTabs.internal_all || audit.results?.crawl?.all_pages || [] },
    backlinks: { label: 'Backlinki (Full)', data: senutoBl.list || [] },
    anchors: { label: 'Anchory (Full)', data: Object.values(senutoBl.anchors || {}).flat() },
    domains: { label: 'Domeny (Full)', data: senutoBl.ref_domains || [] },
  }

  const currentData = datasets[activeDataset].data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center overflow-x-auto">
        <Tabs value={activeDataset} onValueChange={setActiveDataset}>
          <TabsList>
            {Object.entries(datasets).map(([key, ds]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {ds.label} <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1">{ds.data.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DataExplorerTable
        data={currentData}
        columns={currentData.length > 0 ? Object.keys(currentData[0]).slice(0, 8).map(k => ({ key: k, label: k })) : []}
        pageSize={25}
        exportFilename={`linki_raw_${activeDataset}`}
      />
    </div>
  )
}

function LinksPageInner({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('internal')
  const [mode, setMode] = useAuditMode('data')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'incoming' || tab === 'internal' || tab === 'orphan' || tab === 'distribution' || tab === 'raw') {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const { data: audit, isLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as any
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'links'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'links' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.links

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (error) {
      toast.error('Nie udało się zaktualizować zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (error) {
      toast.error('Nie udało się zapisać notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczęto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udało się uruchomić generowania planu')
    },
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
  const orphanCount = allPages.filter((page: any) => Number(page?.inlinks || 0) === 0).length
  const senuto = audit.results?.senuto
  const hasAiData = !!(audit?.results?.ai_contexts?.links || audit?.results?.ai_contexts?.backlinks)

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Linków</h1>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
        hasAiData={hasAiData}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="internal">
              Wewnętrzne
              <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">
                {formatNumber(allPages.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Przychodzące
              <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">
                {formatNumber(senuto?.backlinks?.list?.length || 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="orphan">
              Orphan Pages
              <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">
                {formatNumber(orphanCount)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="distribution">Dystrybucja</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="pt-6">
            <InternalLinksTab linksData={linksData} allPages={allPages} />
          </TabsContent>

          <TabsContent value="incoming" className="pt-6">
            <IncomingLinksTab senuto={senuto} audit={audit!} />
          </TabsContent>

          <TabsContent value="orphan" className="pt-6">
            <OrphanPagesTab allPages={allPages} />
          </TabsContent>

          <TabsContent value="distribution" className="pt-6">
            <InternalLinkDistributionTab allPages={allPages} />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab audit={audit!} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="links"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="links"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          executionPlanStatus={audit?.execution_plan_status ?? null}
          isGeneratingPlan={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
          onGeneratePlan={() => generatePlanMutation.mutate()}
        />
      )}
    </div>
  )
}
