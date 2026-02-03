'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { auditsAPI, CreateAuditData } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NewAuditDialog } from '@/components/NewAuditDialog'
import { SystemStatus } from '@/components/SystemStatus'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant, truncateUrl } from '@/lib/utils'
import { Loader2, Plus, Trash, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const router = useRouter()
  const [showNewAuditDialog, setShowNewAuditDialog] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Fetch audits for current workspace
  const {
    data: auditsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['audits', currentWorkspace?.id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id),
    enabled: isAuth && !!currentWorkspace,
    refetchInterval: 10000, // Poll every 10 seconds
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditsAPI.delete(id),
    onSuccess: () => {
      refetch()
    },
  })

  // Retry/Restart mutation
  const retryMutation = useMutation({
    mutationFn: (data: CreateAuditData) => 
      auditsAPI.create(currentWorkspace!.id, data),
    onSuccess: (newAudit) => {
      router.push(`/audits/${newAudit.id}`)
    },
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    deleteMutation.mutate(id)
  }

  const handleRetry = (e: React.MouseEvent, audit: any) => {
    e.preventDefault()
    e.stopPropagation()
    retryMutation.mutate({
        url: audit.url
    })
  }

  // Don't render anything on server or if not authenticated
  if (!isAuth || isWorkspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Workspace</CardTitle>
            <CardDescription>
              You don't have access to any workspaces yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout}>Sign out and try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {currentWorkspace.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
          <Button onClick={() => setShowNewAuditDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Stats */}
      {auditsData && (
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Audits</CardDescription>
            <CardTitle className="text-4xl">{auditsData?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-4xl">
              {auditsData?.items?.filter((a) => a.status === 'completed').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-4xl">
              {auditsData?.items?.filter((a) => a.status === 'processing').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      )}

      {/* System Status */}
      <SystemStatus />

      {/* Audits List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Audits</CardTitle>
          <CardDescription>
            All audits in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : !auditsData || auditsData?.items?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No audits yet in this workspace.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowNewAuditDialog(true)}
            >
              Create your first audit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {auditsData?.items?.map((audit) => (
                <div key={audit.id} className="relative group">
                    <Link href={`/audits/${audit.id}`} className="block">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer pr-32">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{truncateUrl(audit.url, 50)}</h3>
                            <Badge variant={getStatusBadgeVariant(audit.status)}>
                              {audit.status === 'pending' && 'Pending'}
                              {audit.status === 'processing' && 'Processing'}
                              {audit.status === 'completed' && 'Completed'}
                              {audit.status === 'failed' && 'Failed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(audit.created_at)}
                          </p>
                        </div>
                        
                        {audit.overall_score !== undefined && (
                          <div className="text-right shrink-0">
                            <div className={`text-2xl font-bold ${getScoreColor(audit.overall_score)}`}>
                              {formatScore(audit.overall_score)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Overall Score
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* Actions - Positioned absolutely or flex */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-100 transition-opacity bg-white dark:bg-slate-950 pl-2 shadow-sm md:shadow-none rounded-l-lg md:rounded-none">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleRetry(e, audit)}
                            title="Retry audit"
                            className="h-8 w-8"
                         >
                            <RefreshCw className="h-4 w-4" />
                         </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); }} // Stop propagation only for trigger
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete audit for {audit.url}?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDelete(e, audit.id)} className="bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Audit Dialog */}
      <NewAuditDialog
        open={showNewAuditDialog}
        onOpenChange={setShowNewAuditDialog}
        onSuccess={() => {
          refetch()
          setShowNewAuditDialog(false)
        }}
      />
    </div>
  )
}
