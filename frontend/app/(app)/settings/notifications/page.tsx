'use client'

/**
 * Notifications Settings Page
 * 
 * Email notification preferences (placeholder for now)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function NotificationsPage() {
  const [auditCompleted, setAuditCompleted] = useState(true)
  const [auditFailed, setAuditFailed] = useState(true)
  const [teamInvites, setTeamInvites] = useState(true)
  const [monthlyReport, setMonthlyReport] = useState(false)

  const handleSave = () => {
    // TODO: Save preferences to Supabase
    alert('Notification preferences saved!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Manage email notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what updates you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audit-completed">Audit Completed</Label>
              <p className="text-sm text-muted-foreground">
                Receive email when audit finishes
              </p>
            </div>
            <Switch
              id="audit-completed"
              checked={auditCompleted}
              onCheckedChange={setAuditCompleted}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audit-failed">Audit Failed</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when audit encounters an error
              </p>
            </div>
            <Switch
              id="audit-failed"
              checked={auditFailed}
              onCheckedChange={setAuditFailed}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="team-invites">Team Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Receive team invitation emails
              </p>
            </div>
            <Switch
              id="team-invites"
              checked={teamInvites}
              onCheckedChange={setTeamInvites}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthly-report">Monthly Report</Label>
              <p className="text-sm text-muted-foreground">
                Get monthly summary of your audits
              </p>
            </div>
            <Switch
              id="monthly-report"
              checked={monthlyReport}
              onCheckedChange={setMonthlyReport}
            />
          </div>

          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
