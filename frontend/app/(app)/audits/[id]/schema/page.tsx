'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI, type Audit } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { AlertTriangle, CheckCircle2, Code2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

function priorityBadgeClass(priority: string): string {
  if (priority === 'critical') return 'bg-red-100 text-red-700 border-red-300'
  if (priority === 'high') return 'bg-orange-100 text-orange-700 border-orange-300'
  if (priority === 'medium') return 'bg-amber-100 text-amber-700 border-amber-300'
  return 'bg-muted text-muted-foreground'
}

const SCHEMA_SNIPPETS: Array<{ title: string; code: string }> = [
  {
    title: 'Organization / LocalBusiness',
    code: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nazwa Firmy",
  "url": "https://twojadomena.pl",
  "logo": "https://twojadomena.pl/logo.png",
  "sameAs": ["https://www.facebook.com/twojprofil"]
}`,
  },
  {
    title: 'WebSite + SearchAction',
    code: `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://twojadomena.pl/",
  "name": "Nazwa Serwisu",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://twojadomena.pl/szukaj?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}`,
  },
  {
    title: 'BreadcrumbList',
    code: `{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Home","item":"https://twojadomena.pl/"},
    {"@type":"ListItem","position":2,"name":"Kategoria","item":"https://twojadomena.pl/kategoria/"}
  ]
}`,
  },
  {
    title: 'FAQPage',
    code: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Czy dostawa jest darmowa?",
    "acceptedAnswer": {"@type":"Answer","text":"Tak, od 199 PLN."}
  }]
}`,
  },
]

export default function SchemaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
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
      return isRunning || isAiRunning || isPlanRunning ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'schema'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'schema' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const crawl = audit?.results?.crawl || {}
  const schemaV2 = crawl?.structured_data_v2 || {}
  const schemaLegacy = crawl?.structured_data || {}
  const seoAi = audit?.results?.ai_contexts?.seo || {}

  const schemaItems = useMemo(() => {
    const items = schemaV2?.items
    if (Array.isArray(items) && items.length > 0) return items
    return Array.isArray(schemaLegacy?.schemas) ? schemaLegacy.schemas : []
  }, [schemaLegacy?.schemas, schemaV2?.items])

  const schemaTypes = useMemo(() => {
    const v2Types = schemaV2?.types
    if (Array.isArray(v2Types) && v2Types.length > 0) return v2Types
    return Array.isArray(schemaLegacy?.types) ? schemaLegacy.types : []
  }, [schemaLegacy?.types, schemaV2?.types])

  const missingPriority = useMemo(() => {
    const v2Missing = schemaV2?.missing_priority_types
    if (Array.isArray(v2Missing) && v2Missing.length > 0) return v2Missing
    return Array.isArray(schemaLegacy?.missing_suggestions) ? schemaLegacy.missing_suggestions : []
  }, [schemaLegacy?.missing_suggestions, schemaV2?.missing_priority_types])

  const found = Boolean(schemaV2?.found || schemaLegacy?.found)
  const readiness = schemaV2?.ai_crawler_readiness || {}
  const readinessScore = Number(readiness?.score || 0)
  const readinessColor =
    readinessScore >= 75 ? 'text-green-600' : readinessScore >= 45 ? 'text-amber-600' : 'text-red-600'
  const semantic = crawl?.semantic_html || {}
  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.schema

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (_error) {
      toast.error('Nie udalo sie zaktualizowac zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (_error) {
      toast.error('Nie udalo sie zapisac notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczeto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udalo sie uruchomic generowania planu')
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Code2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Schema.org</h1>
          <p className="text-muted-foreground text-sm">Ocena gotowości danych strukturalnych dla SEO i crawlerów AI.</p>
        </div>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter((t) => t.status === 'pending').length}
        hasAiData={!!aiContext}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="raw">RAW</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 @md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Schema AI/SEO Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${readinessColor}`}>{readinessScore}</div>
                <p className="text-xs text-muted-foreground mt-1">0-100, im wyżej tym lepiej</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Obiekty Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(schemaV2?.total_items || schemaLegacy?.count || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Wykryte obiekty JSON-LD</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Typy Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{schemaTypes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Unikalne typy wykryte na stronie</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Luki priorytetowe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${missingPriority.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {missingPriority.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Brakujące typy o wysokim wpływie</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Semantic HTML</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${Number(semantic?.score || 0) >= 75 ? 'text-green-600' : Number(semantic?.score || 0) >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                  {Number(semantic?.score || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ocena struktury semantycznej strony</p>
              </CardContent>
            </Card>
          </div>

          {seoAi?.technical_story_for_client && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI: Co to znaczy dla biznesu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{seoAi.technical_story_for_client}</p>
              </CardContent>
            </Card>
          )}

          {!found ? (
            <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Brak danych Schema.org
                </CardTitle>
                <CardDescription>Brak schema ogranicza rich results i zrozumienie strony przez crawlery AI.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Wykryte typy i jakość wdrożenia</CardTitle>
                <CardDescription>Lista obiektów Schema z priorytetem i brakami pól.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {schemaItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak szczegółowych obiektów do wyświetlenia.</p>
                ) : (
                  <div className="space-y-3">
                    {schemaItems.slice(0, 30).map((item: any, idx: number) => {
                      const missingRequired = Array.isArray(item?.missing_required) ? item.missing_required : []
                      const missingRecommended = Array.isArray(item?.missing_recommended) ? item.missing_recommended : []
                      return (
                        <div key={`${item?.type || 'schema'}-${idx}`} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold">{item?.type || 'Unknown'}</span>
                            <Badge variant="outline" className={priorityBadgeClass(String(item?.priority || 'low'))}>
                              {String(item?.priority || 'low')}
                            </Badge>
                            {item?.has_issues ? (
                              <Badge variant="destructive">Wymaga poprawy</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-green-700 border-green-300 bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {missingRequired.length > 0 && (
                              <p>
                                <span className="font-medium text-foreground">Braki wymagane:</span>{' '}
                                {missingRequired.join(', ')}
                              </p>
                            )}
                            {missingRecommended.length > 0 && (
                              <p>
                                <span className="font-medium text-foreground">Braki rekomendowane:</span>{' '}
                                {missingRecommended.join(', ')}
                              </p>
                            )}
                            {missingRequired.length === 0 && missingRecommended.length === 0 && (
                              <p>Brak krytycznych braków pól.</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {missingPriority.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Priorytetowe braki Schema</CardTitle>
                <CardDescription>Elementy do wdrożenia w pierwszej kolejności.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {missingPriority.map((item: string, idx: number) => (
                    <li key={`${item}-${idx}`} className="flex gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(Array.isArray(seoAi?.schema_recommendations) && seoAi.schema_recommendations.length > 0) && (
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader>
                <CardTitle className="text-base">AI: Rekomendacje Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {seoAi.schema_recommendations.slice(0, 8).map((rec: string, idx: number) => (
                    <li key={`${rec}-${idx}`} className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Praktyczne snippet-y JSON-LD</CardTitle>
              <CardDescription>Wzorce startowe do szybkiego wdrożenia po stronie frontend/backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SCHEMA_SNIPPETS.map((snippet) => (
                <div key={snippet.title} className="rounded-lg border p-3">
                  <p className="font-medium mb-2">{snippet.title}</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {snippet.code}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jak wdrożyć i zweryfikować</CardTitle>
              <CardDescription>Checklista operacyjna po implementacji Schema.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-6 space-y-2 text-sm">
                <li>
                  Wstaw JSON-LD w <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> w finalnym HTML strony.
                </li>
                <li>Uzupełnij pola wymagane i rekomendowane dla każdego typu (np. Organization, Breadcrumb, Product).</li>
                <li>Zweryfikuj kluczowe URL-e w Google Rich Results Test.</li>
                <li>Sprawdź raporty „Ulepszenia” w Google Search Console po ponownej indeksacji.</li>
                <li>Monitoruj wpływ na CTR oraz stabilność widoczności TOP10.</li>
              </ol>
            </CardContent>
          </Card>

          {(Array.isArray(semantic?.issues) && semantic.issues.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Semantic HTML — wykryte problemy</CardTitle>
                <CardDescription>Elementy struktury HTML wpływające na SEO i zrozumienie treści.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {semantic.issues.slice(0, 8).map((issue: string, idx: number) => (
                    <li key={`${issue}-${idx}`} className="flex gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="raw" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Surowe dane Schema</CardTitle>
              <CardDescription>Dump JSON dla structured_data_v2, structured_data, render_nojs, soft_404.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[700px]">
                {JSON.stringify(
                  {
                    structured_data_v2: schemaV2,
                    structured_data: schemaLegacy,
                    render_nojs: crawl?.render_nojs || {},
                    soft_404: crawl?.soft_404 || {},
                    directives_hreflang: crawl?.directives_hreflang || {},
                    semantic_html: crawl?.semantic_html || {},
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView area="schema" aiContext={aiContext} isLoading={audit?.ai_status === 'processing'} />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="schema"
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
