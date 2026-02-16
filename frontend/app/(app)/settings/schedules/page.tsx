'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Calendar, Plus, Trash2, Play, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function SchedulesPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const queryClient = useQueryClient()
  const [isAuth, setIsAuth] = useState(false)

  // Form State
  const [newUrl, setNewUrl] = useState('')
  const [frequency, setFrequency] = useState('weekly')
  const [includeCompetitors, setIncludeCompetitors] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', workspace?.id],
    queryFn: () => auditsAPI.listSchedules(workspace?.id as string),
    enabled: !!workspace?.id && isAuth,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => auditsAPI.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setNewUrl('')
      toast.success('Harmonogram został utworzony')
    },
    onError: () => toast.error('Błąd podczas tworzenia harmonogramu')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditsAPI.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Harmonogram został usunięty')
    }
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string, active: boolean }) => 
      auditsAPI.updateSchedule(id, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] })
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl || !workspace?.id) return
    createMutation.mutate({
      url: newUrl,
      frequency,
      include_competitors: includeCompetitors,
      workspace_id: workspace.id,
      competitors_urls: []
    })
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Automatyczne Audyty</h1>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Nowy Harmonogram</CardTitle>
            <CardDescription>Ustaw cykliczne sprawdzanie swojej witryny</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL Witryny</Label>
                <Input 
                  id="url" 
                  placeholder="https://example.com" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freq">Częstotliwość</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Codziennie</SelectItem>
                    <SelectItem value="weekly">Co tydzień</SelectItem>
                    <SelectItem value="monthly">Co miesiąc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="comp" className="cursor-pointer">Analiza Konkurencji</Label>
                <Switch 
                  id="comp" 
                  checked={includeCompetitors} 
                  onCheckedChange={setIncludeCompetitors} 
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Dodaj do Harmonogramu
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Schedules List */}
        <div className="@lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Aktywne Harmonogramy
          </h2>
          
          {!schedules || schedules.length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Brak zaplanowanych audytów. Dodaj pierwszy po lewej stronie.
              </CardContent>
            </Card>
          ) : (
            schedules.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{s.url}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 capitalize">
                        <Calendar className="h-3 w-3" /> {s.frequency === 'daily' ? 'codziennie' : s.frequency === 'weekly' ? 'co tydzień' : 'co miesiąc'}
                      </span>
                      {s.next_run_at && (
                        <span>Następny: {new Date(s.next_run_at).toLocaleDateString('pl-PL')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={s.is_active} 
                      onCheckedChange={(active) => toggleMutation.mutate({ id: s.id, active })} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Czy na pewno chcesz usunąć ten harmonogram?')) {
                          deleteMutation.mutate(s.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
