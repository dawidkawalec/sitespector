'use client'

/**
 * Competitors Analysis Page
 * 
 * Displays competitor audit results for comparison including:
 * - Comparison table (scores, CWV)
 * - Bar charts for visual comparison
 * - AI competitive analysis summary
 * - Winner indicators
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users } from 'lucide-react'
import { formatNumber, formatScore } from '@/lib/utils'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { CompetitorsDualBarChart } from '@/components/AuditCharts'

export default function CompetitorsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

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

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie został znaleziony.</p>
      </div>
    )
  }

  const senutoCompetitors = audit.results?.senuto?.visibility?.competitors || []
  const rows = (senutoCompetitors || []).map((c: any) => ({
    domain: c.domain,
    common_keywords: c.common_keywords || 0,
    visibility: c.statistics?.visibility?.current || c.statistics?.visibility?.recent_value || 0,
    ads_equivalent: c.statistics?.ads_equivalent?.current || c.statistics?.ads_equivalent?.recent_value || 0,
    top3: c.statistics?.top3?.current || c.statistics?.top3?.recent_value || 0,
    top3_diff: c.statistics?.top3?.diff || 0,
    top10: c.statistics?.top10?.current || c.statistics?.top10?.recent_value || 0,
    top10_diff: c.statistics?.top10?.diff || 0,
    top50: c.statistics?.top50?.current || c.statistics?.top50?.recent_value || 0,
    top50_diff: c.statistics?.top50?.diff || 0,
    domain_rank: c.statistics?.domain_rank?.current || c.statistics?.domain_rank?.recent_value || 0,
    domain_rank_diff: c.statistics?.domain_rank?.diff || 0,
  }))

  const columns = [
    { key: 'domain', label: 'Domena', className: 'font-medium' },
    { key: 'common_keywords', label: 'Wspólne słowa', render: (v: any) => formatNumber(v || 0) },
    { key: 'visibility', label: 'Szac. ruch', render: (v: any) => formatNumber(v || 0) },
    { key: 'ads_equivalent', label: 'Ads Equivalent', render: (v: any) => `${formatNumber(v || 0)} PLN` },
    {
      key: 'top3',
      label: 'TOP3',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top3)}</span>
          <Badge variant={row.top3_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top3_diff >= 0 ? `+${formatNumber(row.top3_diff)}` : formatNumber(row.top3_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'top10',
      label: 'TOP10',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top10)}</span>
          <Badge variant={row.top10_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top10_diff >= 0 ? `+${formatNumber(row.top10_diff)}` : formatNumber(row.top10_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'top50',
      label: 'TOP50',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top50)}</span>
          <Badge variant={row.top50_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top50_diff >= 0 ? `+${formatNumber(row.top50_diff)}` : formatNumber(row.top50_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'domain_rank',
      label: 'Ranking',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.domain_rank)}</span>
          <Badge variant={row.domain_rank_diff <= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.domain_rank_diff <= 0 ? `+${formatNumber(Math.abs(row.domain_rank_diff))}` : `-${formatNumber(row.domain_rank_diff)}`}
          </Badge>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Konkurencji</h1>
      </div>
      
      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Brak danych konkurencji z Senuto.</p>
            <p className="text-sm mt-2">Upewnij się, że analiza Senuto zakończyła się poprawnie.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Wyniki organiczne</CardTitle>
              <CardDescription>Wspólne słowa kluczowe vs wszystkie słowa</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorsDualBarChart competitors={senutoCompetitors} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Szczegółowe porównanie</CardTitle>
              <CardDescription>TOP3/TOP10/TOP50, ruch, ekwiwalent reklam i ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <DataExplorerTable data={rows} columns={columns} pageSize={20} exportFilename="konkurencja_senuto" />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
