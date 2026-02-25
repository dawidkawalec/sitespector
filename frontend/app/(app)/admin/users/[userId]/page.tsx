'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Loader2,
  Shield,
  CreditCard,
  MessageSquare,
  Activity,
  Building2,
  FileDown,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: 999999,
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

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [planDialog, setPlanDialog] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [selectedLimit, setSelectedLimit] = useState('5')

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminAPI.getUser(userId),
    enabled: !!userId,
  })

  const planMutation = useMutation({
    mutationFn: async () => {
      if (!planDialog || !user) return
      await adminAPI.changeUserPlan(user.id, {
        workspace_id: planDialog,
        plan: selectedPlan,
        audit_limit: parseInt(selectedLimit) || PLAN_LIMITS[selectedPlan],
      })
    },
    onSuccess: () => {
      toast.success('Plan zaktualizowany')
      qc.invalidateQueries({ queryKey: ['admin-user', userId] })
      setPlanDialog(null)
    },
    onError: (e: any) => toast.error(e.message ?? 'Błąd'),
  })

  const openPlanDialog = (wsId: string, currentPlan: string, currentLimit: number) => {
    setPlanDialog(wsId)
    setSelectedPlan(currentPlan)
    setSelectedLimit(String(currentLimit))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground">Nie znaleziono użytkownika</div>
    )
  }

  // Build audit activity by day (group by date)
  const auditByDay: Record<string, number> = {}
  user.audits.forEach((a) => {
    if (a.created_at) {
      const d = a.created_at.substring(0, 10)
      auditByDay[d] = (auditByDay[d] ?? 0) + 1
    }
  })
  const auditChartData = Object.entries(auditByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      count,
      label: (() => {
        try {
          return format(parseISO(date), 'd MMM', { locale: pl })
        } catch {
          return date
        }
      })(),
    }))

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do listy
      </Button>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* Avatar placeholder */}
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold">{user.full_name ?? user.email}</h1>
                {user.is_super_admin && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    Super Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{user.id}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-500">{user.workspace_count}</p>
                <p className="text-xs text-muted-foreground">Workspace'y</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-500">{user.projects_count}</p>
                <p className="text-xs text-muted-foreground">Projekty</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-500">{user.total_audits}</p>
                <p className="text-xs text-muted-foreground">Audyty</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-cyan-500">{user.chat_messages_count}</p>
                <p className="text-xs text-muted-foreground">Wiad. chat</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 @md:grid-cols-4 gap-4 text-xs text-muted-foreground border-t border-border pt-4">
            <div>
              <span className="font-medium text-foreground">Rejestracja</span>
              <br />
              {fmtDate(user.created_at)}
            </div>
            <div>
              <span className="font-medium text-foreground">Ostatnie logowanie</span>
              <br />
              {fmtDate(user.last_sign_in_at)}
            </div>
            <div>
              <span className="font-medium text-foreground">Email potwierdzony</span>
              <br />
              {fmtDate(user.confirmed_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Workspace'y ({user.workspaces.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Użyte</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.workspaces.map((ws) => {
                  const sub = ws.subscription
                  return (
                    <TableRow key={ws.id}>
                      <TableCell className="font-medium text-sm">{ws.name}</TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {ws.type}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {ws.role}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {sub?.plan ?? 'free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sub?.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs capitalize"
                        >
                          {sub?.status ?? '–'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {sub?.audit_limit === 999999 ? '∞' : (sub?.audit_limit ?? '–')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {sub?.audits_used_this_month ?? '–'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            openPlanDialog(
                              ws.id,
                              sub?.plan ?? 'free',
                              sub?.audit_limit ?? PLAN_LIMITS[sub?.plan ?? 'free']
                            )
                          }
                        >
                          <CreditCard className="h-3 w-3" />
                          Zmień plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Audit activity chart */}
      {auditChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Aktywność audytów
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={auditChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                  allowDecimals={false}
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
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#uGrad)"
                  dot={false}
                  name="Audyty"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Audits table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ostatnie audyty ({user.total_audits} łącznie, widoczne: {user.audits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Overall</TableHead>
                  <TableHead className="text-right">SEO</TableHead>
                  <TableHead className="text-right">Perf.</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.audits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Brak audytów
                    </TableCell>
                  </TableRow>
                ) : (
                  user.audits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-mono max-w-[200px] truncate">
                        {a.url}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status ?? ''] ?? ''}`}
                        >
                          {a.status ?? '–'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${SCORE_COLOR(a.overall_score)}`}>
                        {a.overall_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${SCORE_COLOR(a.seo_score)}`}>
                        {a.seo_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${SCORE_COLOR(a.performance_score)}`}>
                        {a.performance_score?.toFixed(0) ?? '–'}
                      </TableCell>
                      <TableCell>
                        {a.pdf_url ? (
                          <FileDown className="h-3.5 w-3.5 text-cyan-500" />
                        ) : (
                          <span className="text-muted-foreground text-xs">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(a.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Change plan dialog */}
      {planDialog && (
        <Dialog open onOpenChange={() => setPlanDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zmień plan workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plan</label>
                <Select
                  value={selectedPlan}
                  onValueChange={(v) => {
                    setSelectedPlan(v)
                    setSelectedLimit(String(PLAN_LIMITS[v] ?? 5))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Limit audytów / miesiąc</label>
                <Input
                  type="number"
                  min={0}
                  value={selectedLimit}
                  onChange={(e) => setSelectedLimit(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialog(null)} disabled={planMutation.isPending}>
                Anuluj
              </Button>
              <Button onClick={() => planMutation.mutate()} disabled={planMutation.isPending}>
                {planMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Zapisz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
