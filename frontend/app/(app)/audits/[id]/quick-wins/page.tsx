'use client'

/**
 * Quick Wins Page
 * 
 * Aggregates issues from all sections and prioritizes them based on impact.
 * Helps users focus on the most important tasks first.
 * Enriched with AI-prioritization and backend generation.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, CheckCircle2, AlertCircle, Clock, ArrowUpCircle, Target, RefreshCw, Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/utils'
import type { Audit } from '@/lib/api'

interface QuickWin {
  id?: string
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
      if (!session) router.push('/login')
    }
    checkAuth()
    
    const saved = localStorage.getItem(`quick-wins-${params.id}`)
    if (saved) setCompletedWins(JSON.parse(saved))
  }, [router, params.id])

  const { data: audit, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  const { data: quickWins, isLoading: isLoadingWins, refetch: refetchWins } = useQuery({
    queryKey: ['quick-wins', params.id],
    queryFn: () => auditsAPI.getQuickWins(params.id),
    enabled: isAuth && !!audit,
  })

  if (!isAuth || isLoadingAudit || isLoadingWins) {
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

  const wins = quickWins || []

  const toggleWin = (title: string) => {
    const newCompleted = completedWins.includes(title)
      ? completedWins.filter(t => t !== title)
      : [...completedWins, title]
    
    setCompletedWins(newCompleted)
    localStorage.setItem(`quick-wins-${params.id}`, JSON.stringify(newCompleted))
  }

  const progress = wins.length > 0 ? (completedWins.length / wins.length) * 100 : 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Quick Wins</h1>
            <p className="text-muted-foreground">Najważniejsze zadania do wykonania "na już" (AI Prioritized)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => {
            refetchWins()
            toast.success('Odświeżono listę zadań')
          }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Odśwież
          </Button>
          <Card className="w-full md:w-64">
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Postęp prac</span>
                <span className="text-sm font-bold">{formatNumber(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
        <CardContent className="py-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Quick Wins są generowane automatycznie przez AI na bazie danych z audytu. Po wprowadzeniu zmian na stronie, wykonaj ponowny audyt, aby zaktualizować tę listę.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {wins.length > 0 ? (
            wins.map((win, idx) => (
              <Card key={idx} className={`transition-all duration-300 ${completedWins.includes(win.title) ? 'opacity-50 grayscale' : 'hover:shadow-md hover:border-primary/30'}`}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-6">
                    <div className="pt-1">
                      <Checkbox 
                        checked={completedWins.includes(win.title)} 
                        onCheckedChange={() => toggleWin(win.title)}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold text-lg ${completedWins.includes(win.title) ? 'line-through' : ''}`}>{win.title}</h3>
                        <Badge variant="outline" className="text-[10px] font-bold">{win.category}</Badge>
                        <Badge variant={win.impact === 'high' ? 'destructive' : 'default'} className="text-[10px] font-bold">
                          IMPACT: {win.impact.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{win.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" /> Trudność: <span className="capitalize">{win.effort}</span>
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
                Nasz algorytm AI analizuje setki parametrów Twojej witryny, aby wyłonić te, których poprawa przyniesie <strong>największy wzrost widoczności</strong> przy <strong>minimalnym nakładzie czasu</strong>.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                  <div>
                    <p className="font-bold text-foreground">Wysoki Wpływ (High Impact)</p>
                    <p>Krytyczne błędy techniczne, które blokują indeksowanie lub drastycznie spowalniają stronę.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1" />
                  <div>
                    <p className="font-bold text-foreground">Średni Wpływ (Medium Impact)</p>
                    <p>Optymalizacje treści i meta tagów, które poprawiają CTR i relewantność na słowa kluczowe.</p>
                  </div>
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
                <span className="font-bold">{wins.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-green-600">
                <span className="font-medium">Ukończone</span>
                <span className="font-bold">{completedWins.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-red-600">
                <span className="font-medium">Do zrobienia</span>
                <span className="font-bold">{wins.length - completedWins.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
