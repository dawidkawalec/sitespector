'use client'

/**
 * Client Report Page
 * 
 * Interactive report builder for clients.
 * Allows customizing what data to show and adding notes.
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  FileText, 
  Download, 
  Eye, 
  Settings2, 
  Layout, 
  Type, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { formatScore, cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ClientReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  const [isAuth, setIsAuth] = useState(false)
  
  // Customization State
  const [clientName, setClientName] = useState('')
  const [reportTitle, setReportTitle] = useState('Raport Optymalizacji SEO & Performance')
  const [showScores, setShowScores] = useState(true)
  const [showTechnical, setShowTechnical] = useState(true)
  const [showAI, setShowAI] = useState(true)
  const [showQuickWins, setShowQuickWins] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonId, setComparisonId] = useState<string>("")
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

  // Fetch history for comparison
  const { data: history } = useQuery({
    queryKey: ['audit-history', audit?.url, currentWorkspace?.id],
    queryFn: () => auditsAPI.getHistory(currentWorkspace!.id, audit!.url),
    enabled: !!audit?.url && !!currentWorkspace?.id && showComparison,
  })

  const comparisonAudit = history?.find(a => a.id === comparisonId)

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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col @md:flex-row @md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Generator Raportu dla Klienta</h1>
            <p className="text-muted-foreground text-sm">Dostosuj i wygeneruj profesjonalny raport dla swojego klienta.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}>
            <Eye className="mr-2 h-4 w-4" /> Podgląd
          </Button>
          <Button onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Eksportuj PDF
          </Button>
        </div>
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
                <Label htmlFor="client">Nazwa Klienta / Projektu</Label>
                <Input 
                  id="client" 
                  placeholder="np. Acme Corp" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł Raportu</Label>
                <Input 
                  id="title" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Sekcje Raportu</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="scores" checked={showScores} onCheckedChange={(v) => setShowScores(!!v)} />
                  <label htmlFor="scores" className="text-sm font-medium leading-none cursor-pointer">Główne Wyniki</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="tech" checked={showTechnical} onCheckedChange={(v) => setShowTechnical(!!v)} />
                  <label htmlFor="tech" className="text-sm font-medium leading-none cursor-pointer">Analiza Techniczna</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ai" checked={showAI} onCheckedChange={(v) => setShowAI(!!v)} />
                  <label htmlFor="ai" className="text-sm font-medium leading-none cursor-pointer">Analiza Strategiczna AI</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="wins" checked={showQuickWins} onCheckedChange={(v) => setShowQuickWins(!!v)} />
                  <label htmlFor="wins" className="text-sm font-medium leading-none cursor-pointer">Quick Wins</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="compare" checked={showComparison} onCheckedChange={(v) => setShowComparison(!!v)} />
                  <label htmlFor="compare" className="text-sm font-medium leading-none cursor-pointer">Porównanie Przed/Po</label>
                </div>
              </div>

              {showComparison && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Wybierz audyt do porównania</Label>
                  <Select value={comparisonId} onValueChange={setComparisonId}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Wybierz poprzedni audyt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {history?.filter(a => a.id !== audit.id).map((a) => (
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
                <Label htmlFor="note">Wstęp / Notatka od Autora</Label>
                <textarea 
                  id="note"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Dodaj spersonalizowaną wiadomość dla klienta..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div 
            ref={reportRef} 
            className="bg-white text-slate-900 shadow-2xl rounded-xl overflow-hidden min-h-[1123px] w-full p-12 print:p-8 print:shadow-none"
          >
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-12">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{reportTitle}</h2>
                <p className="text-xl text-slate-500">{clientName || audit.url}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Data Raportu</p>
                <p className="text-lg font-medium">{new Date().toLocaleDateString('pl-PL')}</p>
              </div>
            </div>

            {/* Author's Note */}
            {customNote && (
              <div className="mb-12 p-6 bg-slate-50 border-l-4 border-slate-300 italic text-slate-700">
                {customNote}
              </div>
            )}

            {/* Comparison Section */}
            {showComparison && comparisonAudit && (
              <section className="mb-12 animate-in fade-in duration-500">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <ArrowLeftRight className="h-6 w-6 text-primary" /> Postępy Optymalizacji
                </h3>
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-8">
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase mb-4">Stan Początkowy ({new Date(comparisonAudit.created_at).toLocaleDateString()})</p>
                      <div className="text-5xl font-black text-slate-400">{formatScore(comparisonAudit.overall_score || 0)}%</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary uppercase mb-4">Stan Obecny ({new Date(audit.created_at).toLocaleDateString()})</p>
                      <div className="flex items-center gap-4">
                        <div className="text-5xl font-black text-primary">{formatScore(audit.overall_score || 0)}%</div>
                        <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-lg font-bold">
                          <TrendingUp className="h-5 w-5" />
                          +{formatScore((audit.overall_score || 0) - (comparisonAudit.overall_score || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-primary/10 grid grid-cols-3 gap-4">
                    {[
                      { label: 'SEO', cur: audit.seo_score, prev: comparisonAudit.seo_score },
                      { label: 'Wydajność', cur: audit.performance_score, prev: comparisonAudit.performance_score },
                      { label: 'Treść', cur: audit.content_score, prev: comparisonAudit.content_score },
                    ].map((s, i) => {
                      const delta = (s.cur || 0) - (s.prev || 0)
                      return (
                        <div key={i} className="text-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{s.label}</p>
                          <p className={cn("text-sm font-bold", delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-slate-400")}>
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
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Layout className="h-6 w-6 text-primary" /> Podsumowanie Wyników
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'SEO Score', val: audit.seo_score },
                    { label: 'Performance', val: audit.performance_score },
                    { label: 'Overall', val: audit.overall_score },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase mb-2">{s.label}</p>
                      <p className="text-4xl font-black text-primary">{s.val}%</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AI Summary */}
            {showAI && audit.results?.content_analysis?.summary && (
              <section className="mb-12">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Type className="h-6 w-6 text-primary" /> Analiza Strategiczna
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-bold text-primary mb-2">Podsumowanie AI:</p>
                    <p className="text-slate-700 leading-relaxed">{audit.results.content_analysis.summary}</p>
                  </div>
                  
                  {audit.results.competitive_analysis && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="font-bold text-green-700 mb-2 text-sm uppercase">Mocne Strony:</p>
                        <ul className="text-sm space-y-1 text-slate-600">
                          {audit.results.competitive_analysis.strengths?.slice(0,3).map((s: string, i: number) => (
                            <li key={i} className="flex gap-2">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="font-bold text-amber-700 mb-2 text-sm uppercase">Obszary do Poprawy:</p>
                        <ul className="text-sm space-y-1 text-slate-600">
                          {audit.results.competitive_analysis.opportunities?.slice(0,3).map((s: string, i: number) => (
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
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" /> Rekomendacje &quot;Quick Wins&quot;
                </h3>
                <div className="space-y-4">
                  {audit.results?.quick_wins && audit.results.quick_wins.length > 0 ? (
                    audit.results.quick_wins.map((win: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 border rounded-lg bg-slate-50">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                        <div>
                          <p className="font-bold text-slate-800">{win.title}</p>
                          <p className="text-sm text-slate-500">{win.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl text-center border border-slate-100">
                      <p className="text-sm text-muted-foreground italic">Brak krytycznych problemów wymagających natychmiastowej poprawy.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Technical Footer */}
            <div className="mt-auto pt-12 border-t border-slate-200 flex justify-between items-center text-slate-400 text-xs">
              <p>Wygenerowano przez SiteSpector AI Platform</p>
              <p>https://sitespector.pl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
