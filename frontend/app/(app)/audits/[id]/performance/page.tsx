'use client'

/**
 * Performance Analysis Page
 * 
 * Displays Lighthouse performance metrics including:
 * - Core Web Vitals (FCP, LCP, CLS, etc.)
 * - Desktop and mobile scores
 * - Opportunities and Diagnostics
 * - Detailed audit lists
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Zap, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Monitor, Smartphone, Activity, ExternalLink, Lightbulb, Database } from 'lucide-react'
import { formatScore, getScoreColor } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ResponseTimeChart } from '@/components/AuditCharts'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import type { Audit } from '@/lib/api'

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
  const crawl = audit.results?.crawl

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Core Web Vitals & Metryki
            </CardTitle>
            <CardDescription>Kluczowe wskaźniki szybkości ładowania strony</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Accordion type="single" collapsible className="w-full">
                {opportunities.length > 0 ? (
                  opportunities.map((opt: any, idx: number) => (
                    <AccordionItem key={idx} value={`opt-${idx}`}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-semibold text-left">{opt.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={opt.score === 0 ? 'destructive' : 'default'} className="h-4 text-[8px] uppercase">
                                {opt.score === 0 ? 'High Priority' : 'Medium Priority'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">Oszczędność: {opt.displayValue}</span>
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
                  <div className="text-center py-8 text-muted-foreground">Brak zidentyfikowanych możliwości.</div>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {diagnostics.length > 0 ? (
                  diagnostics.map((diag: any, idx: number) => (
                    <AccordionItem key={idx} value={`diag-${idx}`}>
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
                  <div className="text-center py-8 text-muted-foreground">Brak danych diagnostycznych.</div>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passed" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych wydajności.</p>
      </div>
    )
  }

  const lhDesktop = audit.results?.lighthouse?.desktop
  const lhMobile = audit.results?.lighthouse?.mobile
  const hasAiData = !!(audit.results?.ai_contexts?.performance || audit.results?.performance_analysis)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="performance" audit={audit} />}
      aiPanelTitle="AI: Wydajność"
      hasAiData={hasAiData}
      isAiLoading={audit.ai_status === 'processing'}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-primary">
            <span className="text-line">Analiza Wydajności</span>
          </h1>
        </div>

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

            {/* Comparison Table */}
            {lhDesktop && lhMobile && (
              <Card>
                <CardHeader>
                  <CardTitle>Porównanie Desktop vs Mobile</CardTitle>
                  <CardDescription>Różnice w wydajności między urządzeniami</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-medium">Metryka</th>
                          <th className="text-center p-3 font-medium">Desktop</th>
                          <th className="text-center p-3 font-medium">Mobile</th>
                          <th className="text-center p-3 font-medium">Różnica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-3 font-medium">Performance Score</td>
                          <td className={`text-center p-3 font-bold ${getScoreColor(lhDesktop.performance_score)}`}>{formatScore(lhDesktop.performance_score)}</td>
                          <td className={`text-center p-3 font-bold ${getScoreColor(lhMobile.performance_score)}`}>{formatScore(lhMobile.performance_score)}</td>
                          <td className="text-center p-3">{formatScore(lhDesktop.performance_score - lhMobile.performance_score)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">LCP (ms)</td>
                          <td className="text-center p-3">{lhDesktop.lcp}</td>
                          <td className="text-center p-3">{lhMobile.lcp}</td>
                          <td className="text-center p-3">{lhMobile.lcp - lhDesktop.lcp}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">CLS</td>
                          <td className="text-center p-3">{lhDesktop.cls?.toFixed(2)}</td>
                          <td className="text-center p-3">{lhMobile.cls?.toFixed(2)}</td>
                          <td className="text-center p-3">{(lhMobile.cls - lhDesktop.cls).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="raw">
            <RawDataTab audit={audit} />
          </TabsContent>
        </Tabs>
      </div>
    </AuditPageLayout>
  )
}
