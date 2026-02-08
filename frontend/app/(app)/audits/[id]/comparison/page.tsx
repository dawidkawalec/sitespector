'use client'

/**
 * Comparison Page
 * 
 * Compares the current audit with previous audits of the same URL.
 * Displays trends and delta indicators.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Minus, Calendar, ExternalLink } from 'lucide-react'
import { formatScore, getScoreColor, formatDate } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import type { Audit } from '@/lib/api'

export default function ComparisonPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace } = useWorkspace()

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

  // 1. Get current audit
  const { data: currentAudit, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  // 2. Get history for this URL
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['audit-history', currentAudit?.url, currentWorkspace?.id],
    queryFn: () => auditsAPI.getHistory(currentWorkspace!.id, currentAudit!.url),
    enabled: !!currentAudit?.url && !!currentWorkspace?.id,
  })

  if (!isAuth || isLoadingCurrent || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentAudit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie został znaleziony.</p>
      </div>
    )
  }

  const audits = history || []
  const previousAudit = audits.length > 1 ? audits[1] : null // audits[0] is the current one if it's completed

  // Prepare chart data (chronological order)
  const chartData = [...audits]
    .reverse()
    .map(a => ({
      date: new Date(a.created_at).toLocaleDateString(),
      overall: a.overall_score || 0,
      seo: a.seo_score || 0,
      performance: a.performance_score || 0,
      content: a.content_score || 0,
    }))

  const getDelta = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current === null || current === undefined || previous === null || previous === undefined) return null
    return current - previous
  }

  const DeltaIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return null
    if (value > 0) return <span className="text-green-600 flex items-center gap-0.5 text-xs font-bold"><TrendingUp className="h-3 w-3" /> +{value}</span>
    if (value < 0) return <span className="text-red-600 flex items-center gap-0.5 text-xs font-bold"><TrendingDown className="h-3 w-3" /> {value}</span>
    return <span className="text-muted-foreground flex items-center gap-0.5 text-xs font-bold"><Minus className="h-3 w-3" /> 0</span>
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Porównanie Audytów</h1>
      </div>

      {audits.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Brak historii dla tego URL</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Aby zobaczyć trendy i porównać wyniki, musisz wykonać co najmniej dwa audyty dla tego samego adresu URL.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Wyników</CardTitle>
              <CardDescription>Zmiana wyników w czasie dla {currentAudit.url}</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="overall" name="Wynik Ogólny" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOverall)" strokeWidth={3} />
                  <Line type="monotone" dataKey="seo" name="SEO" stroke="#10b981" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="performance" name="Wydajność" stroke="#f59e0b" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Delta Comparison Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ogólny', current: currentAudit.overall_score, prev: previousAudit?.overall_score },
              { label: 'SEO', current: currentAudit.seo_score, prev: previousAudit?.seo_score },
              { label: 'Wydajność', current: currentAudit.performance_score, prev: previousAudit?.performance_score },
              { label: 'Treść', current: currentAudit.content_score, prev: previousAudit?.content_score },
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider">{item.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className={`text-3xl font-bold ${getScoreColor(item.current)}`}>{formatScore(item.current)}</div>
                    <div className="pb-1">
                      <DeltaIndicator value={getDelta(item.current, item.prev)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Audit History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historia Audytów</CardTitle>
              <CardDescription>Pełna lista audytów wykonanych dla tego URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Ogólny</TableHead>
                      <TableHead className="text-center">SEO</TableHead>
                      <TableHead className="text-center">Wydajność</TableHead>
                      <TableHead className="text-center">Treść</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((a) => (
                      <TableRow key={a.id} className={a.id === currentAudit.id ? "bg-accent/30" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {formatDate(a.created_at)}
                            {a.id === currentAudit.id && <Badge variant="outline" className="text-[10px]">BIEŻĄCY</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(a.overall_score).replace('text-', 'bg-')}>{formatScore(a.overall_score)}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.seo_score)}</TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.performance_score)}</TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.content_score)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/audits/${a.id}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
