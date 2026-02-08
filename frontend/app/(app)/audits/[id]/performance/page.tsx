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
import { Loader2, Zap, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Monitor, Smartphone, Activity, ExternalLink, Lightbulb } from 'lucide-react'
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
import type { Audit } from '@/lib/api'

export default function PerformancePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

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

  const lh = audit.results?.lighthouse?.[device]
  const lhDesktop = audit.results?.lighthouse?.desktop
  const lhMobile = audit.results?.lighthouse?.mobile
  const crawl = audit.results?.crawl

  if (!lh) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych Lighthouse dla urządzenia: {device}.</p>
      </div>
    )
  }

  const metrics = [
    { label: 'First Contentful Paint', value: lh.fcp ? `${lh.fcp}ms` : '-', id: 'fcp' },
    { label: 'Largest Contentful Paint', value: lh.lcp ? `${lh.lcp}ms` : '-', id: 'lcp' },
    { label: 'Total Blocking Time', value: lh.total_blocking_time ? `${lh.total_blocking_time}ms` : '-', id: 'tbt' },
    { label: 'Cumulative Layout Shift', value: lh.cls !== undefined ? lh.cls.toFixed(3) : '-', id: 'cls' },
    { label: 'Speed Index', value: lh.speed_index ? `${lh.speed_index}ms` : '-', id: 'speed-index' },
    { label: 'Time to First Byte', value: lh.ttfb ? `${lh.ttfb}ms` : '-', id: 'ttfb' },
  ]

  const opportunities = lh.audits?.opportunities || []
  const diagnostics = lh.audits?.diagnostics || []
  const passed = lh.audits?.passed || []

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Analiza Wydajności</h1>
        <Tabs value={device} onValueChange={(v: any) => setDevice(v)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Mobile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Main Scores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">Performance</CardDescription>
              <InfoTooltip id="performance_score" />
            </div>
            <CardTitle className={`text-4xl ${getScoreColor(lh.performance_score)}`}>
              {formatScore(lh.performance_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lh.performance_score >= 90 ? 'bg-green-500' : lh.performance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lh.performance_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">Accessibility</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lh.accessibility_score)}`}>
              {formatScore(lh.accessibility_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lh.accessibility_score >= 90 ? 'bg-green-500' : lh.accessibility_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lh.accessibility_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">Best Practices</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lh.best_practices_score)}`}>
              {formatScore(lh.best_practices_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lh.best_practices_score >= 90 ? 'bg-green-500' : lh.best_practices_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lh.best_practices_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">SEO</CardDescription>
            <CardTitle className={`text-4xl ${getScoreColor(lh.seo_score)}`}>
              {formatScore(lh.seo_score)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${lh.seo_score >= 90 ? 'bg-green-500' : lh.seo_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lh.seo_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Web Vitals */}
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
                    {/* Simplified progress based on some arbitrary thresholds for visualization */}
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

        {/* Response Time Chart */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Zap className="h-5 w-5" />
              Możliwości Optymalizacji
            </CardTitle>
            <CardDescription>Sugestie, które mogą przyspieszyć ładowanie strony</CardDescription>
          </CardHeader>
          <CardContent>
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

        {/* Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <AlertTriangle className="h-5 w-5" />
              Diagnostyka
            </CardTitle>
            <CardDescription>Więcej informacji o wydajności Twojej aplikacji</CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>

      {/* Passed Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Zaliczone Audyty ({passed.length})
            </CardTitle>
            <CardDescription>Elementy, które są już dobrze zoptymalizowane</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="passed-list">
                <AccordionTrigger className="text-sm font-medium">Pokaż wszystkie zaliczone audyty</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    {passed.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-accent/10 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="truncate" title={p.title}>{p.title}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Top Fixes Panel */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Top 3 do naprawy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {opportunities.slice(0, 3).map((opt: any, i: number) => (
              <div key={i} className="p-2 bg-white dark:bg-gray-950 rounded border text-[11px] shadow-sm">
                <p className="font-bold mb-1">{opt.title}</p>
                <p className="text-muted-foreground line-clamp-2 mb-2">{opt.description}</p>
                <Badge variant="secondary" className="h-4 text-[8px]">Impact: {opt.displayValue}</Badge>
              </div>
            ))}
            {opportunities.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Brak krytycznych uwag.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
                    <td className={`text-center p-3 font-bold ${getScoreColor(lhDesktop.performance_score)}`}>{lhDesktop.performance_score}</td>
                    <td className={`text-center p-3 font-bold ${getScoreColor(lhMobile.performance_score)}`}>{lhMobile.performance_score}</td>
                    <td className="text-center p-3">{lhDesktop.performance_score - lhMobile.performance_score}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">LCP (ms)</td>
                    <td className="text-center p-3">{lhDesktop.lcp}</td>
                    <td className="text-center p-3">{lhMobile.lcp}</td>
                    <td className="text-center p-3">{lhMobile.lcp - lhDesktop.lcp}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">CLS</td>
                    <td className="text-center p-3">{lhDesktop.cls?.toFixed(3)}</td>
                    <td className="text-center p-3">{lhMobile.cls?.toFixed(3)}</td>
                    <td className="text-center p-3">{(lhMobile.cls - lhDesktop.cls).toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
