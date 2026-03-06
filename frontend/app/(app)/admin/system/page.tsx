'use client'

import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  Zap,
  Activity,
  Search,
  Bot,
  Hourglass,
} from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const SERVICE_ICONS: Record<string, React.ElementType> = {
  screaming_frog: Search,
  lighthouse: Zap,
  worker: Bot,
  database: Database,
  qdrant: Server,
  senuto: Activity,
}

const SERVICE_LABELS: Record<string, string> = {
  screaming_frog: 'Screaming Frog',
  lighthouse: 'Lighthouse',
  worker: 'Worker',
  database: 'PostgreSQL',
  qdrant: 'Qdrant (RAG)',
  senuto: 'Senuto',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'online')
    return <CheckCircle2 className="h-5 w-5 text-green-500" />
  if (status === 'offline' || status === 'error')
    return <XCircle className="h-5 w-5 text-red-500" />
  return <AlertCircle className="h-5 w-5 text-yellow-500" />
}

function statusBg(status: string) {
  if (status === 'online') return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
  if (status === 'offline' || status === 'error') return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
  return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
}

export default function AdminSystemPage() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-system'],
    queryFn: adminAPI.getSystem,
    refetchInterval: (query) => (query.state.error ? 120_000 : 30_000),
    retry: 1,
  })

  const services = data?.services ?? {}
  const pendingQueue = data?.worker_queue?.pending ?? 0
  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), 'HH:mm:ss', { locale: pl })
    : null

  const allOnline =
    Object.values(services).length > 0 &&
    Object.values(services).every((s: any) => s.status === 'online')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Status systemu</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Aktualizacja: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Overall status pill */}
          {!isLoading && (
            <span
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border',
                allOnline
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400'
              )}
            >
              {allOnline ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {allOnline ? 'Wszystkie systemy OK' : 'Wykryto problemy'}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Odśwież
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Worker queue stat */}
          <Card
            className={cn(
              'border',
              pendingQueue > 0
                ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
                : 'border-border'
            )}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Hourglass className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Kolejka workera</p>
                <p className="text-2xl font-bold mt-0.5">
                  {pendingQueue}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    oczekujących audytów
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services grid */}
          <div className="grid @md:grid-cols-2 @xl:grid-cols-3 gap-4">
            {Object.entries(services).map(([key, svc]: [string, any]) => {
              const Icon = SERVICE_ICONS[key] ?? Server
              const label = SERVICE_LABELS[key] ?? key
              return (
                <Card key={key} className={cn('border', statusBg(svc.status))}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-background/60 p-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-semibold">{label}</span>
                      </div>
                      <StatusIcon status={svc.status} />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <span
                          className={cn(
                            'font-semibold capitalize',
                            svc.status === 'online'
                              ? 'text-green-600 dark:text-green-400'
                              : svc.status === 'offline' || svc.status === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          )}
                        >
                          {svc.status}
                        </span>
                      </div>
                      {svc.version && (
                        <div className="flex items-center justify-between">
                          <span>Wersja</span>
                          <span className="font-mono text-foreground">{svc.version}</span>
                        </div>
                      )}
                      {svc.pid && (
                        <div className="flex items-center justify-between">
                          <span>PID</span>
                          <span className="font-mono text-foreground">{svc.pid}</span>
                        </div>
                      )}
                      {svc.collections != null && (
                        <div className="flex items-center justify-between">
                          <span>Kolekcje</span>
                          <span className="font-mono text-foreground">{svc.collections}</span>
                        </div>
                      )}
                      {svc.message && (
                        <div className="flex items-center justify-between">
                          <span>Info</span>
                          <span className="text-foreground truncate max-w-[120px]">{svc.message}</span>
                        </div>
                      )}
                      {svc.error && (
                        <div className="mt-1.5 p-2 rounded bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                          {svc.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
