'use client'

/**
 * Lighthouse Data Page
 * 
 * Displays full Lighthouse audit results:
 * - Category scores (Desktop + Mobile)
 * - All audits: diagnostics, opportunities, passed
 * - Raw data viewer
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Gauge, Monitor, Smartphone, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { formatScore, getScoreColor } from '@/lib/utils'
import type { Audit } from '@/lib/api'

function ScoreCard({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
  const bg = score >= 90 ? 'bg-green-50 dark:bg-green-950/20' : score >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20'
  return (
    <div className={`p-3 rounded-lg ${bg} text-center`}>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{score}</p>
    </div>
  )
}

function AuditItem({ audit: a }: { audit: any }) {
  const scoreColor = a.score === null ? 'text-muted-foreground' : a.score >= 0.9 ? 'text-green-600' : a.score >= 0.5 ? 'text-yellow-600' : 'text-red-600'
  const icon = a.score === null ? <Info className="h-4 w-4 text-muted-foreground" /> : a.score >= 0.9 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />

  return (
    <AccordionItem value={a.id} className="border-none">
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{a.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              {a.score !== null && a.score !== undefined && (
                <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>
                  {Math.round(a.score * 100)}
                </Badge>
              )}
              <AccordionTrigger className="py-0 h-auto hover:no-underline" />
            </div>
          </div>
          {a.displayValue && (
            <p className="text-xs text-muted-foreground mt-0.5">{a.displayValue}</p>
          )}
          <AccordionContent className="pt-3 pb-0">
            {a.description && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{a.description.replace(/\[.*?\]\(.*?\)/g, '').substring(0, 300)}</p>
            )}
            {a.details && a.details.items && a.details.items.length > 0 && (
              <div className="mt-2">
                <DataExplorerTable
                  data={a.details.items.slice(0, 20)}
                  columns={Object.keys(a.details.items[0]).slice(0, 5).map(k => ({
                    key: k,
                    label: k.replace(/([A-Z])/g, ' $1').trim(),
                    maxWidth: '200px',
                    className: 'truncate text-xs',
                    render: (v: any) => {
                      if (v && typeof v === 'object') {
                        if (v.url) return <span className="truncate text-xs">{v.url}</span>
                        if (v.value !== undefined) return <span className="text-xs">{v.value}</span>
                        return <span className="text-xs text-muted-foreground">[object]</span>
                      }
                      return v != null ? <span className="text-xs">{String(v).substring(0, 100)}</span> : null
                    }
                  }))}
                  pageSize={10}
                  exportFilename={`lh_${a.id}`}
                />
              </div>
            )}
          </AccordionContent>
        </div>
      </div>
    </AccordionItem>
  )
}

function DeviceTab({ lhData, device }: { lhData: any; device: string }) {
  if (!lhData) {
    return <p className="text-sm text-muted-foreground py-4">Brak danych Lighthouse dla: {device}</p>
  }

  const categories = lhData.categories_detail || {}
  const audits = lhData.audits || {}
  const diagnostics = audits.diagnostics || []
  const opportunities = audits.opportunities || []
  const passed = audits.passed || []

  return (
    <div className="space-y-6">
      {/* Category Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard label="Performance" score={lhData.performance_score || 0} />
        <ScoreCard label="Accessibility" score={lhData.accessibility_score || 0} />
        <ScoreCard label="Best Practices" score={lhData.best_practices_score || 0} />
        <ScoreCard label="SEO" score={lhData.seo_score || 0} />
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'FCP', value: lhData.fcp, unit: 'ms' },
              { label: 'LCP', value: lhData.lcp, unit: 'ms' },
              { label: 'CLS', value: lhData.cls, unit: '' },
              { label: 'TBT', value: lhData.tbt, unit: 'ms' },
              { label: 'TTFB', value: lhData.ttfb, unit: 'ms' },
              { label: 'SI', value: lhData.si, unit: 'ms' },
            ].map(m => (
              <div key={m.label} className="text-center p-2 rounded bg-accent/5">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold">
                  {m.value != null ? `${Math.round(Number(m.value))}${m.unit}` : '—'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Opportunities ({opportunities.length})
            </CardTitle>
            <CardDescription>Sugestie poprawy wydajności z oszacowanym wpływem</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {opportunities.map((a: any) => (
                <AuditItem key={a.id} audit={a} />
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Diagnostics ({diagnostics.length})
            </CardTitle>
            <CardDescription>Dodatkowe informacje diagnostyczne</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {diagnostics.map((a: any) => (
                <AuditItem key={a.id} audit={a} />
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Passed Audits */}
      {passed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Passed ({passed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {passed.map((a: any) => (
                <AuditItem key={a.id} audit={a} />
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LighthouseDataPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
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

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const lh = audit.results?.lighthouse
  const hasAiData = !!(audit.results?.ai_contexts?.lighthouse || audit.results?.performance_analysis || audit.results?.ux)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="lighthouse" audit={audit} />}
      aiPanelTitle="AI: Lighthouse"
      hasAiData={hasAiData}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gauge className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Lighthouse</h1>
          <p className="text-sm text-muted-foreground">Pełne wyniki audytu Lighthouse (Desktop & Mobile)</p>
        </div>
      </div>

      {lh ? (
        <Tabs defaultValue="desktop" className="w-full">
          <TabsList>
            <TabsTrigger value="desktop" className="gap-2">
              <Monitor className="h-4 w-4" /> Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="gap-2">
              <Smartphone className="h-4 w-4" /> Mobile
            </TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="mt-4">
            <DeviceTab lhData={lh.desktop} device="Desktop" />
          </TabsContent>
          <TabsContent value="mobile" className="mt-4">
            <DeviceTab lhData={lh.mobile} device="Mobile" />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Gauge className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Brak danych Lighthouse.</p>
          </CardContent>
        </Card>
      )}
    </AuditPageLayout>
  )
}
