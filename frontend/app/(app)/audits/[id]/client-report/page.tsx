'use client'

/**
 * Client Report Page — Interactive report builder for clients.
 *
 * Sections: Scores, CWV, Visibility, Technical, Content Quality,
 * AI Strategy, Quick Wins, Roadmap, Executive Summary, Comparison.
 * Supports workspace branding (logo + contact).
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, brandingAPI, type BrandingSettings } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, FileText, Download, Eye, Settings2, Layout, Type,
  CheckCircle2, ArrowLeftRight, TrendingUp, Gauge, Globe,
  Wrench, BarChart3, Route, Sparkles,
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { formatScore, cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

function ScoreCard({ label, value, color }: { label: string; value: number | null; color?: string }) {
  return (
    <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100">
      <p className="text-sm font-bold text-slate-500 uppercase mb-2">{label}</p>
      <p className={cn('text-3xl @md:text-4xl font-black', color || 'text-primary')}>{value ?? '—'}%</p>
    </div>
  )
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="text-xl @md:text-2xl font-bold mb-6 flex items-center gap-2">
      {icon} {children}
    </h3>
  )
}

export default function ClientReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  const [isAuth, setIsAuth] = useState(false)

  // Customization State
  const [clientName, setClientName] = useState('')
  const [reportTitle, setReportTitle] = useState('Raport Optymalizacji SEO & Performance')
  const [showScores, setShowScores] = useState(true)
  const [showCWV, setShowCWV] = useState(true)
  const [showVisibility, setShowVisibility] = useState(true)
  const [showTechnical, setShowTechnical] = useState(true)
  const [showContentQuality, setShowContentQuality] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [showQuickWins, setShowQuickWins] = useState(true)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showExecSummary, setShowExecSummary] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonId, setComparisonId] = useState<string>('')
  const [customNote, setCustomNote] = useState('')

  const { currentWorkspace } = useWorkspace()

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

  const { data: branding } = useQuery({
    queryKey: ['branding', currentWorkspace?.id],
    queryFn: () => brandingAPI.get(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  })

  const { data: history } = useQuery({
    queryKey: ['audit-history', audit?.url, currentWorkspace?.id],
    queryFn: () => auditsAPI.getHistory(currentWorkspace!.id, audit!.url),
    enabled: !!audit?.url && !!currentWorkspace?.id && showComparison,
  })

  const comparisonAudit = history?.find((a: any) => a.id === comparisonId)

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `${reportTitle} - ${clientName || audit?.url}`,
  })

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) return null

  // Data extraction
  const lh = audit.results?.lighthouse?.desktop
  const lhMobile = audit.results?.lighthouse?.mobile
  const crawl = audit.results?.crawl
  const senuto = audit.results?.senuto?.visibility
  const cqi = audit.results?.content_quality_index
  const roadmap = audit.results?.roadmap
  const execSummary = audit.results?.executive_summary
  const quickWins = audit.results?.quick_wins || []

  const logoUrl = branding?.branding_logo_url || '/sitespector_logo_dark.svg'
  const logoAlt = branding?.branding_company_name || 'SiteSpector'
  const contactUrl = branding?.branding_contact_url || 'sitespector.app'

  const sections = [
    { id: 'scores', label: 'Glowne wyniki', checked: showScores, set: setShowScores },
    { id: 'cwv', label: 'Core Web Vitals', checked: showCWV, set: setShowCWV },
    { id: 'visibility', label: 'Widocznosc (Senuto)', checked: showVisibility, set: setShowVisibility },
    { id: 'tech', label: 'Problemy techniczne', checked: showTechnical, set: setShowTechnical },
    { id: 'cqi', label: 'Jakosc tresci (CQI)', checked: showContentQuality, set: setShowContentQuality },
    { id: 'ai', label: 'Analiza strategiczna AI', checked: showAI, set: setShowAI },
    { id: 'wins', label: 'Quick Wins', checked: showQuickWins, set: setShowQuickWins },
    { id: 'roadmap', label: 'Roadmap', checked: showRoadmap, set: setShowRoadmap },
    { id: 'exec', label: 'Executive Summary (AI)', checked: showExecSummary, set: setShowExecSummary },
    { id: 'compare', label: 'Porownanie przed/po', checked: showComparison, set: setShowComparison },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 @md:px-6 @md:py-8 space-y-6 @md:space-y-8 min-w-0">
      {/* Header */}
      <div className="flex flex-col @md:flex-row @md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Generator Raportu dla Klienta</h1>
            <p className="text-muted-foreground text-sm">Dostosuj i wygeneruj profesjonalny raport dla swojego klienta.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="w-full @md:w-auto" onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}>
            <Eye className="mr-2 h-4 w-4" /> Podglad
          </Button>
          <Button className="w-full @md:w-auto" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Eksportuj PDF
          </Button>
        </div>
      </div>

      {/* Cross-link to PDF reports */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Potrzebujesz pelnej analizy technicznej (50-150 stron)?</p>
          <p className="text-xs text-muted-foreground">Raporty PDF — Executive, Standard lub Full z brandingiem.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/audits/${params.id}/pdf`}>Raporty PDF</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" /> Konfiguracja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Nazwa klienta / projektu</Label>
                <Input id="client" placeholder="np. Acme Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Tytul raportu</Label>
                <Input id="title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Sekcje raportu</Label>
                {sections.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox id={s.id} checked={s.checked} onCheckedChange={(v) => s.set(!!v)} />
                    <label htmlFor={s.id} className="text-sm font-medium leading-none cursor-pointer">{s.label}</label>
                  </div>
                ))}
              </div>

              {showComparison && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Wybierz audyt do porownania</Label>
                  <Select value={comparisonId} onValueChange={setComparisonId}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Wybierz poprzedni audyt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {history?.filter((a: any) => a.id !== audit.id).map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {new Date(a.created_at).toLocaleDateString()} (Score: {formatScore(a.overall_score || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="note">Wstep / notatka od autora</Label>
                <textarea
                  id="note"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Dodaj spersonalizowana wiadomosc dla klienta..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        <div className="@lg:col-span-2 min-w-0">
          <div ref={reportRef} className="bg-white text-slate-900 shadow-2xl rounded-xl overflow-hidden min-h-[760px] @md:min-h-[900px] w-full p-5 @md:p-8 @lg:p-10 print:p-8 print:shadow-none min-w-0">

            {/* Report Header */}
            <div className="flex flex-col @md:flex-row @md:justify-between @md:items-start gap-4 border-b-4 border-primary pb-6 @md:pb-8 mb-8 @md:mb-12">
              <div className="min-w-0">
                <h2 className="text-2xl @md:text-3xl @lg:text-4xl font-extrabold text-slate-900 mb-2 break-words">{reportTitle}</h2>
                <p className="text-base @md:text-lg @lg:text-xl text-slate-500 break-words">{clientName || audit.url}</p>
              </div>
              <div className="text-left @md:text-right shrink-0">
                {branding?.branding_logo_url ? (
                  <img src={branding.branding_logo_url} alt={logoAlt} className="mb-3 h-8 w-auto max-w-[220px] object-contain @md:ml-auto" />
                ) : (
                  <Image src="/sitespector_logo_dark.svg" alt="SiteSpector" width={3068} height={759} unoptimized className="mb-3 h-8 w-auto max-w-[220px] object-contain @md:ml-auto" />
                )}
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Data raportu</p>
                <p className="text-base @md:text-lg font-medium">{new Date().toLocaleDateString('pl-PL')}</p>
              </div>
            </div>

            {/* Author's Note */}
            {customNote && (
              <div className="mb-12 p-6 bg-slate-50 border-l-4 border-slate-300 italic text-slate-700">{customNote}</div>
            )}

            {/* Executive Summary */}
            {showExecSummary && execSummary && (
              <section className="mb-12">
                <SectionHeading icon={<Sparkles className="h-6 w-6 text-primary" />}>Executive Summary</SectionHeading>
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                  {typeof execSummary === 'string' ? (
                    <p className="text-slate-700 leading-relaxed">{execSummary}</p>
                  ) : (
                    <>
                      {execSummary.summary && <p className="text-slate-700 leading-relaxed">{execSummary.summary}</p>}
                      {execSummary.key_findings && (
                        <ul className="text-sm space-y-1 text-slate-600 mt-3">
                          {execSummary.key_findings.slice(0, 5).map((f: string, i: number) => (
                            <li key={i} className="flex gap-2">• {f}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Comparison */}
            {showComparison && comparisonAudit && (
              <section className="mb-12">
                <SectionHeading icon={<ArrowLeftRight className="h-6 w-6 text-primary" />}>Postepy optymalizacji</SectionHeading>
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-8">
                  <div className="grid grid-cols-1 @md:grid-cols-2 gap-8 @md:gap-12">
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase mb-4">Stan poczatkowy ({new Date(comparisonAudit.created_at).toLocaleDateString()})</p>
                      <div className="text-4xl @md:text-5xl font-black text-slate-400">{formatScore(comparisonAudit.overall_score || 0)}%</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary uppercase mb-4">Stan obecny ({new Date(audit.created_at).toLocaleDateString()})</p>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl @md:text-5xl font-black text-primary">{formatScore(audit.overall_score || 0)}%</div>
                        {(() => {
                          const d = (audit.overall_score || 0) - (comparisonAudit.overall_score || 0)
                          return d !== 0 && (
                            <div className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-sm @md:text-lg font-bold', d > 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100')}>
                              <TrendingUp className="h-5 w-5" />
                              {d > 0 ? '+' : ''}{formatScore(d)}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-primary/10 grid grid-cols-1 @md:grid-cols-4 gap-4">
                    {[
                      { label: 'SEO', cur: audit.seo_score, prev: comparisonAudit.seo_score },
                      { label: 'Wydajnosc', cur: audit.performance_score, prev: comparisonAudit.performance_score },
                      { label: 'Tresc', cur: audit.content_score, prev: comparisonAudit.content_score },
                      { label: 'Ogolny', cur: audit.overall_score, prev: comparisonAudit.overall_score },
                    ].map((s, i) => {
                      const delta = (s.cur || 0) - (s.prev || 0)
                      return (
                        <div key={i} className="text-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{s.label}</p>
                          <p className={cn('text-sm font-bold', delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-slate-400')}>
                            {delta > 0 ? `+${formatScore(delta)}` : `${formatScore(delta)}`}%
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Main Scores */}
            {showScores && (
              <section className="mb-12">
                <SectionHeading icon={<Layout className="h-6 w-6 text-primary" />}>Podsumowanie wynikow</SectionHeading>
                <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 @md:gap-6">
                  <ScoreCard label="Ogolny" value={audit.overall_score} />
                  <ScoreCard label="SEO" value={audit.seo_score} />
                  <ScoreCard label="Wydajnosc" value={audit.performance_score} />
                  <ScoreCard label="Tresc" value={audit.content_score} />
                </div>
              </section>
            )}

            {/* Core Web Vitals */}
            {showCWV && lh && (
              <section className="mb-12">
                <SectionHeading icon={<Gauge className="h-6 w-6 text-primary" />}>Core Web Vitals</SectionHeading>
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-6">
                  {[
                    { label: 'Desktop', data: lh },
                    { label: 'Mobile', data: lhMobile },
                  ].filter(d => d.data).map((device) => {
                    const metrics = device.data?.metrics || device.data?.raw?.audits || {}
                    const perf = device.data?.performance_score ?? device.data?.raw?.categories?.performance?.score
                    const perfScore = typeof perf === 'number' ? (perf <= 1 ? Math.round(perf * 100) : perf) : null
                    const lcp = metrics['largest-contentful-paint']?.numericValue || metrics.lcp
                    const cls = metrics['cumulative-layout-shift']?.numericValue ?? metrics.cls
                    const fid = metrics['total-blocking-time']?.numericValue || metrics.tbt || metrics.fid
                    return (
                      <div key={device.label} className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                        <p className="text-sm font-bold text-slate-500 uppercase mb-4">{device.label} {perfScore != null && <span className="text-primary">({perfScore}%)</span>}</p>
                        <div className="space-y-3">
                          {lcp != null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">LCP</span>
                              <span className={cn('font-bold', lcp < 2500 ? 'text-green-600' : lcp < 4000 ? 'text-amber-600' : 'text-red-600')}>
                                {(lcp / 1000).toFixed(2)}s
                              </span>
                            </div>
                          )}
                          {cls != null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">CLS</span>
                              <span className={cn('font-bold', cls < 0.1 ? 'text-green-600' : cls < 0.25 ? 'text-amber-600' : 'text-red-600')}>
                                {Number(cls).toFixed(3)}
                              </span>
                            </div>
                          )}
                          {fid != null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">TBT</span>
                              <span className={cn('font-bold', fid < 200 ? 'text-green-600' : fid < 600 ? 'text-amber-600' : 'text-red-600')}>
                                {Math.round(fid)}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Visibility (Senuto) */}
            {showVisibility && senuto && (
              <section className="mb-12">
                <SectionHeading icon={<Globe className="h-6 w-6 text-primary" />}>Widocznosc w Google</SectionHeading>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
                    <p className="text-2xl font-black text-green-700">{senuto.top3_count ?? senuto.top3 ?? 0}</p>
                    <p className="text-xs font-bold text-green-600 uppercase">TOP 3</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
                    <p className="text-2xl font-black text-blue-700">{senuto.top10_count ?? senuto.top10 ?? 0}</p>
                    <p className="text-xs font-bold text-blue-600 uppercase">TOP 10</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                    <p className="text-2xl font-black text-slate-700">{senuto.top50_count ?? senuto.top50 ?? 0}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">TOP 50</p>
                  </div>
                </div>
                {senuto.visibility_score != null && (
                  <p className="text-sm text-slate-500">Visibility Score: <span className="font-bold text-slate-700">{senuto.visibility_score}</span></p>
                )}
              </section>
            )}

            {/* Technical Issues */}
            {showTechnical && crawl && (
              <section className="mb-12">
                <SectionHeading icon={<Wrench className="h-6 w-6 text-primary" />}>Przeglad techniczny</SectionHeading>
                <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
                  {[
                    { label: 'Stron', value: crawl.pages_crawled || crawl.all_pages?.length || 0, color: 'text-slate-700' },
                    { label: 'Broken links', value: crawl.technical_seo?.broken_links || 0, color: (crawl.technical_seo?.broken_links || 0) > 0 ? 'text-red-600' : 'text-green-600' },
                    { label: 'Redirects', value: crawl.technical_seo?.redirects || 0, color: (crawl.technical_seo?.redirects || 0) > 5 ? 'text-amber-600' : 'text-green-600' },
                    { label: 'Brak meta desc.', value: crawl.meta_description_issues?.missing || crawl.technical_seo?.missing_descriptions || 0, color: 'text-amber-600' },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                      <p className={cn('text-2xl font-black', m.color)}>{m.value}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase">{m.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Content Quality */}
            {showContentQuality && cqi && (
              <section className="mb-12">
                <SectionHeading icon={<BarChart3 className="h-6 w-6 text-primary" />}>Jakosc tresci</SectionHeading>
                <div className="flex items-center gap-6 mb-4">
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 text-center">
                    <p className="text-4xl font-black text-primary">{cqi.score ?? cqi.overall_score ?? '—'}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">CQI Score</p>
                  </div>
                  {cqi.grade && (
                    <div className={cn('text-5xl font-black', cqi.grade === 'A' ? 'text-green-600' : cqi.grade === 'B' ? 'text-blue-600' : cqi.grade === 'C' ? 'text-amber-600' : 'text-red-600')}>
                      {cqi.grade}
                    </div>
                  )}
                </div>
                {cqi.issues && cqi.issues.length > 0 && (
                  <ul className="text-sm space-y-1 text-slate-600">
                    {cqi.issues.slice(0, 5).map((issue: any, i: number) => (
                      <li key={i} className="flex gap-2">• {typeof issue === 'string' ? issue : issue.title || issue.message || JSON.stringify(issue)}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* AI Summary */}
            {showAI && audit.results?.content_analysis?.summary && (
              <section className="mb-12">
                <SectionHeading icon={<Type className="h-6 w-6 text-primary" />}>Analiza strategiczna</SectionHeading>
                <div className="space-y-6">
                  <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-bold text-primary mb-2">Podsumowanie AI:</p>
                    <p className="text-slate-700 leading-relaxed break-words">{audit.results.content_analysis.summary}</p>
                  </div>
                  {audit.results.competitive_analysis && (
                    <div className="grid grid-cols-1 @md:grid-cols-2 gap-6">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="font-bold text-green-700 mb-2 text-sm uppercase">Mocne strony:</p>
                        <ul className="text-sm space-y-1 text-slate-600">
                          {audit.results.competitive_analysis.strengths?.slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="flex gap-2">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="font-bold text-amber-700 mb-2 text-sm uppercase">Obszary do poprawy:</p>
                        <ul className="text-sm space-y-1 text-slate-600">
                          {audit.results.competitive_analysis.opportunities?.slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="flex gap-2">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Quick Wins */}
            {showQuickWins && (
              <section className="mb-12">
                <SectionHeading icon={<CheckCircle2 className="h-6 w-6 text-primary" />}>Quick Wins</SectionHeading>
                <div className="space-y-4">
                  {quickWins.length > 0 ? (
                    quickWins.slice(0, 10).map((win: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 border rounded-lg bg-slate-50 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <div>
                          <p className="font-bold text-slate-800 break-words">{win.title}</p>
                          {win.description && <p className="text-sm text-slate-500 break-words">{win.description}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl text-center border border-slate-100">
                      <p className="text-sm text-slate-400 italic">Brak danych Quick Wins.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Roadmap */}
            {showRoadmap && roadmap && (
              <section className="mb-12">
                <SectionHeading icon={<Route className="h-6 w-6 text-primary" />}>Roadmap</SectionHeading>
                <div className="space-y-4">
                  {['immediate', 'short_term', 'medium_term'].map((horizon) => {
                    const items = roadmap[horizon] || roadmap[horizon.replace('_', '-')] || []
                    if (!items.length) return null
                    const labels: Record<string, string> = { immediate: 'Natychmiast', short_term: 'Krotkoterminowe', medium_term: 'Srednioterminowe' }
                    const colors: Record<string, string> = { immediate: 'bg-red-50 border-red-100 text-red-700', short_term: 'bg-amber-50 border-amber-100 text-amber-700', medium_term: 'bg-green-50 border-green-100 text-green-700' }
                    return (
                      <div key={horizon}>
                        <p className={cn('text-xs font-bold uppercase px-3 py-1.5 rounded-t-lg border', colors[horizon])}>{labels[horizon]}</p>
                        <div className="border border-t-0 rounded-b-lg divide-y">
                          {items.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="p-3 text-sm">
                              <p className="font-medium text-slate-800">{item.title || item.name}</p>
                              {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="mt-auto pt-12 border-t border-slate-200 flex flex-col @md:flex-row @md:justify-between @md:items-center gap-3 text-slate-400 text-xs">
              {branding?.branding_logo_url ? (
                <img src={branding.branding_logo_url} alt={logoAlt} className="h-6 w-auto max-w-[180px] object-contain" />
              ) : (
                <Image src="/sitespector_logo_dark.svg" alt="SiteSpector" width={3068} height={759} unoptimized className="h-6 w-auto max-w-[180px] object-contain" />
              )}
              <p className="break-all">https://{contactUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
