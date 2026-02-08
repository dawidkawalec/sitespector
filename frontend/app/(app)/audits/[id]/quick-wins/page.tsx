'use client'

/**
 * Quick Wins Page
 * 
 * Aggregates issues from all sections and prioritizes them based on impact.
 * Helps users focus on the most important tasks first.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, CheckCircle2, AlertCircle, Clock, ArrowUpCircle, Target } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { Audit } from '@/lib/api'

interface QuickWin {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  category: string
}

export default function QuickWinsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [completedWins, setCompletedWins] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
    
    // Load completed wins from local storage
    const saved = localStorage.getItem(`quick-wins-${params.id}`)
    if (saved) setCompletedWins(JSON.parse(saved))
  }, [router, params.id])

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

  const results = audit.results
  const quickWins: QuickWin[] = []

  // 1. Technical SEO Wins
  if (results?.crawl?.technical_seo?.broken_links > 0) {
    quickWins.push({
      id: 'broken-links',
      title: 'Napraw niedziałające linki (404)',
      description: `Znaleziono ${results.crawl.technical_seo.broken_links} błędnych linków. Ich naprawa natychmiast poprawi UX i crawl budget.`,
      impact: 'high',
      effort: 'medium',
      category: 'SEO'
    })
  }

  if (results?.crawl?.technical_seo?.missing_canonical > 0) {
    quickWins.push({
      id: 'missing-canonical',
      title: 'Dodaj tagi canonical',
      description: `${results.crawl.technical_seo.missing_canonical} stron nie ma tagu canonical. Zapobiega to duplikacji treści.`,
      impact: 'medium',
      effort: 'easy',
      category: 'SEO'
    })
  }

  // 2. Image Wins
  if (results?.crawl?.images?.without_alt > 0) {
    quickWins.push({
      id: 'missing-alt',
      title: 'Uzupełnij atrybuty ALT w obrazach',
      description: `${results.crawl.images.without_alt} obrazów nie ma opisów. To kluczowe dla dostępności i SEO obrazów.`,
      impact: 'medium',
      effort: 'easy',
      category: 'Images'
    })
  }

  // 3. Performance Wins (Lighthouse Opportunities)
  const opportunities = results?.lighthouse?.desktop?.audits?.opportunities || []
  opportunities.slice(0, 3).forEach((opt: any, idx: number) => {
    quickWins.push({
      id: `perf-opt-${idx}`,
      title: opt.title,
      description: opt.description,
      impact: opt.score < 0.5 ? 'high' : 'medium',
      effort: 'medium',
      category: 'Performance'
    })
  })

  // 4. Content Wins
  if (results?.content_analysis?.word_count < 300) {
    quickWins.push({
      id: 'low-word-count',
      title: 'Rozbuduj treść na stronie głównej',
      description: 'Strona główna ma mniej niż 300 słów. Dodaj wartościową treść, aby poprawić rankingi.',
      impact: 'high',
      effort: 'hard',
      category: 'Content'
    })
  }

  const toggleWin = (id: string) => {
    const newCompleted = completedWins.includes(id)
      ? completedWins.filter(winId => winId !== id)
      : [...completedWins, id]
    
    setCompletedWins(newCompleted)
    localStorage.setItem(`quick-wins-${params.id}`, JSON.stringify(newCompleted))
  }

  const sortedWins = [...quickWins].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 }
    const effortOrder = { easy: 0, medium: 1, hard: 2 }
    return impactOrder[a.impact] - impactOrder[b.impact] || effortOrder[a.effort] - effortOrder[b.effort]
  })

  const progress = Math.round((completedWins.length / quickWins.length) * 100) || 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Quick Wins</h1>
            <p className="text-muted-foreground">Najważniejsze zadania do wykonania "na już"</p>
          </div>
        </div>
        
        <Card className="w-full md:w-64">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Postęp prac</span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {sortedWins.length > 0 ? (
            sortedWins.map((win) => (
              <Card key={win.id} className={`transition-opacity ${completedWins.includes(win.id) ? 'opacity-50' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-6">
                    <div className="pt-1">
                      <Checkbox 
                        checked={completedWins.includes(win.id)} 
                        onCheckedChange={() => toggleWin(win.id)}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold ${completedWins.includes(win.id) ? 'line-through' : ''}`}>{win.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{win.category}</Badge>
                        <Badge variant={win.impact === 'high' ? 'destructive' : 'default'} className="text-[10px]">
                          IMPACT: {win.impact.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{win.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> Trudność: {win.effort}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Brak pilnych zadań!</h3>
                <p className="text-sm text-muted-foreground">Twoja strona jest w świetnej formie.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" /> Strategia działania
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Lista Quick Wins jest generowana automatycznie na podstawie analizy Twojej witryny. 
                Priorytetyzujemy zadania o <strong>wysokim wpływie (High Impact)</strong> i 
                <strong>niskim nakładzie pracy (Easy Effort)</strong>.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Czerwone: Krytyczne błędy SEO/Wydajności</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Żółte: Istotne optymalizacje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Niebieskie: Dobre praktyki</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Podsumowanie planu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Wszystkie zadania</span>
                <span className="font-bold">{quickWins.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-green-600">
                <span className="font-medium">Ukończone</span>
                <span className="font-bold">{completedWins.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-red-600">
                <span className="font-medium">Do zrobienia</span>
                <span className="font-bold">{quickWins.length - completedWins.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
