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
import { X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

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
      }

      await auditsAPI.create(currentWorkspace.id, auditData)
      reset()
      setCompetitors([''])
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New Website Audit</DialogTitle>
          <DialogDescription>
            Enter the URL to analyze and optionally add up to 3 competitors
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Usage warning */}
          {subscription && auditsRemaining <= 2 && auditsRemaining > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {auditsRemaining} {auditsRemaining === 1 ? 'audit' : 'audits'} remaining this month.{' '}
                <Link href="/pricing" className="underline font-medium">
                  Upgrade to Pro
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {subscription && auditsRemaining === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your audit limit ({subscription.audit_limit}/month).{' '}
                <Link href="/pricing" className="underline font-medium">
                  Upgrade to continue
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://example.com"
              {...register('url', {
                required: 'URL is required',
                pattern: {
                  value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                  message: 'Invalid URL format',
                },
              })}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Competitors (Optional)</Label>
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                >
                  Add Competitor
                </Button>
              )}
            </div>

            {competitors.map((competitor, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Competitor URL ${index + 1}`}
                  value={competitor}
                  onChange={(e) => updateCompetitor(index, e.target.value)}
                />
                {competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              You can add up to 3 competitors
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setCompetitors([''])
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!!subscription && (auditsRemaining ?? 0) === 0)}
            >
              {loading ? 'Creating...' : 'Start Audit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

