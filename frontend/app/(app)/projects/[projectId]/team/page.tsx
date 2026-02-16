'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsAPI } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

export default function ProjectTeamPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member' | 'viewer'>('member')

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
  })

  const { data: members = [], isLoading: membersLoading, refetch } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsAPI.listMembers(projectId),
    enabled: !!projectId,
  })

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ['workspace-members-for-project', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return []
      const { data } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', currentWorkspace.id)
      return data ?? []
    },
    enabled: !!currentWorkspace?.id,
  })

  const addMemberMutation = useMutation({
    mutationFn: () =>
      projectsAPI.addMember(projectId, { user_id: selectedUserId, role: selectedRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      setSelectedUserId('')
      toast.success('Dodano do zespołu projektu')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => projectsAPI.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      toast.success('Usunięto z zespołu')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const memberUserIds = new Set(members.map((m) => m.user_id))
  const availableToAdd = workspaceMembers.filter((w) => !memberUserIds.has(w.user_id))

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zespół projektu</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Członkowie projektu</CardTitle>
          <CardDescription>
            Tylko członkowie workspace mogą być dodani. Rola: manager (pełny dostęp), member (dane), viewer (tylko odczyt).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableToAdd.length > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Wybierz użytkownika" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((w) => (
                    <SelectItem key={w.user_id} value={w.user_id}>
                      {w.user_id.slice(0, 8)}…
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(v: 'manager' | 'member' | 'viewer') => setSelectedRole(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedUserId || addMemberMutation.isPending}
                onClick={() => addMemberMutation.mutate()}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Dodaj
              </Button>
            </div>
          )}

          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{m.full_name || m.email || m.user_id}</span>
                    {m.email && (
                      <span className="text-muted-foreground text-sm ml-2">({m.email})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{m.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMemberMutation.mutate(m.id)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
