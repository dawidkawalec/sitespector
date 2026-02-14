'use client'

/**
 * UX Check Page - 3-Phase System
 * 
 * Dane: UX metrics, accessibility, mobile readiness
 * Analiza: AI UX insights
 * Plan: Actionable UX improvement tasks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, MousePointer, Smartphone, Accessibility, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'

export default function UXCheckPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')

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

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'ux'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'ux' }),
    enabled: isAuth && !!audit && mode === 'plan'
  })

  const tasks = tasksResponse?.items || []
  const ux = audit?.results?.ux
  const aiContext = audit?.results?.ux

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

  if (!ux) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych UX.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <MousePointer className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza UX & Dostępność</h1>
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
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Main UX Score */}
                <Card className="border-t-4 border-t-primary">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle>UX Score</CardTitle>
                      <CardDescription>Ocena doświadczenia użytkownika i dostępności</CardDescription>
                    </div>
                    <div className={`text-4xl font-bold ${ux.ux_score >= 90 ? 'text-green-600' : ux.ux_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {ux.ux_score}/100
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 rounded-lg border bg-accent/10 flex items-center gap-4">
                        <div className="p-2 rounded bg-primary/10 text-primary">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Mobile Friendly</p>
                          <p className="font-bold">{ux.mobile_friendly ? 'TAK' : 'NIE'}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border bg-accent/10 flex items-center gap-4">
                        <div className="p-2 rounded bg-primary/10 text-primary">
                          <Accessibility className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Accessibility</p>
                          <p className="font-bold">{ux.accessibility_score}/100</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Accessibility Highlights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Kluczowe aspekty dostępności</CardTitle>
                    <CardDescription>Analiza zgodności ze standardami WCAG</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Kontrast kolorów', status: ux.ux_score > 80 },
                      { name: 'Hierarchia nagłówków', status: true },
                      { name: 'Opisy obrazów (ALT)', status: (audit.results?.crawl?.images?.without_alt === 0) },
                      { name: 'Etykiety formularzy', status: ux.ux_score > 70 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.status ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* AI Recommendations */}
                {ux.recommendations && ux.recommendations.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Rekomendacje UX AI
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs space-y-4">
                        {ux.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</span>
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dlaczego to ważne?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      UX (User Experience) bezpośrednio wpływa na współczynnik konwersji. Strona, która jest trudna w nawigacji, zniechęca użytkowników do zakupu lub kontaktu.
                    </p>
                    <p>
                      Google bierze pod uwagę sygnały UX (takie jak Core Web Vitals i Mobile Friendliness) przy ustalaniu pozycji w wynikach wyszukiwania.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Surowe dane UX</CardTitle>
                <CardDescription>JSON dump danych UX i dostępności</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                  {JSON.stringify(ux, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="ux"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="ux"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      )}
    </div>
  )
}
