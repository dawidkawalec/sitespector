'use client'

/**
 * Images Analysis Page - 3-Phase System
 *
 * Dane: Summary metrics, size chart, image list, RAW
 * Analiza: AI image insights
 * Plan: Actionable image improvement tasks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, XCircle, HardDrive, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageSizeChart } from '@/components/AuditCharts'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function OverviewTab({ imagesData, allImages, params, generatingAlt, aiAlts, handleGenerateAlt }: { imagesData: any; allImages: any[]; params: any; generatingAlt: any; aiAlts: any; handleGenerateAlt: any }) {
  const largeImagesCount = allImages.filter((img: any) => img.size_bytes > 512000).length
  const altTextScore = imagesData.total > 0 ? (imagesData.with_alt / imagesData.total) * 100 : 100
  const sizeScore = imagesData.total > 0 ? Math.max(0, 100 - (largeImagesCount / imagesData.total) * 200) : 100

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wszystkie Obrazy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{imagesData.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brak ALT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(imagesData.without_alt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {imagesData.without_alt || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duże Obrazy (&gt;500KB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${largeImagesCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {largeImagesCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Łączny Rozmiar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{imagesData.total_size_mb?.toFixed(2) || 0} MB</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
        <Card className="@lg:col-span-2">
          <CardHeader>
            <CardTitle>Rekomendacje dla Obrazów</CardTitle>
            <CardDescription>Jak poprawić SEO i szybkość ładowania poprzez obrazy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imagesData.without_alt > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Uzupełnij brakujące teksty alternatywne (ALT)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {imagesData.without_alt} obrazów nie posiada opisu.
                    </p>
                  </div>
                </div>
              )}
              {largeImagesCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Zoptymalizuj duże obrazy</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wykryto {largeImagesCount} obrazów powyżej 500KB.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rozkład Rozmiarów</CardTitle>
            <CardDescription>Liczba obrazów w przedziałach wielkości</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageSizeChart images={allImages} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Obrazów</CardTitle>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={allImages}
            columns={[
              { key: 'url', label: 'URL', className: 'font-medium truncate', maxWidth: '300px' },
              { key: 'alt_text', label: 'ALT Text', render: (v: any, row: any) => {
                const imageUrl = row?.url || ''
                if (aiAlts[imageUrl]) return <span className="text-xs text-green-600">{aiAlts[imageUrl]}</span>
                if (v) return v
                return (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Brak</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      disabled={generatingAlt[imageUrl]}
                      onClick={(e) => { e.stopPropagation(); handleGenerateAlt(imageUrl) }}
                    >
                      {generatingAlt[imageUrl] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Sparkles className="h-3 w-3 mr-1" />Generuj ALT</>
                      )}
                    </Button>
                  </div>
                )
              }},
              { key: 'size_bytes', label: 'Rozmiar', render: (v: any) => formatBytes(v) },
              { key: 'format', label: 'Format' },
            ]}
            pageSize={20}
            exportFilename="obrazy_lista"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function RawDataTab({ imagesData, audit }: { imagesData: any; audit: Audit }) {
  const allImages = imagesData.all_images || []
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Surowe dane obrazów</h3>
        <Badge variant="outline">{allImages.length} rekordów</Badge>
      </div>

      <DataExplorerTable
        data={allImages}
        columns={allImages.length > 0 ? Object.keys(allImages[0]).slice(0, 8).map(k => ({ key: k, label: k })) : []}
        pageSize={25}
        exportFilename="obrazy_raw"
      />
    </div>
  )
}

export default function ImagesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mode, setMode] = useAuditMode('data')
  const [generatingAlt, setGeneratingAlt] = useState<Record<string, boolean>>({})
  const [aiAlts, setAiAlts] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
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
      const data = query?.state?.data as any
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'images'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'images' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.images

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

  const handleGenerateAlt = async (imageUrl: string) => {
    setGeneratingAlt(prev => ({ ...prev, [imageUrl]: true }))
    try {
      const res = await auditsAPI.generateAlt(params.id, imageUrl)
      setAiAlts(prev => ({ ...prev, [imageUrl]: res.alt_text }))
      toast.success('Wygenerowano tekst ALT')
    } catch (error) {
      toast.error('Błąd AI')
    } finally {
      setGeneratingAlt(prev => ({ ...prev, [imageUrl]: false }))
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const imagesData = audit.results?.crawl?.images

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Obrazów</h1>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
        hasAiData={!!aiContext && !aiContext.ai_unavailable}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <OverviewTab 
              imagesData={imagesData} 
              allImages={imagesData?.all_images || []} 
              params={params}
              generatingAlt={generatingAlt}
              aiAlts={aiAlts}
              handleGenerateAlt={handleGenerateAlt}
            />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab imagesData={imagesData} audit={audit} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="images"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="images"
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
