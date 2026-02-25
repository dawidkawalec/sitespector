'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, AdminUser } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  CreditCard,
  Shield,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { toast } from 'sonner'

const PLAN_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  free: 'outline',
  pro: 'default',
  enterprise: 'secondary',
}

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: 999999,
}

function fmtDate(iso: string | null) {
  if (!iso) return '–'
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: pl })
  } catch {
    return iso
  }
}

interface PlanDialogProps {
  user: AdminUser | null
  onClose: () => void
}

function ChangePlanDialog({ user, onClose }: PlanDialogProps) {
  const queryClient = useQueryClient()
  const [plan, setPlan] = useState(user?.plan ?? 'free')
  const [limit, setLimit] = useState(String(user?.audit_limit ?? PLAN_LIMITS[user?.plan ?? 'free']))

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      // We need a workspace_id — call user detail to get primary workspace
      const detail = await adminAPI.getUser(user.id)
      const primaryWs = detail.workspaces?.[0]
      if (!primaryWs) throw new Error('Brak workspace dla tego użytkownika')
      await adminAPI.changeUserPlan(user.id, {
        workspace_id: primaryWs.id,
        plan,
        audit_limit: parseInt(limit) || PLAN_LIMITS[plan],
      })
    },
    onSuccess: () => {
      toast.success('Plan zaktualizowany')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message ?? 'Błąd aktualizacji planu'),
  })

  if (!user) return null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zmień plan — {user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan</label>
            <Select
              value={plan}
              onValueChange={(v) => {
                setPlan(v)
                setLimit(String(PLAN_LIMITS[v] ?? 5))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (5/mies.)</SelectItem>
                <SelectItem value="pro">Pro (50/mies.)</SelectItem>
                <SelectItem value="enterprise">Enterprise (unlimited)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Limit audytów / miesiąc</label>
            <Input
              type="number"
              min={0}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Anuluj
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [planDialog, setPlanDialog] = useState<AdminUser | null>(null)
  const PER_PAGE = 20

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    clearTimeout((handleSearchChange as any)._t)
    ;(handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 400)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () => adminAPI.listUsers({ page, per_page: PER_PAGE, search: debouncedSearch }),
  })

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Użytkownicy</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} łącznie` : '…'}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj email / imię…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Imię</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Workspace'y</TableHead>
                  <TableHead className="text-right">Audyty</TableHead>
                  <TableHead className="text-right">Użyte / limit</TableHead>
                  <TableHead>Rejestracja</TableHead>
                  <TableHead>Ostatnie logowanie</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !data?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      Brak użytkowników
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        <span className="flex items-center gap-1.5">
                          {user.is_super_admin && (
                            <Shield className="h-3 w-3 text-red-500 shrink-0" />
                          )}
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{user.full_name ?? '–'}</TableCell>
                      <TableCell>
                        <Badge variant={PLAN_BADGE_VARIANT[user.plan] ?? 'outline'} className="capitalize">
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{user.workspace_count}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{user.total_audits}</TableCell>
                      <TableCell className="text-right text-sm">
                        {user.audits_used_this_month} / {user.audit_limit === 999999 ? '∞' : user.audit_limit}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Szczegóły"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Zmień plan"
                            onClick={() => setPlanDialog(user)}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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

      {/* Plan change dialog */}
      {planDialog && (
        <ChangePlanDialog user={planDialog} onClose={() => setPlanDialog(null)} />
      )}
    </div>
  )
}
