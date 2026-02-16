'use client'

/**
 * Crawl Data Page (Screaming Frog)
 * 
 * Displays all 10 raw Screaming Frog tabs as browsable,
 * searchable, paginated tables with CSV/JSON export.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Bug, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import type { Audit } from '@/lib/api'

// Tab configurations for SF raw data
const SF_TABS: Record<string, { label: string; description: string; columns: any[] }> = {
  internal_all: {
    label: 'Internal (All)',
    description: 'Wszystkie wewnętrzne strony znalezione podczas crawlowania',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'Status Code', label: 'Status', render: (v: any) => v ? <Badge variant={v === 200 ? 'default' : v >= 400 ? 'destructive' : 'secondary'}>{v}</Badge> : '—' },
      { key: 'Title 1', label: 'Title', maxWidth: '200px', className: 'truncate' },
      { key: 'Meta Description 1', label: 'Meta Desc', maxWidth: '200px', className: 'truncate' },
      { key: 'Word Count', label: 'Słowa' },
      { key: 'Indexability', label: 'Indexability' },
      { key: 'Content Type', label: 'Content Type' },
    ],
  },
  response_codes: {
    label: 'Response Codes',
    description: 'Kody odpowiedzi HTTP dla wszystkich zasobów',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '350px', className: 'font-medium truncate' },
      { key: 'Status Code', label: 'Status', render: (v: any) => v ? <Badge variant={v === 200 ? 'default' : v >= 400 ? 'destructive' : 'secondary'}>{v}</Badge> : '—' },
      { key: 'Status', label: 'Status Text' },
      { key: 'Content Type', label: 'Content Type' },
      { key: 'Size (Bytes)', label: 'Rozmiar (B)' },
    ],
  },
  page_titles: {
    label: 'Page Titles',
    description: 'Tytuły stron i ich długości',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'Title 1', label: 'Title', maxWidth: '250px', className: 'truncate' },
      { key: 'Title 1 Length', label: 'Długość' },
      { key: 'Title 1 Pixel Width', label: 'Szer. px' },
    ],
  },
  meta_descriptions: {
    label: 'Meta Descriptions',
    description: 'Opisy meta i ich długości',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'Meta Description 1', label: 'Meta Description', maxWidth: '300px', className: 'truncate' },
      { key: 'Meta Description 1 Length', label: 'Długość' },
      { key: 'Meta Description 1 Pixel Width', label: 'Szer. px' },
    ],
  },
  h1_all: {
    label: 'H1',
    description: 'Nagłówki H1 na stronach',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'H1-1', label: 'H1', maxWidth: '300px', className: 'truncate' },
      { key: 'H1-1 Length', label: 'Długość' },
    ],
  },
  h2_all: {
    label: 'H2',
    description: 'Nagłówki H2 na stronach',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'H2-1', label: 'H2', maxWidth: '300px', className: 'truncate' },
      { key: 'H2-1 Length', label: 'Długość' },
    ],
  },
  images_all: {
    label: 'Images',
    description: 'Wszystkie obrazy znalezione na stronie',
    columns: [
      { key: 'Address', label: 'URL obrazu', maxWidth: '350px', className: 'font-medium truncate' },
      { key: 'Alt Text 1', label: 'Alt Text', maxWidth: '200px', className: 'truncate' },
      { key: 'Size (Bytes)', label: 'Rozmiar (B)' },
      { key: 'Status Code', label: 'Status' },
    ],
  },
  canonicals: {
    label: 'Canonicals',
    description: 'Tagi canonical na stronach',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'Canonical Link Element 1', label: 'Canonical URL', maxWidth: '300px', className: 'truncate' },
    ],
  },
  directives: {
    label: 'Directives',
    description: 'Dyrektywy robots (noindex, nofollow itp.)',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'Meta Robots 1', label: 'Meta Robots', maxWidth: '200px' },
      { key: 'X-Robots-Tag 1', label: 'X-Robots-Tag', maxWidth: '200px' },
      { key: 'Indexability', label: 'Indexability' },
    ],
  },
  hreflang: {
    label: 'Hreflang',
    description: 'Tagi hreflang dla wersji językowych',
    columns: [
      { key: 'Address', label: 'URL', maxWidth: '300px', className: 'font-medium truncate' },
      { key: 'hreflang 1', label: 'Hreflang', maxWidth: '300px', className: 'truncate' },
    ],
  },
}

export default function CrawlDataPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

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

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const rawTabs = audit.results?.crawl?.sf_raw_tabs || {}
  const availableTabs = Object.keys(rawTabs).filter(k => rawTabs[k] && rawTabs[k].length > 0)

  // Also include all_pages as internal_all if sf_raw_tabs doesn't have it
  if (!rawTabs.internal_all && audit.results?.crawl?.all_pages) {
    rawTabs.internal_all = audit.results.crawl.all_pages
    if (!availableTabs.includes('internal_all')) {
      availableTabs.unshift('internal_all')
    }
  }

  const hasAiData = !!(audit.results?.ai_contexts?.crawl || audit.results?.tech_stack || audit.results?.security)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="crawl" audit={audit} />}
      aiPanelTitle="AI: Dane techniczne"
      hasAiData={hasAiData}
      isAiLoading={audit.ai_status === 'processing'}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Screaming Frog</h1>
          <p className="text-sm text-muted-foreground">Surowe dane z crawlowania ({availableTabs.length} tabel)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Stron</p>
            <p className="text-2xl font-bold">{audit.results?.crawl?.pages_crawled || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tabel</p>
            <p className="text-2xl font-bold">{availableTabs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Błędy 404</p>
            <p className="text-2xl font-bold text-red-600">{audit.results?.crawl?.technical_seo?.broken_links || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Przekierowania</p>
            <p className="text-2xl font-bold text-yellow-600">{audit.results?.crawl?.technical_seo?.redirects || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with tables */}
      {availableTabs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue={availableTabs[0]} className="w-full">
              <div className="border-b px-4 pt-4 overflow-x-auto">
                <TabsList className="h-auto flex-wrap">
                  {availableTabs.map(tabKey => {
                    const config = SF_TABS[tabKey]
                    const count = rawTabs[tabKey]?.length || 0
                    return (
                      <TabsTrigger key={tabKey} value={tabKey} className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {config?.label || tabKey}
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{count}</Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {availableTabs.map(tabKey => {
                const config = SF_TABS[tabKey]
                const tabData = rawTabs[tabKey] || []

                // Auto-detect columns if no config
                const columns = config?.columns || (tabData.length > 0
                  ? Object.keys(tabData[0]).slice(0, 8).map(k => ({ key: k, label: k }))
                  : [])

                return (
                  <TabsContent key={tabKey} value={tabKey} className="p-4 mt-0">
                    <DataExplorerTable
                      data={tabData}
                      columns={columns}
                      description={config?.description}
                      exportFilename={`sf_${tabKey}_${params.id}`}
                      maxDisplayRows={5000}
                      pageSize={25}
                      searchPlaceholder="Szukaj URL, tytuł..."
                    />
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Brak surowych danych Screaming Frog.</p>
            <p className="text-xs text-muted-foreground mt-1">Dane raw tabs mogą nie być dostępne dla starszych audytów.</p>
          </CardContent>
        </Card>
      )}
    </AuditPageLayout>
  )
}
