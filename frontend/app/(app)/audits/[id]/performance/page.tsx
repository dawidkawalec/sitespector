'use client'

/**
 * Performance Analysis Page - 3-Phase System
 *
 * Dane: Lighthouse metrics (Desktop/Mobile), Core Web Vitals
 * Analiza: AI performance insights (ai_contexts.performance)
 * Plan: Actionable performance improvement tasks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Zap, AlertTriangle, CheckCircle2, Monitor, Smartphone, Activity, ExternalLink, Database } from 'lucide-react'
import { formatScore, getScoreColor } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ResponseTimeChart } from '@/components/AuditCharts'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'

const AUDIT_CATEGORY_ORDER = ['performance', 'accessibility', 'best_practices', 'seo', 'other'] as const
type AuditCategoryKey = typeof AUDIT_CATEGORY_ORDER[number]

const AUDIT_CATEGORY_LABELS: Record<AuditCategoryKey, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  best_practices: 'Best Practices',
  seo: 'SEO',
  other: 'Inne',
}

function buildAuditCategoryMap(lhData: any): Record<string, AuditCategoryKey> {
  const map: Record<string, AuditCategoryKey> = {}
  const categoriesDetail = lhData?.categories_detail || {}
  const rawCategories = lhData?.raw?.categories || {}
  const sourceByCategory = [
    { key: 'performance', detail: categoriesDetail.performance, raw: rawCategories.performance },
    { key: 'accessibility', detail: categoriesDetail.accessibility, raw: rawCategories.accessibility },
    { key: 'best_practices', detail: categoriesDetail.best_practices, raw: rawCategories['best-practices'] },
    { key: 'seo', detail: categoriesDetail.seo, raw: rawCategories.seo },
  ] as const

  sourceByCategory.forEach(({ key, detail, raw }) => {
    const detailRefs = Array.isArray(detail?.audit_refs) ? detail.audit_refs : []
    const rawRefs = Array.isArray(raw?.auditRefs) ? raw.auditRefs.map((ref: any) => ref?.id) : []
    const mergedRefs = [...detailRefs, ...rawRefs].filter(Boolean)
    mergedRefs.forEach((auditId: string) => {
      map[auditId] = key
    })
  })

  return map
}

function groupAuditsByCategory(items: any[], categoryMap: Record<string, AuditCategoryKey>) {
  const grouped: Record<AuditCategoryKey, any[]> = {
    performance: [],
    accessibility: [],
    best_practices: [],
    seo: [],
    other: [],
  }

  items.forEach((item) => {
    const category = categoryMap[item?.id] || 'other'
    grouped[category].push(item)
  })

  return grouped
}

function firstNonEmptyCategory(grouped: Record<AuditCategoryKey, any[]>) {
  return AUDIT_CATEGORY_ORDER.find((key) => grouped[key].length > 0) || 'performance'
}

type CwvMetricDef = {
  id: string
  label: string
  key: string
  unit: 'ms' | 'cls' | 'kb' | 'count'
  good: number
  needsImprovement: number
}

const CWV_METRICS: CwvMetricDef[] = [
  { id: 'lcp', label: 'LCP', key: 'lcp', unit: 'ms', good: 2500, needsImprovement: 4000 },
  { id: 'cls', label: 'CLS', key: 'cls', unit: 'cls', good: 0.1, needsImprovement: 0.25 },
  { id: 'tbt', label: 'TBT', key: 'total_blocking_time', unit: 'ms', good: 200, needsImprovement: 600 },
  { id: 'fcp', label: 'FCP', key: 'fcp', unit: 'ms', good: 1800, needsImprovement: 3000 },
  { id: 'speedIndex', label: 'Speed Index', key: 'speed_index', unit: 'ms', good: 3400, needsImprovement: 5800 },
  { id: 'ttfb', label: 'TTFB', key: 'ttfb', unit: 'ms', good: 800, needsImprovement: 1800 },
  { id: 'interactive', label: 'TTI', key: 'interactive', unit: 'ms', good: 3800, needsImprovement: 7300 },
  { id: 'bootupTime', label: 'Bootup Time', key: 'bootup_time', unit: 'ms', good: 2000, needsImprovement: 3500 },
  { id: 'totalByteWeight', label: 'Total Byte Weight', key: 'total_byte_weight', unit: 'kb', good: 1600, needsImprovement: 2500 },
  { id: 'domSize', label: 'DOM Size', key: 'dom_size', unit: 'count', good: 1500, needsImprovement: 3000 },
]

function cwvStatus(metric: CwvMetricDef, value: number): 'good' | 'needs-improvement' | 'poor' {
  const comparableValue = metric.unit === 'kb' ? value / 1024 : value
  if (comparableValue <= metric.good) return 'good'
  if (comparableValue <= metric.needsImprovement) return 'needs-improvement'
  return 'poor'
}

function formatCwvValue(metric: CwvMetricDef, value: number): string {
  if (metric.unit === 'cls') return value.toFixed(3)
  if (metric.unit === 'kb') return `${Math.round(value / 1024)} KB`
  if (metric.unit === 'count') return `${Math.round(value)}`
  return `${Math.round(value)} ms`
}

function statusBadgeVariant(status: 'good' | 'needs-improvement' | 'poor'): 'default' | 'secondary' | 'destructive' {
  if (status === 'good') return 'default'
  if (status === 'needs-improvement') return 'secondary'
  return 'destructive'
}

function CWVGapAnalysis({ desktop, mobile }: { desktop: any; mobile: any }) {
  if (!desktop || !mobile) return null

  const rows = CWV_METRICS.map((metric) => {
    const desktopValue = Number(desktop?.[metric.key] ?? 0)
    const mobileValue = Number(mobile?.[metric.key] ?? 0)
    const delta = mobileValue - desktopValue
    return {
      metric,
      desktopValue,
      mobileValue,
      delta,
      absDelta: Math.abs(delta),
      mobileStatus: cwvStatus(metric, mobileValue),
    }
  }).sort((a, b) => b.absDelta - a.absDelta)

  const topGap = rows[0]
  const scoreDelta = Number(desktop?.performance_score || 0) - Number(mobile?.performance_score || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>CWV Desktop vs Mobile — Gap Analysis</CardTitle>
        <CardDescription>Porównanie metryk i największych różnic między urządzeniami.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={scoreDelta >= 0 ? 'default' : 'destructive'}>
            Delta Performance Score: {scoreDelta >= 0 ? '+' : ''}{Math.round(scoreDelta)}
          </Badge>
          {topGap ? (
            <Badge variant="outline">
              Największa luka: {topGap.metric.label} ({formatCwvValue(topGap.metric, topGap.absDelta)})
            </Badge>
          ) : null}
        </div>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">Metryka</th>
                <th className="text-center p-3 font-medium">Desktop</th>
                <th className="text-center p-3 font-medium">Mobile</th>
                <th className="text-center p-3 font-medium">Delta (M-D)</th>
                <th className="text-center p-3 font-medium">Status Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.metric.id} className={topGap?.metric.id === row.metric.id ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''}>
                  <td className="p-3 font-medium">{row.metric.label}</td>
                  <td className="text-center p-3">{formatCwvValue(row.metric, row.desktopValue)}</td>
                  <td className="text-center p-3">{formatCwvValue(row.metric, row.mobileValue)}</td>
                  <td className="text-center p-3">
                    {row.delta >= 0 ? '+' : ''}{formatCwvValue(row.metric, row.delta)}
                  </td>
                  <td className="text-center p-3">
                    <Badge variant={statusBadgeVariant(row.mobileStatus)}>{row.mobileStatus}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceTab({ lhData, device, audit }: { lhData: any; device: string; audit: Audit }) {
  if (!lhData) {
    return <p className="text-sm text-muted-foreground py-4">Brak danych Lighthouse dla: {device}</p>
  }

  const metrics = [
    { label: 'First Contentful Paint', value: lhData.fcp ? `${lhData.fcp}ms` : '-', id: 'fcp' },
    { label: 'Largest Contentful Paint', value: lhData.lcp ? `${lhData.lcp}ms` : '-', id: 'lcp' },
    { label: 'Total Blocking Time', value: lhData.total_blocking_time ? `${lhData.total_blocking_time}ms` : '-', id: 'tbt' },
    { label: 'Cumulative Layout Shift', value: lhData.cls !== undefined ? lhData.cls.toFixed(2) : '-', id: 'cls' },
    { label: 'Speed Index', value: lhData.speed_index ? `${lhData.speed_index}ms` : '-', id: 'speed-index' },
    { label: 'Time to First Byte', value: lhData.ttfb ? `${lhData.ttfb}ms` : '-', id: 'ttfb' },
  ]

  const opportunities = lhData.audits?.opportunities || []
  const diagnostics = lhData.audits?.diagnostics || []
  const passed = lhData.audits?.passed || []
  const auditCategoryMap = buildAuditCategoryMap(lhData)
  const groupedOpportunities = groupAuditsByCategory(opportunities, auditCategoryMap)
  const groupedDiagnostics = groupAuditsByCategory(diagnostics, auditCategoryMap)
  const defaultOpportunityCategory = firstNonEmptyCategory(groupedOpportunities)
  const defaultDiagnosticsCategory = firstNonEmptyCategory(groupedDiagnostics)
  const crawl = audit.results?.crawl

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid gap-4 @md:grid-cols-2 @lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Performance</CardDescription>
              <InfoTooltip id="performance_score" />
            </div>
            <CardTitle className={`text-4xl ${getScoreColor(lhData.performance_score)}`}>
              {formatScore(lhData.performance_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lhData.performance_score >= 90 ? 'bg-green-500' : lhData.performance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lhData.performance_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">Accessibility</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lhData.accessibility_score)}`}>
              {formatScore(lhData.accessibility_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lhData.accessibility_score >= 90 ? 'bg-green-500' : lhData.accessibility_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lhData.accessibility_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">Best Practices</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lhData.best_practices_score)}`}>
              {formatScore(lhData.best_practices_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lhData.best_practices_score >= 90 ? 'bg-green-500' : lhData.best_practices_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lhData.best_practices_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">SEO</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lhData.seo_score)}`}>
              {formatScore(lhData.seo_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lhData.seo_score >= 90 ? 'bg-green-500' : lhData.seo_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lhData.seo_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
        <Card className="@lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Core Web Vitals & Metryki
            </CardTitle>
            <CardDescription>Kluczowe wskaźniki szybkości ładowania strony</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-6">
              {metrics.map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      {metric.label}
                      <InfoTooltip id={metric.id as any} side="right" />
                    </span>
                    <Badge variant="outline" className="font-mono">{metric.value}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-primary/40`}
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Czas Odpowiedzi</CardTitle>
            <CardDescription>Rozkład czasu odpowiedzi wszystkich stron</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseTimeChart pages={crawl?.all_pages || []} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList>
          <TabsTrigger value="opportunities" className="gap-2">
            <Zap className="h-4 w-4" /> Możliwości ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Diagnostyka ({diagnostics.length})
          </TabsTrigger>
          <TabsTrigger value="passed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Zaliczone ({passed.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="opportunities" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue={defaultOpportunityCategory} className="w-full">
                <TabsList className="flex flex-wrap h-auto">
                  {AUDIT_CATEGORY_ORDER.map((category) => (
                    <TabsTrigger key={`opp-cat-${category}`} value={category} className="gap-2">
                      {AUDIT_CATEGORY_LABELS[category]}
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                        {groupedOpportunities[category].length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {AUDIT_CATEGORY_ORDER.map((category) => (
                  <TabsContent key={`opp-content-${category}`} value={category} className="pt-4">
                    <Accordion type="single" collapsible className="w-full">
                      {groupedOpportunities[category].length > 0 ? (
                        groupedOpportunities[category].map((opt: any, idx: number) => (
                          <AccordionItem key={`${category}-opt-${idx}`} value={`${category}-opt-${idx}`}>
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-sm font-semibold text-left">{opt.title}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={opt.score === 0 ? 'destructive' : 'default'} className="h-4 text-[8px] uppercase">
                                      {opt.score === 0 ? 'High Priority' : 'Medium Priority'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">Oszczędność: {opt.displayValue || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-3">
                              <p>{opt.description}</p>
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px]"
                                  onClick={() => window.open('https://web.dev/learn/performance/', '_blank')}
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> Dokumentacja Google
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Brak możliwości w kategorii {AUDIT_CATEGORY_LABELS[category]}.
                        </div>
                      )}
                    </Accordion>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue={defaultDiagnosticsCategory} className="w-full">
                <TabsList className="flex flex-wrap h-auto">
                  {AUDIT_CATEGORY_ORDER.map((category) => (
                    <TabsTrigger key={`diag-cat-${category}`} value={category} className="gap-2">
                      {AUDIT_CATEGORY_LABELS[category]}
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                        {groupedDiagnostics[category].length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {AUDIT_CATEGORY_ORDER.map((category) => (
                  <TabsContent key={`diag-content-${category}`} value={category} className="pt-4">
                    <Accordion type="single" collapsible className="w-full">
                      {groupedDiagnostics[category].length > 0 ? (
                        groupedDiagnostics[category].map((diag: any, idx: number) => (
                          <AccordionItem key={`${category}-diag-${idx}`} value={`${category}-diag-${idx}`}>
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="text-sm font-semibold text-left">{diag.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                              {diag.description}
                              {diag.displayValue && (
                                <div className="mt-2 font-mono bg-accent/30 p-2 rounded text-foreground">
                                  {diag.displayValue}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Brak diagnostyki w kategorii {AUDIT_CATEGORY_LABELS[category]}.
                        </div>
                      )}
                    </Accordion>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passed" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-2">
                {passed.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-accent/10 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span className="truncate" title={p.title}>{p.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SubpageLighthouseTable({ subpages }: { subpages?: Record<string, any> }) {
  if (!subpages || Object.keys(subpages).length === 0) return null

  const rows = Object.values(subpages).filter((r: any) => !r.error)
  if (rows.length === 0) return null

  // Sort by performance score ascending (worst first)
  rows.sort((a: any, b: any) => (a.performance_score || 0) - (b.performance_score || 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-teal-600" />
          Lighthouse — podstrony ({rows.length})
        </CardTitle>
        <CardDescription>
          Wyniki Lighthouse dla representative subpages (desktop). Porownaj z homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 pr-4">URL</th>
                <th className="text-center py-2 px-2">Perf</th>
                <th className="text-center py-2 px-2">SEO</th>
                <th className="text-center py-2 px-2">LCP</th>
                <th className="text-center py-2 px-2">CLS</th>
                <th className="text-center py-2 px-2">FCP</th>
                <th className="text-center py-2 px-2">TTFB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                let pathname = r.url
                try { pathname = new URL(r.url).pathname } catch {}
                return (
                  <tr key={r.url} className="border-b last:border-0">
                    <td className="py-2 pr-4 max-w-[250px] truncate font-medium" title={r.url}>
                      {pathname}
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={getScoreColor(r.performance_score)}>{r.performance_score}</span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={getScoreColor(r.seo_score)}>{r.seo_score}</span>
                    </td>
                    <td className="text-center py-2 px-2 text-muted-foreground">
                      {r.lcp ? `${(r.lcp / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="text-center py-2 px-2 text-muted-foreground">
                      {typeof r.cls === 'number' ? r.cls.toFixed(3) : '—'}
                    </td>
                    <td className="text-center py-2 px-2 text-muted-foreground">
                      {r.fcp ? `${(r.fcp / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="text-center py-2 px-2 text-muted-foreground">
                      {r.ttfb ? `${Math.round(r.ttfb)}ms` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function RawDataTab({ audit }: { audit: Audit }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const lhRaw = audit.results?.lighthouse?.[device]?.raw
  
  if (!lhRaw || !lhRaw.audits) {
    return (
      <div className="py-12 text-center space-y-4">
        <Database className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
        <p className="text-muted-foreground">Brak surowych danych dla tego audytu.</p>
      </div>
    )
  }

  const auditsArray = Object.values(lhRaw.audits).map((a: any) => ({
    id: a.id,
    title: a.title,
    score: a.score,
    displayValue: a.displayValue,
    category: a.score === null ? 'Informacyjne' : a.score >= 0.9 ? 'Zaliczone' : a.score >= 0.5 ? 'Możliwości' : 'Problemy',
    details: a.details
  }))

  const columns = [
    { key: 'title', label: 'Audyt', className: 'font-medium' },
    { 
      key: 'score', 
      label: 'Wynik', 
      render: (v: any) => v !== null ? (
        <Badge variant="outline" className={v >= 0.9 ? 'text-green-600' : v >= 0.5 ? 'text-yellow-600' : 'text-red-600'}>
          {(v * 100).toFixed(2)}
        </Badge>
      ) : '-' 
    },
    { key: 'displayValue', label: 'Wartość' },
    { key: 'category', label: 'Kategoria' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs value={device} onValueChange={(v: any) => setDevice(v)}>
          <TabsList>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => {
          const blob = new Blob([JSON.stringify(lhRaw, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `lighthouse_${device}_${audit.id}.json`
          a.click()
        }}>
          Eksportuj JSON ({device})
        </Button>
      </div>

      <DataExplorerTable
        data={auditsArray}
        columns={columns}
        pageSize={20}
        searchPlaceholder="Szukaj w surowych audytach..."
        exportFilename={`lighthouse_raw_${device}_${audit.id}`}
      />
    </div>
  )
}

export default function PerformancePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')
  const [activeTab, setActiveTab] = useState('overview')

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

  const { data: audit, isLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'performance'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'performance' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.performance

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (error) {
      toast.error('Nie udało się zaktualizować zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (error) {
      toast.error('Nie udało się zapisać notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczęto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udało się uruchomić generowania planu')
    },
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych wydajności.</p>
      </div>
    )
  }

  const lhDesktop = audit.results?.lighthouse?.desktop
  const lhMobile = audit.results?.lighthouse?.mobile

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Wydajności</h1>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
        hasAiData={!!aiContext}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Tabs defaultValue="desktop" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
                <TabsTrigger value="desktop" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> Mobile
                </TabsTrigger>
              </TabsList>
              <TabsContent value="desktop">
                <DeviceTab lhData={lhDesktop} device="Desktop" audit={audit} />
              </TabsContent>
              <TabsContent value="mobile">
                <DeviceTab lhData={lhMobile} device="Mobile" audit={audit} />
              </TabsContent>
            </Tabs>

            <CWVGapAnalysis desktop={lhDesktop} mobile={lhMobile} />

            {/* Subpage Lighthouse Results */}
            <SubpageLighthouseTable subpages={audit.results?.crawl?.lighthouse_subpages} />
          </TabsContent>

          <TabsContent value="raw">
            <RawDataTab audit={audit} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="performance"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="performance"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          executionPlanStatus={audit?.execution_plan_status ?? null}
          isGeneratingPlan={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
          onGeneratePlan={() => generatePlanMutation.mutate()}
        />
      )}
    </div>
  )
}
