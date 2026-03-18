'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { auditsAPI, creditsAPI, type CreateAuditData, type CreditBalance } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, AlertCircle, Globe, Layers, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SENUTO_COUNTRIES = [
  { id: 200, label: 'Polska (baza 2.0)', code: 'pl_new' },
  { id: 1, label: 'Polska (baza 1.0)', code: 'pl' },
  { id: 50, label: 'Czechy', code: 'cz' },
  { id: 53, label: 'Dania', code: 'dk' },
  { id: 82, label: 'Węgry', code: 'hu' },
  { id: 134, label: 'Holandia', code: 'nl' },
  { id: 153, label: 'Rumunia', code: 'ro' },
  { id: 164, label: 'Słowacja', code: 'sk' },
  { id: 160, label: 'Szwecja', code: 'se' },
]

interface NewAuditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** When opening from a project context, pre-fill URL and assign audit to project */
  projectId?: string
  projectUrl?: string
}

// CreditBalance imported from api.ts

export function NewAuditDialog({ open, onOpenChange, onSuccess, projectId, projectUrl }: NewAuditDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [competitors, setCompetitors] = useState<string[]>([''])
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [senutoCountry, setSenutoCountry] = useState('200')
  const [senutoFetchMode, setSenutoFetchMode] = useState('subdomain')
  const [runAiPipeline, setRunAiPipeline] = useState(true)
  const [runExecutionPlan, setRunExecutionPlan] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [crawlerUserAgent, setCrawlerUserAgent] = useState('')
  const { currentWorkspace } = useWorkspace()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<{ url: string }>({
    defaultValues: { url: projectUrl ?? '' },
  })

  // Pre-fill URL when opened with project context
  useEffect(() => {
    if (open && projectUrl) {
      setValue('url', projectUrl)
    }
  }, [open, projectUrl, setValue])

  const addCompetitor = () => {
    if (competitors.length < 3) {
      setCompetitors([...competitors, ''])
    }
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors]
    newCompetitors[index] = value
    setCompetitors(newCompetitors)
  }

  // Fetch credit balance when dialog opens
  useEffect(() => {
    if (open && currentWorkspace) {
      creditsAPI.getBalance(currentWorkspace.id).then(setCreditBalance).catch(err => {
        console.error('Error fetching credit balance:', err)
      })
    }
  }, [open, currentWorkspace])

  const onSubmit = async (data: { url: string }) => {
    setLoading(true)
    setError('')

    if (!currentWorkspace) {
      setError('No workspace selected')
      setLoading(false)
      return
    }

    try {
      const auditData: CreateAuditData = {
        url: data.url,
        competitors: competitors.filter(c => c.trim() !== ''),
        senuto_country_id: parseInt(senutoCountry),
        senuto_fetch_mode: senutoFetchMode,
        run_ai_pipeline: runAiPipeline,
        run_execution_plan: runExecutionPlan,
        crawler_user_agent: crawlerUserAgent.trim() || undefined,
      }

      const newAudit = await auditsAPI.create(currentWorkspace.id, auditData, projectId)
      reset()
      setCompetitors([''])
      onOpenChange(false)
      router.push(`/audits/${newAudit.id}`)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create audit')
    } finally {
      setLoading(false)
    }
  }

  const competitorsCount = competitors.filter(c => c.trim() !== '').length
  const auditCost = (runAiPipeline ? 30 : 20) + competitorsCount * 3
  const hasEnoughCredits = creditBalance ? creditBalance.total >= auditCost : true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">
            <span className="text-line">Nowy Audyt</span> Strony
          </DialogTitle>
          <DialogDescription>
            Wprowadź adres URL do analizy i opcjonalnie dodaj do 3 konkurentów.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Credit cost & balance info */}
          {creditBalance && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span>Koszt audytu: <strong>{auditCost} kr</strong></span>
              <span className={!hasEnoughCredits ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                Saldo: {creditBalance.total} kr
              </span>
            </div>
          )}

          {creditBalance && !hasEnoughCredits && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Niewystarczające kredyty. Potrzebujesz {auditCost} kr, masz {creditBalance.total} kr.{' '}
                <Link href="/settings/billing" className="underline font-bold">
                  Kup kredyty
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url" className="text-primary font-bold">Adres URL Strony *</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://twoja-strona.pl"
              className="rounded-xl border-primary/10 focus:border-accent"
              {...register('url', {
                required: 'URL jest wymagany',
                pattern: {
                  value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                  message: 'Nieprawidłowy format URL',
                },
              })}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-primary font-bold">Konkurenci (Opcjonalnie)</Label>
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                  className="h-7 text-[10px] rounded-lg"
                >
                  Dodaj Konkurenta
                </Button>
              )}
            </div>

            {competitors.map((competitor, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`URL Konkurenta ${index + 1}`}
                  value={competitor}
                  onChange={(e) => updateCompetitor(index, e.target.value)}
                  className="rounded-xl border-primary/10"
                />
                {competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(index)}
                    className="text-destructive hover:bg-destructive/5"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground italic">
              Możesz dodać do 3 konkurentów dla porównania AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-t border-primary/5 mt-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" /> Baza Senuto
              </Label>
              <Select value={senutoCountry} onValueChange={setSenutoCountry}>
                <SelectTrigger className="rounded-xl border-primary/10 h-9 text-xs">
                  <SelectValue placeholder="Wybierz kraj" />
                </SelectTrigger>
                <SelectContent>
                  {SENUTO_COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> Tryb Analizy
              </Label>
              <Select value={senutoFetchMode} onValueChange={setSenutoFetchMode}>
                <SelectTrigger className="rounded-xl border-primary/10 h-9 text-xs">
                  <SelectValue placeholder="Wybierz tryb" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subdomain" className="text-xs">Subdomena</SelectItem>
                  <SelectItem value="domain" className="text-xs">Cała domena</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Pipeline Toggle */}
          <div className="space-y-2 py-2 border-t border-primary/5 mt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={runAiPipeline}
                  onChange={(e) => setRunAiPipeline(e.target.checked)}
                  className="rounded border-primary/20 text-accent focus:ring-accent h-4 w-4"
                />
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-accent" />
                  Uruchom analizę AI automatycznie
                </span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                (można uruchomić później ręcznie)
              </span>
            </div>

            {/* Execution Plan Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={runExecutionPlan}
                  onChange={(e) => setRunExecutionPlan(e.target.checked)}
                  className="rounded border-primary/20 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Wygeneruj plan wykonania automatycznie
                </span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                (konkretne zadania do wdrożenia)
              </span>
            </div>
          </div>

          {/* Advanced: Custom User-Agent */}
          <div className="border-t border-primary/5 pt-3 mt-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Zaawansowane
              {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {advancedOpen && (
              <div className="space-y-2 mt-3">
                <Label htmlFor="crawler-ua" className="text-[11px] font-bold uppercase text-muted-foreground">
                  User-Agent crawlera (opcjonalne)
                </Label>
                <Input
                  id="crawler-ua"
                  type="text"
                  placeholder="np. SiteSpector/1.0 twoja-domena.pl"
                  value={crawlerUserAgent}
                  onChange={(e) => setCrawlerUserAgent(e.target.value)}
                  className="rounded-xl border-primary/10 text-xs"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Ustaw custom User-Agent, aby ominąć blokady Cloudflare/WAF. Poproś właściciela strony o whitelistowanie.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset()
                setCompetitors([''])
                onOpenChange(false)
              }}
              disabled={loading}
              className="rounded-xl"
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              variant="accent"
              className="rounded-xl px-8 shadow-lg shadow-accent/20"
              disabled={loading || !hasEnoughCredits}
            >
              {loading ? 'Uruchamianie...' : 'Rozpocznij Audyt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

