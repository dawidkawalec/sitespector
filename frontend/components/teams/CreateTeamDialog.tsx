'use client'

/**
 * Create Team Dialog Component
 * 
 * Modal for creating new team workspaces.
 * Generates slug from team name and creates workspace + subscription.
 */

import { useState } from 'react'
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

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { refreshWorkspaces, switchWorkspace } = useWorkspace()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate slug from team name
      const slug = teamName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        + '-' + Math.random().toString(36).substring(2, 8) // Add random suffix for uniqueness

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: teamName,
          slug: slug,
          type: 'team',
          owner_id: user.id
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      // Create default subscription (free plan)
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          workspace_id: workspace.id,
          plan: 'free',
          status: 'active',
          audit_limit: 5,
          audits_used_this_month: 0
        })

      if (subscriptionError) throw subscriptionError

      // Refresh workspaces and switch to new team
      await refreshWorkspaces()
      switchWorkspace(workspace.id)
      
      setTeamName('')
      onOpenChange(false)
    } catch (error: any) {
      setError(error.message || 'Failed to create team')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team workspace to collaborate with others
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              placeholder="My Awesome Team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can invite team members after creating the team
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
