'use client'

/**
 * Business Context Page
 *
 * Shown when audit is in 'awaiting_context' status (after Phase 1).
 * Fetches AI-generated smart form questions and collects business context.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditsAPI, businessContextAPI, type BusinessContext } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { BusinessContextForm } from '@/components/BusinessContextForm'
import { toast } from 'sonner'
import type { Audit, SmartFormQuestion } from '@/lib/api'

export default function ContextPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuth(true)
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading: isAuditLoading } = useQuery<Audit>({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: 5000,  // Poll for status changes
  })

  const { data: smartFormData, isLoading: isFormLoading } = useQuery<{ questions: SmartFormQuestion[] }>({
    queryKey: ['smart-form', params.id],
    queryFn: () => businessContextAPI.generateSmartForm(params.id),
    enabled: isAuth && audit?.status === 'awaiting_context',
    staleTime: 5 * 60 * 1000,  // Cache for 5 min
  })

  const saveAndContinue = useMutation({
    mutationFn: (data: Partial<BusinessContext>) =>
      businessContextAPI.saveContextAndContinue(params.id, data),
    onSuccess: () => {
      toast.success('Kontekst zapisany — analiza AI wznowiona')
      queryClient.invalidateQueries({ queryKey: ['audit', params.id] })
      router.push(`/audits/${params.id}`)
    },
    onError: (err) => {
      toast.error('Blad zapisu kontekstu: ' + (err as Error).message)
    },
  })

  const skipContext = useMutation({
    mutationFn: () => businessContextAPI.skipContext(params.id),
    onSuccess: () => {
      toast.info('Kontekst pominiety — analiza AI wznowiona bez kontekstu')
      queryClient.invalidateQueries({ queryKey: ['audit', params.id] })
      router.push(`/audits/${params.id}`)
    },
    onError: (err) => {
      toast.error('Blad: ' + (err as Error).message)
    },
  })

  if (!isAuth || isAuditLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Nie znaleziono audytu.</p>
      </div>
    )
  }

  // If audit is not awaiting context, redirect to main page
  if (audit.status !== 'awaiting_context') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            {audit.status === 'completed' ? (
              <>
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Audyt jest juz ukonczony. Kontekst biznesowy mozna dodac przy nastepnym audycie.
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Audyt jest w trakcie przetwarzania ({audit.status}). Kontekst bedzie dostepny po zebraniu danych.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 @md:px-6 @md:py-8 min-w-0">
      {/* Status banner */}
      <Card className="mb-6 border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-teal-900 dark:text-teal-200">
              Dane techniczne zebrane — czas na kontekst
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
              Analiza Screaming Frog, Lighthouse i Senuto zakonczona.
              Teraz AI wygenerowalo pytania na bazie Twoich danych.
              Odpowiedz na nie, aby raporty byly dopasowane do Twojego biznesu.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart form */}
      {isFormLoading ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-sm text-muted-foreground">
              AI generuje spersonalizowane pytania na bazie danych z audytu...
            </p>
          </CardContent>
        </Card>
      ) : smartFormData?.questions ? (
        <BusinessContextForm
          questions={smartFormData.questions}
          workspaceId={currentWorkspace?.id || ''}
          projectId={audit.project_id}
          isSubmitting={saveAndContinue.isPending || skipContext.isPending}
          onSubmit={(ctx) => saveAndContinue.mutate(ctx)}
          onSkip={() => skipContext.mutate()}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nie udalo sie wygenerowac pytan. Mozesz kontynuowac bez kontekstu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
