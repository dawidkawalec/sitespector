'use client'

import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Building2,
  Activity,
  FileDown,
  DollarSign,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Hourglass,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  pro: '#3b82f6',
  enterprise: '#8b5cf6',
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  failed: '#ef4444',
  processing: '#f59e0b',
  pending: '#6b7280',
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color = 'text-foreground',
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="rounded-lg bg-muted p-2.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getStats,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Brak dostępu lub błąd ładowania danych.
      </div>
    )
  }

  if (!stats) return null

  const planData = Object.entries(stats.billing.plan_distribution).map(([name, value]) => ({
    name,
    value,
  }))

  const statusData = Object.entries(stats.audits.by_status).map(([name, value]) => ({
    name,
    value,
  }))

  const auditPerDayData = stats.audits.per_day_30d.map((d) => ({
    ...d,
    label: (() => {
      try {
        return format(parseISO(d.date), 'd MMM', { locale: pl })
      } catch {
        return d.date
      }
    })(),
  }))

  const totalAuditsCompleted = stats.audits.by_status['completed'] ?? 0
  const totalAuditsFailed = stats.audits.by_status['failed'] ?? 0
  const successRate =
    stats.audits.total > 0
      ? Math.round((totalAuditsCompleted / stats.audits.total) * 100)
      : null

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Panel Administratora</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Globalny podgląd platformy SiteSpector
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-6 gap-4">
        <KpiCard
          title="Użytkownicy"
          value={stats.users.total.toLocaleString()}
          sub={`+${stats.users.new_7d} ostatnie 7 dni`}
          icon={Users}
          color="text-blue-500"
        />
        <KpiCard
          title="Workspace'y"
          value={stats.workspaces.total.toLocaleString()}
          icon={Building2}
          color="text-purple-500"
        />
        <KpiCard
          title="Projekty"
          value={stats.projects.total.toLocaleString()}
          icon={Activity}
          color="text-green-500"
        />
        <KpiCard
          title="Audyty łącznie"
          value={stats.audits.total.toLocaleString()}
          sub={`${stats.audits.today} dzisiaj`}
          icon={TrendingUp}
          color="text-orange-500"
        />
        <KpiCard
          title="Raporty PDF"
          value={stats.reports.pdf_generated.toLocaleString()}
          icon={FileDown}
          color="text-cyan-500"
        />
        <KpiCard
          title="Przychód"
          value={`$${stats.billing.total_revenue_usd.toLocaleString('en', { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          color="text-emerald-500"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 @lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Skuteczność</p>
              <p className="text-lg font-semibold">
                {successRate !== null ? `${successRate}%` : '–'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Avg czas audytu</p>
              <p className="text-lg font-semibold">
                {stats.audits.avg_processing_minutes != null
                  ? `${stats.audits.avg_processing_minutes} min`
                  : '–'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Avg SEO score</p>
              <p className="text-lg font-semibold">
                {stats.audits.avg_seo_score != null ? stats.audits.avg_seo_score : '–'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Hourglass className="h-5 w-5 text-orange-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Kolejka worker</p>
              <p className="text-lg font-semibold">{stats.audits.pending_queue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid @xl:grid-cols-2 gap-6">
        {/* Audits per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Audyty – ostatnie 30 dni</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={auditPerDayData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#auditGrad)"
                  dot={false}
                  name="Audyty"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rozkład planów</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name] ?? '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {planData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: PLAN_COLORS[entry.name] ?? '#6b7280' }}
                  />
                  <span className="text-sm capitalize text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold ml-auto pl-4">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Audyty wg statusu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {statusData.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-2 rounded-full px-3 py-1 border border-border bg-muted/50"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: STATUS_COLORS[s.name] ?? '#6b7280' }}
                />
                <span className="text-sm capitalize text-muted-foreground">{s.name}</span>
                <span className="text-sm font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" name="Audyty" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* New users 7d / 30d */}
      <div className="grid @sm:grid-cols-2 @xl:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Nowi użytkownicy (7 dni)
            </p>
            <p className="text-2xl font-bold text-blue-500">+{stats.users.new_7d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Nowi użytkownicy (30 dni)
            </p>
            <p className="text-2xl font-bold text-blue-400">+{stats.users.new_30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Audyty w tym miesiącu
            </p>
            <p className="text-2xl font-bold text-orange-400">{stats.audits.this_month}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
