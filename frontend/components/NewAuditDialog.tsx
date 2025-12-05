'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { auditsAPI, type CreateAuditData } from '@/lib/api'
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
import { X } from 'lucide-react'

interface NewAuditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewAuditDialog({ open, onOpenChange, onSuccess }: NewAuditDialogProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [competitors, setCompetitors] = useState<string[]>([''])

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

  const onSubmit = async (data: { url: string }) => {
    setLoading(true)
    setError('')

    try {
      const auditData: CreateAuditData = {
        url: data.url,
        competitors: competitors.filter((c) => c.trim() !== ''),
      }

      await auditsAPI.create(auditData)
      reset()
      setCompetitors([''])
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Wystąpił błąd podczas tworzenia audytu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Nowy audyt strony</DialogTitle>
          <DialogDescription>
            Wprowadź adres URL strony do analizy oraz opcjonalnie konkurencję (max 3)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Adres URL strony *</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://przykład.pl"
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
              <Label>Konkurencja (opcjonalnie)</Label>
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                >
                  Dodaj konkurenta
                </Button>
              )}
            </div>

            {competitors.map((competitor, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`URL konkurenta ${index + 1}`}
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
              Możesz dodać maksymalnie 3 konkurentów
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
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Tworzenie...' : 'Rozpocznij audyt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

