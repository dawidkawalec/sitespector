'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, ShieldAlert, FileDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '–'
  try {
    return format(parseISO(iso), 'd MMM yyyy HH:mm:ss', { locale: pl })
  } catch {
    return iso
  }
}

function fmtDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return '–'
  try {
    const ms = parseISO(end).getTime() - parseISO(start).getTime()
    const secs = Math.max(0, Math.round(ms / 1000))
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem}s`
  } catch {
    return '–'
  }
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return String(value)
  }
}

export default function AdminAuditInspectorPage() {
  const { auditId } = useParams<{ auditId: string }>()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-detail', auditId],
    queryFn: () => adminAPI.getAudit(auditId),
    enabled: !!auditId,
  })

  const aiSections = useMemo(() => {
    const results = data?.results ?? {}
    if (!results || typeof results !== 'object') return {}
    return {
      executive_summary: (results as any).executive_summary ?? null,
      roadmap: (results as any).roadmap ?? null,
      quick_wins: (results as any).quick_wins ?? null,
      ai_contexts: (results as any).ai_contexts ?? null,
      cross_tool: (results as any).cross_tool ?? null,
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Nie znaleziono audytu</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => router.push('/admin/audits')}
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy audytów
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">Podgląd audytu</h1>
            <Badge variant="destructive" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              Read-only admin
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-all">{data.id}</p>
        </div>

        {data.pdf_url && (
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={data.pdf_url} target="_blank" rel="noreferrer">
              <FileDown className="h-4 w-4" />
              Otwórz PDF
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Metadane</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">URL</p>
            <p className="font-mono break-all">{data.url}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="capitalize">{data.status ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">AI status</p>
            <p className="capitalize">{data.ai_status ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Execution plan</p>
            <p className="capitalize">{data.execution_plan_status ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Workspace ID</p>
            <p className="font-mono break-all">{data.workspace_id ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Project ID</p>
            <p className="font-mono break-all">{data.project_id ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utworzony</p>
            <p>{fmtDate(data.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Czas przetwarzania</p>
            <p>{fmtDuration(data.started_at, data.completed_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Wyniki punktowe</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 @md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Overall</p>
            <p className="text-xl font-semibold">{data.overall_score ?? '–'}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">SEO</p>
            <p className="text-xl font-semibold">{data.seo_score ?? '–'}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Performance</p>
            <p className="text-xl font-semibold">{data.performance_score ?? '–'}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Content</p>
            <p className="text-xl font-semibold">{data.content_score ?? '–'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI outputs (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(aiSections).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{key}</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-[260px]">
                {pretty(value)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Processing logs</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-[320px]">
            {pretty(data.processing_logs)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Full `results` payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-[640px]">
            {pretty(data.results)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
