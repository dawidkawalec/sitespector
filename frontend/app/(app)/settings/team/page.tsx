'use client'

/**
 * Team Settings Page
 * 
 * Manage workspace members:
 * - View all members with roles
 * - Invite new members
 * - Remove members (admins/owners only)
 * - View pending invites
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Mail, Loader2, Copy, Check } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  user_email: string
  user_full_name: string | null
  created_at: string
}

interface Invite {
  id: string
  email: string
  role: 'admin' | 'member'
  token: string
  invited_by_email: string
  expires_at: string
  created_at: string
}

export default function TeamSettingsPage() {
  const { currentWorkspace } = useWorkspace()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    if (currentWorkspace) {
      fetchData()
    }
  }, [currentWorkspace])

  const fetchData = async () => {
    setIsLoading(true)
    await Promise.all([fetchMembers(), fetchInvites()])
    setIsLoading(false)
  }

  const fetchMembers = async () => {
    if (!currentWorkspace) return

    try {
      // Query with joins to get user email
      const { data, error: fetchError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq('workspace_id', currentWorkspace.id)

      if (fetchError) throw fetchError

      // Get user details for each member
      const membersWithDetails = await Promise.all(
        (data || []).map(async (member: any) => {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', member.user_id)
            .single()

          return {
            ...member,
            user_email: userData?.user?.email || 'Unknown',
            user_full_name: profileData?.full_name || null
          }
        })
      )

      setMembers(membersWithDetails)
    } catch (error: any) {
      console.error('Error fetching members:', error)
      setError(error.message)
    }
  }

  const fetchInvites = async () => {
    if (!currentWorkspace) return

    try {
      const { data, error: fetchError } = await supabase
        .from('invites')
        .select(`
          id,
          email,
          role,
          token,
          expires_at,
          created_at,
          invited_by
        `)
        .eq('workspace_id', currentWorkspace.id)
        .is('accepted_at', null)

      if (fetchError) throw fetchError

      // Get inviter details
      const invitesWithDetails = await Promise.all(
        (data || []).map(async (invite: any) => {
          const { data: inviterData } = await supabase.auth.admin.getUserById(invite.invited_by)
          
          return {
            ...invite,
            invited_by_email: inviterData?.user?.email || 'Unknown'
          }
        })
      )

      setInvites(invitesWithDetails)
    } catch (error: any) {
      console.error('Error fetching invites:', error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', currentWorkspace!.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('User is already a member of this workspace')
      }

      // Generate invite token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      const { error: insertError } = await supabase
        .from('invites')
        .insert({
          workspace_id: currentWorkspace!.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          token: token,
          expires_at: expiresAt.toISOString()
        })

      if (insertError) throw insertError

      const inviteLink = `${window.location.origin}/invite/${token}`
      setSuccess(`Invite sent! Share this link: ${inviteLink}`)
      setInviteEmail('')
      
      fetchInvites()
    } catch (error: any) {
      setError(error.message || 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberRole: string) => {
    if (memberRole === 'owner') {
      setError('Cannot remove workspace owner')
      return
    }

    if (!confirm('Remove this member from the workspace?')) return

    try {
      const { error: deleteError } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError

      setSuccess('Member removed successfully')
      fetchMembers()
    } catch (error: any) {
      setError(error.message || 'Failed to remove member')
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm('Delete this invitation?')) return

    try {
      const { error: deleteError } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)

      if (deleteError) throw deleteError

      fetchInvites()
    } catch (error: any) {
      setError(error.message || 'Failed to delete invite')
    }
  }

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(inviteLink)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (!currentWorkspace) {
    return <div className="p-8">No workspace selected</div>
  }

  if (currentWorkspace.type === 'personal') {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Workspace</CardTitle>
            <CardDescription>
              This is your personal workspace. Create a team workspace to collaborate.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage members and invitations for {currentWorkspace.name}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Invite member (only for admins/owners) */}
      {(currentWorkspace.role === 'owner' || currentWorkspace.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>
              Send an invitation to join this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isInviting}>
                  <Mail className="mr-2 h-4 w-4" />
                  {isInviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invite.invited_by_email} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invite.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyInviteLink(invite.token)}
                      title="Copy invite link"
                    >
                      {copiedToken === invite.token ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInvite(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>
            Manage who has access to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.user_full_name?.charAt(0) || member.user_email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {member.user_full_name || member.user_email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.user_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'owner' ? 'default' : 'outline'}>
                    {member.role}
                  </Badge>
                  {member.role !== 'owner' && 
                   (currentWorkspace.role === 'owner' || currentWorkspace.role === 'admin') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id, member.role)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No members yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
