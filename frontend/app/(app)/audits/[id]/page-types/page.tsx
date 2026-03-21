'use client'

/**
 * Page Types Overview
 *
 * Shows pages grouped by auto-detected type (product, category, blog, etc.)
 * with stats per type and drill-down into filtered views.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, LayoutGrid, ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import { getPageTypeInfo, type PageType } from '@/components/audit/PageTypeFilter'
import Link from 'next/link'
import type { Audit } from '@/lib/api'

interface PageTypeGroupStats {
  type: PageType
  count: number
  avgWordCount: number
  avgResponseTime: number
  issuesCount: number
  sampleUrls: string[]
}

function computeGroupStats(
  allPages: any[],
  classifications: Record<string, string>,
  sampleUrlsByType: Record<string, string[]>
): PageTypeGroupStats[] {
  const groups: Record<string, { pages: any[] }> = {}

  for (const page of allPages) {
    const url = page.url || ''
    const type = classifications[url] || 'other'
    if (!groups[type]) groups[type] = { pages: [] }
    groups[type].pages.push(page)
  }

  return Object.entries(groups)
    .map(([type, { pages }]) => {
      const wordCounts = pages.map((p) => p.word_count || 0).filter(Boolean)
      const responseTimes = pages.map((p) => p.response_time || 0).filter(Boolean)
      const issues = pages.filter(
        (p) =>
          !p.title ||
          !p.meta_description ||
          !p.h1 ||
          p.status_code >= 400 ||
          p.indexability === 'Non-Indexable'
      )

      return {
        type: type as PageType,
        count: pages.length,
        avgWordCount: wordCounts.length
          ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
          : 0,
        avgResponseTime: responseTimes.length
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 1000) / 1000
          : 0,
        issuesCount: issues.length,
        sampleUrls: (sampleUrlsByType[type] || []).slice(0, 3),
      }
    })
    .sort((a, b) => b.count - a.count)
}

export default function PageTypesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuth(true)
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading } = useQuery<Audit>({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    staleTime: 30_000,
  })

  if (!isAuth || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-muted-foreground">Nie znaleziono audytu.</p>
      </div>
    )
  }

  const crawl = audit.results?.crawl || {}
  const allPages = crawl.all_pages || []
  const classifications = crawl.page_classifications || {}
  const pageTypeStats = crawl.page_type_stats || {}
  const sampleUrlsByType = crawl.sample_urls_by_type || {}

  const hasClassifications = Object.keys(classifications).length > 0

  if (!hasClassifications) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Typy podstron
            </CardTitle>
            <CardDescription>
              Klasyfikacja typow podstron nie jest jeszcze dostepna dla tego audytu.
              Uruchom nowy audyt, aby uzyskac klasyfikacje.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const groupStats = computeGroupStats(allPages, classifications, sampleUrlsByType)
  const totalPages = allPages.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 @md:px-6 @md:py-8 min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-teal-600" />
          Typy podstron
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatyczna klasyfikacja {formatNumber(totalPages)} stron na podstawie URL i tresci.
          Kliknij typ, aby zobaczyc filtrowane dane w innych widokach.
        </p>
      </div>

      {/* Summary bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(pageTypeStats)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([type, count]) => {
            const info = getPageTypeInfo(type)
            const Icon = info.icon
            const pct = totalPages > 0 ? Math.round(((count as number) / totalPages) * 100) : 0
            return (
              <div
                key={type}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${info.color}`}
              >
                <Icon className="h-3 w-3" />
                {info.label}: {count as number} ({pct}%)
              </div>
            )
          })}
      </div>

      {/* Type cards grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groupStats.map((group) => {
          const info = getPageTypeInfo(group.type)
          const Icon = info.icon
          const pct = totalPages > 0 ? Math.round((group.count / totalPages) * 100) : 0

          return (
            <Card key={group.type} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`rounded-md p-1.5 ${info.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {info.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {group.count} ({pct}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold text-stone-900 dark:text-white">
                      {formatNumber(group.avgWordCount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg slow</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-stone-900 dark:text-white">
                      {group.avgResponseTime}s
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg czas</p>
                  </div>
                  <div>
                    <p className={`text-lg font-semibold ${group.issuesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {group.issuesCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Problemow</p>
                  </div>
                </div>

                {/* Sample URLs */}
                {group.sampleUrls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Przykladowe strony
                    </p>
                    {group.sampleUrls.map((url) => {
                      try {
                        const parsed = new URL(url)
                        return (
                          <div
                            key={url}
                            className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                            <span className="truncate">{parsed.pathname}</span>
                          </div>
                        )
                      } catch {
                        return null
                      }
                    })}
                  </div>
                )}

                {/* Action button */}
                <Link href={`/audits/${params.id}/crawl-data?pageType=${group.type}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2 text-xs gap-1.5">
                    Filtruj w Crawl Data
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
