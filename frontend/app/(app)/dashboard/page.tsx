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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NewAuditDialog } from '@/components/NewAuditDialog'
import { SystemStatus } from '@/components/SystemStatus'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant, truncateUrl, cn } from '@/lib/utils'
import { Loader2, Plus, Trash, RefreshCw, TrendingUp, Activity, Search, Gauge, Sparkles, Layout } from 'lucide-react'
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
  const router = useRouter()
  const [showNewAuditDialog, setShowNewAuditDialog] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace, isLoading: isWorkspaceLoading, error: workspaceError, refreshWorkspaces } = useWorkspace()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const {
    data: auditsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['audits', currentWorkspace?.id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id),
    enabled: isAuth && !!currentWorkspace,
    refetchInterval: 10000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditsAPI.delete(id),
    onSuccess: () => refetch(),
  })

  const retryMutation = useMutation({
    mutationFn: (data: CreateAuditData) => auditsAPI.create(currentWorkspace!.id, data),
    onSuccess: (newAudit) => router.push(`/audits/${newAudit.id}`),
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    deleteMutation.mutate(id)
  }

  const handleRetry = (e: React.MouseEvent, audit: any) => {
    e.preventDefault()
    e.stopPropagation()
    retryMutation.mutate({ url: audit.url })
  }

  if (!isAuth || isWorkspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Workspace</CardTitle>
            <CardDescription>You don't have access to any workspaces yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspaceError && <Alert variant="destructive"><AlertDescription>Error: {workspaceError}</AlertDescription></Alert>}
            <div className="flex gap-2">
              <Button onClick={handleLogout} variant="outline">Sign out</Button>
              <Button onClick={() => refreshWorkspaces()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedAudits = auditsData?.items?.filter(a => a.status === 'completed') || []
  
  // Prepare chart data - average scores over time
  const timelineData = completedAudits
    .slice()
    .reverse()
    .map(a => ({
      date: new Date(a.created_at).toLocaleDateString(),
      score: a.overall_score,
      seo: a.seo_score,
      perf: a.performance_score
    }))

  const avgOverall = completedAudits.length > 0 
    ? completedAudits.reduce((acc, a) => acc + (a.overall_score || 0), 0) / completedAudits.length 
    : 0

  const avgSeo = completedAudits.length > 0 
    ? completedAudits.reduce((acc, a) => acc + (a.seo_score || 0), 0) / completedAudits.length 
    : 0

  const avgPerf = completedAudits.length > 0 
    ? completedAudits.reduce((acc, a) => acc + (a.performance_score || 0), 0) / completedAudits.length 
    : 0

  const barData = [
    { name: 'SEO', value: avgSeo, color: '#3b82f6' },
    { name: 'Performance', value: avgPerf, color: '#10b981' },
    { name: 'Overall', value: avgOverall, color: '#8b5cf6' }
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Layout className="h-4 w-4" /> {currentWorkspace.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleLogout} className="rounded-full">Sign out</Button>
          <Button onClick={() => setShowNewAuditDialog(true)} className="rounded-full shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> New Audit
          </Button>
        </div>
      </motion.div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Workspace Trends
            </CardTitle>
            <CardDescription>Average scores across all audits in this workspace</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Stats & Distribution */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Average Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-primary mb-4">{avgOverall.toFixed(1)}%</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1"><Search className="h-3 w-3" /> SEO</span>
                  <span className="font-bold">{avgSeo.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${avgSeo}%` }}
                    className="h-full bg-blue-500"
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Performance</span>
                  <span className="font-bold">{avgPerf.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${avgPerf}%` }}
                    className="h-full bg-emerald-500"
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-5xl font-black">{auditsData?.total || 0}</div>
                <div className="text-sm mb-1 opacity-80">Total Audits</div>
              </div>
              <div className="mt-4 flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-white" /> {completedAudits.length} Done
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-white/40" /> {auditsData?.items?.filter(a => a.status === 'processing').length} Active
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <SystemStatus />

      {/* Audits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Recent Audits
          </h2>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground">
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {auditsData?.items?.map((audit, index) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/audits/${audit.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={getStatusBadgeVariant(audit.status)} className="mb-2">
                          {audit.status}
                        </Badge>
                        {audit.overall_score !== undefined && (
                          <div className={cn("text-2xl font-black", getScoreColor(audit.overall_score))}>
                            {formatScore(audit.overall_score)}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-base truncate" title={audit.url}>
                        {truncateUrl(audit.url, 40)}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-wider font-bold">
                        {formatDate(audit.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mt-2">
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">SEO</p>
                          <div className="h-1 w-full bg-slate-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${audit.seo_score || 0}%` }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Perf</p>
                          <div className="h-1 w-full bg-slate-100 rounded-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${audit.performance_score || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                  
                  {/* Hover Actions */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={(e) => handleRetry(e, audit)}
                      className="h-7 w-7 rounded-full bg-white/90 backdrop-blur shadow-sm"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-7 w-7 rounded-full bg-white/90 backdrop-blur shadow-sm text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Audit</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete audit for {audit.url}?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={(e) => handleDelete(e, audit.id)} className="bg-red-600">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

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
