'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { auditsAPI, type CreateAuditData } from '@/lib/api'
import { supabase } from '@/lib/supabase'
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
import { X, AlertCircle, Globe, Layers } from 'lucide-react'
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
  onSuccess: () => void
}

interface Subscription {
  audit_limit: number
  audits_used_this_month: number
  plan: string
}

export function NewAuditDialog({ open, onOpenChange, onSuccess }: NewAuditDialogProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [competitors, setCompetitors] = useState<string[]>([''])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const { currentWorkspace } = useWorkspace()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ url: string }>()

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

  // Fetch subscription data when dialog opens
  useEffect(() => {
    if (open && currentWorkspace) {
      fetchSubscription()
    }
  }, [open, currentWorkspace])

  const fetchSubscription = async () => {
    if (!currentWorkspace) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (error) throw error
      setSubscription(data as Subscription)
    } catch (err) {
      console.error('Error fetching subscription:', err)
    }
  }

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
      }

      const newAudit = await auditsAPI.create(currentWorkspace.id, auditData)
      reset()
      setCompetitors([''])
      onOpenChange(false)
      router.push(`/audits/${newAudit.id}`)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create audit')
    } finally {
      setLoading(false)
    }
  }

  const auditsRemaining = subscription 
    ? subscription.audit_limit - subscription.audits_used_this_month 
    : 0

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

          {/* Usage warning */}
          {subscription && auditsRemaining <= 2 && auditsRemaining > 0 && (
            <Alert className="bg-accent/10 border-accent/20 text-accent">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pozostało Ci {auditsRemaining} {auditsRemaining === 1 ? 'audyt' : 'audyty'} w tym miesiącu.{' '}
                <Link href="/pricing" className="underline font-bold">
                  Zwiększ limit
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {subscription && auditsRemaining === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Osiągnięto limit audytów ({subscription.audit_limit}/miesiąc).{' '}
                <Link href="/pricing" className="underline font-bold">
                  Zwiększ plan, aby kontynuować
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
              disabled={loading || (!!subscription && (auditsRemaining ?? 0) === 0)}
            >
              {loading ? 'Uruchamianie...' : 'Rozpocznij Audyt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

