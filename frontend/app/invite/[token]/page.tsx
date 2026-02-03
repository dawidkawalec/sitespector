'use client'

/**
 * Accept Invite Page
 * 
 * Users arrive here from invite link.
 * If logged in: Accept invite and join workspace
 * If not logged in: Redirect to register with return URL
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface InviteData {
  id: string
  workspace_id: string
  workspace_name: string
  email: string
  role: 'admin' | 'member'
  invited_by_email: string
  expires_at: string
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchInvite()
  }, [params.token])

  const fetchInvite = async () => {
    setIsLoading(true)

    try {
      // Fetch invite with workspace details
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select(`
          id,
          workspace_id,
          email,
          role,
          expires_at,
          invited_by,
          accepted_at,
          workspaces (
            name
          )
        `)
        .eq('token', params.token)
        .single()

      if (inviteError) throw inviteError

      if (inviteData.accepted_at) {
        setError('This invitation has already been accepted')
        setIsLoading(false)
        return
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired')
        setIsLoading(false)
        return
      }

      // Get inviter email
      const { data: inviterData } = await supabase.auth.admin.getUserById(inviteData.invited_by)

      setInvite({
        ...inviteData,
        workspace_name: (inviteData.workspaces as any)?.name || 'Unknown Workspace',
        invited_by_email: inviterData?.user?.email || 'Unknown'
      })
    } catch (error: any) {
      setError(error.message || 'Invalid invitation link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in, redirect to register with return URL
        router.push(`/register?returnTo=/invite/${params.token}`)
        return
      }

      // Check if invite email matches user email
      if (invite!.email !== user.email) {
        throw new Error('This invitation is for a different email address')
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite!.workspace_id,
          user_id: user.id,
          role: invite!.role
        })

      if (memberError) throw memberError

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite!.id)

      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Invitation Accepted!</CardTitle>
            </div>
            <CardDescription>
              You've successfully joined {invite?.workspace_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite.workspace_name}</CardTitle>
          <CardDescription>
            {invite.invited_by_email} invited you to join as {invite.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Workspace:</span>
              <span className="font-medium">{invite.workspace_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invite.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your email:</span>
              <span className="font-medium">{invite.email}</span>
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
