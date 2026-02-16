'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { projectsAPI } from '@/lib/api'
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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const normalizeUrl = (v: string) => {
    const trimmed = v.trim()
    if (!trimmed) return ''
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
    return trimmed
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return
    setIsCreating(true)
    setError('')
    try {
      const project = await projectsAPI.create(currentWorkspace.id, {
        name: name.trim(),
        url: normalizeUrl(url),
        description: description.trim() || undefined,
      })
      setName('')
      setUrl('')
      setDescription('')
      onOpenChange(false)
      onSuccess?.()
      router.push(`/projects/${project.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć projektu')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy projekt</DialogTitle>
          <DialogDescription>
            Projekt = jedna strona (domena). Audyty i harmonogramy będą przypisane do projektu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="project-name">Nazwa</Label>
            <Input
              id="project-name"
              placeholder="np. Matka Aptekarka"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-url">URL strony</Label>
            <Input
              id="project-url"
              type="url"
              placeholder="https://matkaaptekarka.pl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Opis (opcjonalnie)</Label>
            <Input
              id="project-desc"
              placeholder="Krótki opis projektu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Tworzenie...' : 'Utwórz projekt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
