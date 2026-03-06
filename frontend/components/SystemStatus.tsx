'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { systemAPI } from '@/lib/api'

interface ServiceStatus {
  status: 'online' | 'offline' | 'error'
  version?: string
  error?: string
  pid?: string
  message?: string
}

interface QdrantServiceStatus extends ServiceStatus {
  collections?: number
}

interface SystemStatus {
  timestamp: string
  version: string
  services: {
    screaming_frog: ServiceStatus
    lighthouse: ServiceStatus
    worker: ServiceStatus
    database: ServiceStatus
    senuto: ServiceStatus
    qdrant: QdrantServiceStatus
  }
}

export function SystemStatus() {
  const { data: status, isLoading, isError, error } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemAPI.getStatus() as Promise<SystemStatus>,
    // Back off polling when endpoint is failing to avoid request spam.
    refetchInterval: (query) => (query.state.error ? 120_000 : 30_000),
    retry: 1,
  })

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load system status: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  const getStatusBadge = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">Online</Badge>
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>v{status.version}</span>
            <span>•</span>
            <span>Updated: {new Date(status.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Screaming Frog */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Screaming Frog</span>
              {getStatusBadge(status.services.screaming_frog.status)}
            </div>
            {status.services.screaming_frog.version && (
              <p className="text-xs text-muted-foreground">{status.services.screaming_frog.version}</p>
            )}
            {status.services.screaming_frog.error && (
              <p className="text-xs text-red-500">{status.services.screaming_frog.error}</p>
            )}
          </div>

          {/* Lighthouse */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lighthouse</span>
              {getStatusBadge(status.services.lighthouse.status)}
            </div>
            {status.services.lighthouse.version && (
              <p className="text-xs text-muted-foreground">{status.services.lighthouse.version}</p>
            )}
            {status.services.lighthouse.error && (
              <p className="text-xs text-red-500">{status.services.lighthouse.error}</p>
            )}
          </div>

          {/* Worker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Worker</span>
              {getStatusBadge(status.services.worker.status)}
            </div>
            {status.services.worker.pid && (
              <p className="text-xs text-muted-foreground">PID: {status.services.worker.pid}</p>
            )}
          </div>

          {/* Database */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              {getStatusBadge(status.services.database.status)}
            </div>
            {status.services.database.message && (
              <p className="text-xs text-muted-foreground">{status.services.database.message}</p>
            )}
          </div>

          {/* Senuto */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Senuto</span>
              {getStatusBadge(status.services.senuto.status)}
            </div>
            {status.services.senuto.version && (
              <p className="text-xs text-muted-foreground">{status.services.senuto.version}</p>
            )}
            {status.services.senuto.error && (
              <p className="text-xs text-red-500">{status.services.senuto.error}</p>
            )}
          </div>

          {/* Qdrant */}
          {status.services.qdrant && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qdrant</span>
                {getStatusBadge(status.services.qdrant.status)}
              </div>
              {status.services.qdrant.version && (
                <p className="text-xs text-muted-foreground">{status.services.qdrant.version}</p>
              )}
              {status.services.qdrant.collections !== undefined && (
                <p className="text-xs text-muted-foreground">{status.services.qdrant.collections} collections</p>
              )}
              {status.services.qdrant.error && (
                <p className="text-xs text-red-500">{status.services.qdrant.error}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
