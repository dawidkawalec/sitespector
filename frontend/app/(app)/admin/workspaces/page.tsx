'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  canceled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  past_due: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  trialing: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '–'
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: pl })
  } catch {
    return iso
  }
}

export default function AdminWorkspacesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const resetMutation = useMutation({
    mutationFn: (workspaceId: string) => adminAPI.resetWorkspaceUsage(workspaceId),
    onSuccess: () => {
      toast.success('Licznik audytów zresetowany do 0')
      qc.invalidateQueries({ queryKey: ['admin-workspaces'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Błąd resetowania'),
  })

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    clearTimeout((handleSearchChange as any)._t)
    ;(handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 400)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-workspaces', page, debouncedSearch],
    queryFn: () => adminAPI.listWorkspaces({ page, per_page: PER_PAGE, search: debouncedSearch }),
  })

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Workspace&apos;y</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} łącznie` : '…'}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj nazwy / sluga…"
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
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Właściciel</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status sub.</TableHead>
                  <TableHead className="text-right">Członkowie</TableHead>
                  <TableHead className="text-right">Projekty</TableHead>
                  <TableHead className="text-right">Audyty</TableHead>
                  <TableHead className="text-right">Limit / Użyte</TableHead>
                  <TableHead>Utworzony</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !data?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Brak workspace&apos;ów
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((ws) => (
                    <TableRow key={ws.id}>
                      <TableCell className="font-medium text-sm">
                        <div>
                          <span>{ws.name}</span>
                          <br />
                          <span className="text-xs text-muted-foreground font-mono">
                            {ws.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {ws.type}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[160px] truncate">
                        {ws.owner_email || '–'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_BADGE[ws.plan] ?? ''}`}
                        >
                          {ws.plan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[ws.subscription_status] ?? ''}`}
                        >
                          {ws.subscription_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{ws.member_count}</TableCell>
                      <TableCell className="text-right text-sm">{ws.project_count}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{ws.audit_count}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {ws.audit_limit === 999999 ? '∞' : ws.audit_limit} / {ws.audits_used_this_month}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(ws.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={resetMutation.isPending}
                          onClick={() => resetMutation.mutate(ws.id)}
                          title="Resetuj licznik audytów tego miesiąca do 0"
                        >
                          {resetMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Reset
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
