'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useWorkspace } from '@/lib/WorkspaceContext'
import { chatAPI } from '@/lib/chat-api'
import type { ChatAgent } from '@/lib/chat-store'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TOOL_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'crawl_overview', label: 'Crawl overview' },
  { key: 'links_internal', label: 'Linki wewnetrzne' },
  { key: 'senuto_backlinks', label: 'Backlinki (Senuto)' },
  { key: 'senuto_visibility', label: 'Widocznosc (Senuto)' },
  { key: 'senuto_ai_overviews', label: 'AI Overviews (Senuto)' },
  { key: 'lighthouse_desktop', label: 'Lighthouse Desktop' },
  { key: 'lighthouse_mobile', label: 'Lighthouse Mobile' },
  { key: 'performance_analysis', label: 'Analiza wydajnosci (AI)' },
  { key: 'content_analysis', label: 'Analiza tresci' },
  { key: 'quick_wins', label: 'Quick wins' },
  { key: 'executive_summary', label: 'Executive summary' },
  { key: 'roadmap', label: 'Roadmap' },
  { key: 'cross_tool', label: 'Cross-tool' },
  { key: 'ai_contexts_seo', label: 'AI contexts: SEO' },
  { key: 'ai_contexts_links', label: 'AI contexts: Linki' },
  { key: 'ai_contexts_content', label: 'AI contexts: Tresc' },
  { key: 'ai_contexts_performance', label: 'AI contexts: Wydajnosc' },
  { key: 'ai_contexts_ai_overviews', label: 'AI contexts: AIO' },
]

type AgentDraft = {
  id?: string
  name: string
  description: string
  icon: string
  system_prompt: string
  tools_config: string[]
}

function defaultDraft(): AgentDraft {
  return {
    name: '',
    description: '',
    icon: '',
    system_prompt:
      'Jestes pomocnym asystentem SiteSpector. Odpowiadaj konkretnie, uzywaj danych z raportu, a gdy czegos nie ma w raporcie - powiedz to wprost. Odpowiadaj w jezyku uzytkownika (domyslnie polski).',
    tools_config: [],
  }
}

export default function AgentsSettingsPage() {
  const { currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id ?? null

  const agentsQuery = useQuery({
    queryKey: ['chatAgents', workspaceId],
    queryFn: () => chatAPI.listAgents(workspaceId ?? undefined),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })

  const agents = agentsQuery.data ?? []

  const systemAgents = useMemo(() => agents.filter((a) => a.is_system), [agents])
  const customAgents = useMemo(
    () =>
      agents
        .filter((a) => !a.is_system)
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)),
    [agents]
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<AgentDraft>(defaultDraft())

  const isEditing = Boolean(draft.id)

  useEffect(() => {
    if (!dialogOpen) setDraft(defaultDraft())
  }, [dialogOpen])

  const openCreate = () => {
    setDraft(defaultDraft())
    setDialogOpen(true)
  }

  const openEdit = (a: ChatAgent) => {
    setDraft({
      id: a.id,
      name: a.name ?? '',
      description: a.description ?? '',
      icon: a.icon ?? '',
      system_prompt: a.system_prompt ?? '',
      tools_config: a.tools_config ?? [],
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!workspaceId) return
    if (!draft.name.trim()) {
      toast.error('Podaj nazwe agenta')
      return
    }
    if (!draft.system_prompt.trim() || draft.system_prompt.trim().length < 20) {
      toast.error('System prompt jest za krotki')
      return
    }

    setIsSaving(true)
    try {
      if (!isEditing) {
        await chatAPI.createAgent({
          workspace_id: workspaceId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          icon: draft.icon.trim() || null,
          system_prompt: draft.system_prompt,
          tools_config: draft.tools_config,
        })
        toast.success('Agent utworzony')
      } else {
        await chatAPI.updateAgent(draft.id as string, workspaceId, {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          icon: draft.icon.trim() || null,
          system_prompt: draft.system_prompt,
          tools_config: draft.tools_config,
        })
        toast.success('Agent zaktualizowany')
      }

      setDialogOpen(false)
      void agentsQuery.refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Nie udalo sie zapisac agenta')
    } finally {
      setIsSaving(false)
    }
  }

  const removeAgent = async (a: ChatAgent) => {
    if (!workspaceId) return
    if (a.is_system) return
    if (!confirm(`Usunac agenta "${a.name}"?`)) return
    try {
      await chatAPI.deleteAgent(a.id, workspaceId)
      toast.success('Agent usuniety')
      void agentsQuery.refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Nie udalo sie usunac agenta')
    }
  }

  const moveCustom = async (idx: number, dir: -1 | 1) => {
    if (!workspaceId) return
    const next = customAgents.slice()
    const swapWith = idx + dir
    if (swapWith < 0 || swapWith >= next.length) return
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]

    const items = next.map((a, i) => ({ id: a.id, sort_order: i + 1 }))
    try {
      await chatAPI.updateAgentOrder({ workspace_id: workspaceId, items })
      void agentsQuery.refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Nie udalo sie zapisac kolejnosci')
    }
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenci czatu</h1>
          <p className="text-muted-foreground mt-1">Zarzadzaj rolami dostepnymi w panelu czatu</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj agenta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenci systemowi</CardTitle>
          <CardDescription>Predefiniowane role dostepne zawsze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {agentsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
          {systemAgents.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.description ?? ''}</div>
              </div>
              <div className="text-xs text-muted-foreground">system</div>
            </div>
          ))}
          {systemAgents.length === 0 && !agentsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Brak agentow systemowych</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twoi agenci</CardTitle>
          <CardDescription>Role dostepne w tym workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {customAgents.map((a, idx) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.description ?? ''}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void moveCustom(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void moveCustom(idx, 1)}
                  disabled={idx === customAgents.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Edit agent">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void removeAgent(a)}
                  aria-label="Delete agent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {customAgents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Brak wlasnych agentow. Kliknij &quot;Dodaj agenta&quot;, aby stworzyc nowa role.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edytuj agenta' : 'Dodaj agenta'}</DialogTitle>
            <DialogDescription>Agent jest widoczny tylko w tym workspace.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nazwa</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                placeholder="np. Ekspert contentu"
              />
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <Input
                value={draft.description}
                onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
                placeholder="Krotki opis roli"
              />
            </div>
            <div className="space-y-2">
              <Label>Ikona (Lucide)</Label>
              <Input
                value={draft.icon}
                onChange={(e) => setDraft((s) => ({ ...s, icon: e.target.value }))}
                placeholder="np. Search, Zap, Link"
              />
            </div>
            <div className="space-y-2">
              <Label>System prompt</Label>
              <Textarea
                value={draft.system_prompt}
                onChange={(e) => setDraft((s) => ({ ...s, system_prompt: e.target.value }))}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label>Dozwolone sekcje RAG</Label>
              <div className="grid grid-cols-2 gap-2">
                {TOOL_OPTIONS.map((opt) => {
                  const checked = draft.tools_config.includes(opt.key)
                  return (
                    <label key={opt.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          const isOn = Boolean(val)
                          setDraft((s) => {
                            const current = new Set(s.tools_config)
                            if (isOn) current.add(opt.key)
                            else current.delete(opt.key)
                            return { ...s, tools_config: Array.from(current) }
                          })
                        }}
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Anuluj
            </Button>
            <Button onClick={() => void save()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

