'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileDown,
  Filter,
  Eye,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const SCORE_COLOR = (v: number | null) => {
  if (v == null) return 'text-muted-foreground'
  if (v >= 70) return 'text-green-500'
  if (v >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '–'
  try {
    return format(parseISO(iso), 'd MMM yyyy HH:mm', { locale: pl })
  } catch {
    return iso
  }
}

function fmtDuration(start: string | null, end: string | null) {
  if (!start || !end) return '–'
  try {
    const ms = parseISO(end).getTime() - parseISO(start).getTime()
    const secs = Math.round(ms / 1000)
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem}s`
  } catch {
    return '–'
  }
}

export default function AdminAuditsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const PER_PAGE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audits', page, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      adminAPI.listAudits({
        page,
        per_page: PER_PAGE,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  })

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1
  const agg = data?.aggregate

  const handleFilter = () => {
    setPage(1)
  }

  const clearFilters = () => {
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Audyty</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} wyników` : '…'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          Filtry
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 w-44">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Wszystkie</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-40">
              <label className="text-xs font-medium text-muted-foreground">Data od</label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 w-40">
              <label className="text-xs font-medium text-muted-foreground">Data do</label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleFilter}>
                Zastosuj
              </Button>
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Wyczyść
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate stats */}
      {agg && (
        <div className="grid grid-cols-2 @md:grid-cols-4 @xl:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Skuteczność</p>
                <p className="text-lg font-semibold">
                  {agg.success_rate != null ? `${agg.success_rate}%` : '–'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Zakończone</p>
                <p className="text-lg font-semibold">{agg.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Błędy</p>
                <p className="text-lg font-semibold">{agg.failed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Avg czas</p>
                <p className="text-lg font-semibold">
                  {agg.avg_processing_minutes != null
                    ? `${agg.avg_processing_minutes}m`
                    : '–'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Avg SEO</p>
                <p className="text-lg font-semibold">
                  {agg.avg_seo_score != null ? agg.avg_seo_score : '–'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Overall</p>
                <p className="text-lg font-semibold">
                  {agg.avg_overall_score != null ? agg.avg_overall_score : '–'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Overall</TableHead>
                  <TableHead className="text-right">SEO</TableHead>
                  <TableHead className="text-right">Perf.</TableHead>
                  <TableHead className="text-right">Content</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Czas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !data?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      Brak audytów
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-mono max-w-[180px] truncate">
                        {a.url}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {a.workspace_name || '–'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[a.status ?? ''] ?? ''}`}
                        >
                          {a.status ?? '–'}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-semibold ${SCORE_COLOR(a.overall_score)}`}
                      >
                        {a.overall_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${SCORE_COLOR(a.seo_score)}`}
                      >
                        {a.seo_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${SCORE_COLOR(a.performance_score)}`}
                      >
                        {a.performance_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${SCORE_COLOR(a.content_score)}`}
                      >
                        {a.content_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell>
                        {a.pdf_url ? (
                          <FileDown className="h-3.5 w-3.5 text-cyan-500" />
                        ) : (
                          <span className="text-muted-foreground text-xs">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDuration(a.started_at, a.completed_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(a.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => router.push(`/admin/audits/${a.id}`)}
                        >
                          <Eye className="h-3 w-3" />
                          Podejrzyj
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Strona {page} z {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
