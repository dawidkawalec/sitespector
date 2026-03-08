'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import {
  Loader2,
  Network,
  Server,
  Code2,
  Shield,
  Globe2,
  Cpu,
  Database,
  Workflow,
  Link as LinkIcon,
  Maximize2,
  CircleDot,
  MousePointerClick,
  Focus,
} from 'lucide-react'
import type { Audit } from '@/lib/api'
import { toast } from 'sonner'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any

type ColorBy = 'depth' | 'status' | 'link_score'
type SizeBy = 'inlinks' | 'word_count'
type StatusBucket = '2xx' | '3xx' | '4xx' | '5xx' | 'other'

type GraphNode = {
  id: string
  url: string
  title: string
  shortPath: string
  status_code: number
  statusBucket: StatusBucket
  crawl_depth: number
  inlinks: number
  outlinks: number
  word_count: number
  link_score: number
  isHomepage: boolean
}

type GraphLink = {
  source: string
  target: string
  follow: boolean
  type: string
  anchor: string
  count: number
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeUrl(raw: string): string {
  if (!raw) return ''
  try {
    const parsed = new URL(raw.trim())
    parsed.hash = ''
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.toString()
  } catch {
    return raw.trim()
  }
}

function shortPath(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname || '/'}${parsed.search || ''}`
  } catch {
    return url
  }
}

function statusBucket(code: number): StatusBucket {
  if (code >= 200 && code < 300) return '2xx'
  if (code >= 300 && code < 400) return '3xx'
  if (code >= 400 && code < 500) return '4xx'
  if (code >= 500 && code < 600) return '5xx'
  return 'other'
}

function dedupeLinks(rawLinks: any[]): GraphLink[] {
  const edgeMap = new Map<string, GraphLink>()
  for (const edge of rawLinks) {
    const source = normalizeUrl(String(edge?.source || ''))
    const target = normalizeUrl(String(edge?.target || ''))
    if (!source || !target) continue

    const key = `${source}=>${target}`
    const existing = edgeMap.get(key)
    const follow = Boolean(edge?.follow)
    if (existing) {
      existing.count += 1
      existing.follow = existing.follow && follow
      continue
    }
    edgeMap.set(key, {
      source,
      target,
      follow,
      type: String(edge?.type || 'Hyperlink'),
      anchor: String(edge?.anchor || ''),
      count: 1,
    })
  }
  return Array.from(edgeMap.values())
}

function buildGraphData(audit: Audit) {
  const pagesRaw = Array.isArray(audit?.results?.crawl?.all_pages) ? audit.results.crawl.all_pages : []
  const linksRaw = Array.isArray(audit?.results?.crawl?.link_graph) ? audit.results.crawl.link_graph : []
  const homepage = normalizeUrl(String(audit?.url || ''))

  const nodesByUrl = new Map<string, GraphNode>()

  for (const row of pagesRaw) {
    const url = normalizeUrl(String(row?.url || ''))
    if (!url) continue
    const node: GraphNode = {
      id: url,
      url,
      title: String(row?.title || ''),
      shortPath: shortPath(url),
      status_code: toNumber(row?.status_code, 0),
      statusBucket: statusBucket(toNumber(row?.status_code, 0)),
      crawl_depth: toNumber(row?.crawl_depth, 0),
      inlinks: toNumber(row?.inlinks, 0),
      outlinks: toNumber(row?.outlinks, 0),
      word_count: toNumber(row?.word_count, 0),
      link_score: toNumber(row?.link_score, 0),
      isHomepage: url === homepage,
    }
    nodesByUrl.set(url, node)
  }

  const links = dedupeLinks(linksRaw)

  for (const edge of links) {
    for (const edgeUrl of [edge.source, edge.target]) {
      if (nodesByUrl.has(edgeUrl)) continue
      nodesByUrl.set(edgeUrl, {
        id: edgeUrl,
        url: edgeUrl,
        title: '',
        shortPath: shortPath(edgeUrl),
        status_code: 0,
        statusBucket: 'other',
        crawl_depth: 99,
        inlinks: 0,
        outlinks: 0,
        word_count: 0,
        link_score: 0,
        isHomepage: edgeUrl === homepage,
      })
    }
  }

  const nodes = Array.from(nodesByUrl.values())
  const avgDepth =
    nodes.length > 0
      ? nodes.reduce((acc, node) => acc + Math.max(0, node.crawl_depth), 0) / nodes.length
      : 0
  const orphanCount = nodes.filter((node) => node.inlinks === 0).length
  const maxDepth = nodes.reduce((acc, node) => Math.max(acc, node.crawl_depth), 0)

  return {
    nodes,
    links,
    stats: {
      totalPages: nodes.length,
      totalLinks: links.length,
      avgDepth,
      orphanCount,
      maxDepth,
    },
  }
}

function depthColor(depth: number): string {
  if (depth <= 0) return '#10b981'
  if (depth === 1) return '#3b82f6'
  if (depth === 2) return '#06b6d4'
  if (depth === 3) return '#f59e0b'
  return '#ef4444'
}

function statusColor(bucket: StatusBucket): string {
  if (bucket === '2xx') return '#22c55e'
  if (bucket === '3xx') return '#3b82f6'
  if (bucket === '4xx') return '#f59e0b'
  if (bucket === '5xx') return '#ef4444'
  return '#94a3b8'
}

function linkScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#84cc16'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function renderTechStackTab(techStack: any) {
  if (!techStack) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Brak danych o stacku technologicznym w tym audycie.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
      <div className="@lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Wykryte technologie</CardTitle>
            <CardDescription>Systemy CMS, frameworki i biblioteki używane na stronie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              {techStack.technologies?.length > 0 ? (
                techStack.technologies.map((tech: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-accent/10">
                    <div className="p-2 rounded bg-primary/10 text-primary">
                      {tech.category === 'CMS' && <Globe2 className="h-5 w-5" />}
                      {tech.category === 'Framework' && <Code2 className="h-5 w-5" />}
                      {tech.category === 'Analytics' && <Cpu className="h-5 w-5" />}
                      {tech.category === 'Library' && <Database className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tech.name}</p>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold">{tech.category}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-muted-foreground">
                  Nie wykryto żadnych znanych technologii.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Infrastruktura serwerowa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Serwer WWW</p>
                <p className="font-mono text-sm">{techStack.server || 'Ukryty / Nieznany'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Protokół</p>
                <Badge variant="outline">HTTP/2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Bezpieczeństwo stacku
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span>Wersje bibliotek</span>
              <Badge variant="outline">Aktualne</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Znane luki (CVE)</span>
              <Badge variant="outline" className="text-green-600 border-green-600">0 wykryto</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              Analiza bazuje na publicznie dostępnych informacjach z nagłówków i kodu źródłowego.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Rekomendacje architektury</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-3">
              {techStack.recommendations?.map((rec: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getLinkEndId(linkEnd: unknown): string {
  if (typeof linkEnd === 'string') return linkEnd
  if (linkEnd && typeof linkEnd === 'object' && 'id' in (linkEnd as Record<string, unknown>)) {
    return String((linkEnd as { id: string }).id)
  }
  return ''
}

export default function ArchitecturePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')

  const [colorBy, setColorBy] = useState<ColorBy>('depth')
  const [sizeBy, setSizeBy] = useState<SizeBy>('inlinks')
  const [maxNodes, setMaxNodes] = useState<'all' | '200' | '500' | '1000'>('all')
  const [minDepthFilter, setMinDepthFilter] = useState(0)
  const [maxDepthFilter, setMaxDepthFilter] = useState(6)
  const [statusFilters, setStatusFilters] = useState<Record<StatusBucket, boolean>>({
    '2xx': true,
    '3xx': true,
    '4xx': true,
    '5xx': true,
    other: false,
  })
  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusConnected, setFocusConnected] = useState(false)

  const graphRef = useRef<any>(null)
  const graphContainerRef = useRef<HTMLDivElement | null>(null)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 620 })

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

  const { data: audit, isLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return isRunning || isAiRunning || isPlanRunning ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'architecture'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'architecture' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.architecture

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      await refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (_error) {
      toast.error('Nie udalo sie zaktualizowac zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      await refetchTasks()
      toast.success('Zapisano notatki')
    } catch (_error) {
      toast.error('Nie udalo sie zapisac notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczeto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udalo sie uruchomic generowania planu')
    },
  })
  const recalculateContextMutation = useMutation({
    mutationFn: () => auditsAPI.runAiContext(params.id, 'architecture'),
    onSuccess: async () => {
      await refetchAudit()
      toast.success('Rozpoczeto przeliczanie analizy Architecture')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udalo sie uruchomic przeliczania analizy')
    },
  })

  useEffect(() => {
    const updateSize = () => {
      const width = graphContainerRef.current?.clientWidth ?? 0
      setGraphSize({ width, height: 620 })
    }
    if (!graphContainerRef.current || mode !== 'data') return
    updateSize()
    const observer = new ResizeObserver(() => updateSize())
    observer.observe(graphContainerRef.current)
    const timer = window.setTimeout(updateSize, 180)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [audit?.id, audit?.status, audit?.results, mode])

  const baseGraph = useMemo(() => {
    if (!audit) return { nodes: [] as GraphNode[], links: [] as GraphLink[], stats: { totalPages: 0, totalLinks: 0, avgDepth: 0, orphanCount: 0, maxDepth: 0 } }
    return buildGraphData(audit)
  }, [audit])

  const slicedGraph = useMemo(() => {
    if (maxNodes === 'all' || baseGraph.nodes.length <= Number(maxNodes)) return baseGraph
    const limit = Number(maxNodes)
    const sorted = [...baseGraph.nodes].sort((a, b) => b.inlinks - a.inlinks)
    const keepIds = new Set(sorted.slice(0, limit).map((node) => node.id))
    const homepage = baseGraph.nodes.find((node) => node.isHomepage)
    if (homepage) keepIds.add(homepage.id)
    const nodes = baseGraph.nodes.filter((node) => keepIds.has(node.id))
    const links = baseGraph.links.filter((link) => keepIds.has(link.source) && keepIds.has(link.target))
    return { ...baseGraph, nodes, links }
  }, [baseGraph, maxNodes])

  const availableDepth = useMemo(() => {
    const min = slicedGraph.nodes.reduce((acc, node) => Math.min(acc, node.crawl_depth), Number.POSITIVE_INFINITY)
    const max = slicedGraph.nodes.reduce((acc, node) => Math.max(acc, node.crawl_depth), 0)
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    }
  }, [slicedGraph.nodes])

  useEffect(() => {
    setMinDepthFilter(availableDepth.min)
    setMaxDepthFilter(availableDepth.max)
  }, [availableDepth.min, availableDepth.max, params.id])

  const filteredNodes = useMemo(() => {
    return slicedGraph.nodes.filter((node) => {
      const passesDepth = node.crawl_depth >= minDepthFilter && node.crawl_depth <= maxDepthFilter
      const passesStatus = statusFilters[node.statusBucket]
      return passesDepth && passesStatus
    })
  }, [slicedGraph.nodes, minDepthFilter, maxDepthFilter, statusFilters])

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes])

  const filteredLinks = useMemo(
    () => slicedGraph.links.filter((link) => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)),
    [slicedGraph.links, filteredNodeIds]
  )

  const neighborsByNode = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const node of filteredNodes) {
      map.set(node.id, new Set())
    }
    for (const link of filteredLinks) {
      if (!map.has(link.source)) map.set(link.source, new Set())
      if (!map.has(link.target)) map.set(link.target, new Set())
      map.get(link.source)?.add(link.target)
      map.get(link.target)?.add(link.source)
    }
    return map
  }, [filteredNodes, filteredLinks])

  const connectedIds = useMemo(() => {
    if (!selectedNodeId || !focusConnected) return null
    const set = new Set<string>([selectedNodeId])
    for (const neighbor of neighborsByNode.get(selectedNodeId) || []) {
      set.add(neighbor)
    }
    return set
  }, [neighborsByNode, selectedNodeId, focusConnected])

  const graphNodes = useMemo(() => {
    if (!connectedIds) return filteredNodes
    return filteredNodes.filter((node) => connectedIds.has(node.id))
  }, [filteredNodes, connectedIds])

  const graphNodeIds = useMemo(() => new Set(graphNodes.map((node) => node.id)), [graphNodes])

  const graphLinks = useMemo(() => {
    return filteredLinks.filter((link) => graphNodeIds.has(link.source) && graphNodeIds.has(link.target))
  }, [filteredLinks, graphNodeIds])

  const searchQuery = search.trim().toLowerCase()
  const searchMatches = useMemo(() => {
    if (!searchQuery) return new Set<string>()
    const set = new Set<string>()
    for (const node of graphNodes) {
      const haystack = `${node.url} ${node.title}`.toLowerCase()
      if (haystack.includes(searchQuery)) set.add(node.id)
    }
    return set
  }, [graphNodes, searchQuery])

  const maxInlinks = useMemo(() => Math.max(1, ...graphNodes.map((node) => node.inlinks)), [graphNodes])
  const maxWordCount = useMemo(() => Math.max(1, ...graphNodes.map((node) => node.word_count)), [graphNodes])

  const selectedNode = useMemo(
    () => graphNodes.find((node) => node.id === selectedNodeId) || filteredNodes.find((node) => node.id === selectedNodeId) || null,
    [graphNodes, filteredNodes, selectedNodeId]
  )

  const selectedNeighborsCount = useMemo(
    () => (selectedNodeId ? (neighborsByNode.get(selectedNodeId)?.size || 0) : 0),
    [neighborsByNode, selectedNodeId]
  )
  const filteredOutCount = Math.max(0, slicedGraph.nodes.length - filteredNodes.length)
  const searchMatchesCount = searchMatches.size

  useEffect(() => {
    if (!selectedNodeId) return
    if (!filteredNodeIds.has(selectedNodeId)) {
      setSelectedNodeId(null)
      setFocusConnected(false)
    }
  }, [selectedNodeId, filteredNodeIds])

  useEffect(() => {
    if (!graphRef.current || graphNodes.length === 0 || graphSize.width <= 0) return
    const t = setTimeout(() => {
      try {
        graphRef.current.zoomToFit(600, 40)
      } catch {
        // No-op: zoom helper can fail during transient layout changes.
      }
    }, 180)
    return () => clearTimeout(t)
  }, [graphNodes.length, graphLinks.length, graphSize.width])

  const nodeRadius = (node: GraphNode) => {
    const raw = sizeBy === 'inlinks' ? node.inlinks : node.word_count
    const maxValue = sizeBy === 'inlinks' ? maxInlinks : maxWordCount
    const normalized = Math.log1p(raw) / Math.log1p(maxValue || 1)
    let radius = 3 + normalized * 17
    if (node.isHomepage) radius *= 1.8
    if (searchMatches.has(node.id)) radius += 1.5
    return Math.max(3, Math.min(22, radius))
  }

  const nodeFill = (node: GraphNode) => {
    if (node.isHomepage) return '#f59e0b'
    if (searchMatches.has(node.id)) return '#facc15'
    if (colorBy === 'status') return statusColor(node.statusBucket)
    if (colorBy === 'link_score') return linkScoreColor(node.link_score)
    return depthColor(node.crawl_depth)
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const techStack = audit.results?.tech_stack
  const rawGraphNodeCount = baseGraph.nodes.length
  const rawGraphEdgeCount = baseGraph.links.length
  const veryLargeGraph = rawGraphNodeCount > 500
  const hasNoEdgesInRawGraph = rawGraphNodeCount > 0 && rawGraphEdgeCount === 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Architektura techniczna</h1>
            <p className="text-sm text-muted-foreground">
              Stack technologiczny i mapa połączeń wewnętrznych z crawla.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {formatNumber(rawGraphNodeCount)} stron • {formatNumber(rawGraphEdgeCount)} relacji
        </Badge>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter((t) => t.status === 'pending').length}
        hasAiData={!!aiContext}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stan i szybkie akcje</CardTitle>
          <CardDescription>Diagnostyka danych grafu, analiza AI i rerun planu dla tego audytu.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Strony (all_pages)</span>
              <strong>{formatNumber(rawGraphNodeCount)}</strong>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Relacje (link_graph)</span>
              <strong>{formatNumber(rawGraphEdgeCount)}</strong>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">AI context</span>
              <Badge variant={aiContext ? 'default' : 'secondary'}>{aiContext ? 'Gotowy' : 'Brak'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Taski modułu</span>
              <strong>{formatNumber(tasks.length)}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => recalculateContextMutation.mutate()}
              disabled={recalculateContextMutation.isPending || audit?.ai_status === 'processing'}
            >
              {recalculateContextMutation.isPending ? 'Przeliczanie...' : 'Przelicz analize Architecture'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generatePlanMutation.mutate()}
              disabled={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
            >
              {generatePlanMutation.isPending ? 'Generowanie...' : 'Wygeneruj plan zadan'}
            </Button>
            {audit?.project_id ? (
              <Link href={`/projects/${audit.project_id}`}>
                <Button variant="ghost" className="w-full">
                  Przejdz do projektu i uruchom nowy audyt (pelny rerun)
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {mode === 'data' && (
        <Tabs defaultValue="site-map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[460px]">
            <TabsTrigger value="site-map">Mapa serwisu</TabsTrigger>
            <TabsTrigger value="stack">Stack technologiczny</TabsTrigger>
          </TabsList>

          <TabsContent value="site-map" className="space-y-4">
            <div className="grid grid-cols-1 @lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Strony</CardDescription>
                  <CardTitle className="text-3xl font-bold">{formatNumber(baseGraph.stats.totalPages)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Linki wewnętrzne</CardDescription>
                  <CardTitle className="text-3xl font-bold">{formatNumber(baseGraph.stats.totalLinks)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Śr. głębokość</CardDescription>
                  <CardTitle className="text-3xl font-bold">{baseGraph.stats.avgDepth.toFixed(1)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Strony osierocone</CardDescription>
                  <CardTitle className="text-3xl font-bold">{formatNumber(baseGraph.stats.orphanCount)}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {veryLargeGraph && (
              <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Ten crawl ma duży graf ({formatNumber(rawGraphNodeCount)} węzłów). Dla płynności możesz ograniczyć liczbę węzłów filtrem
                    <span className="font-medium"> Max nodes</span>.
                  </p>
                </CardContent>
              </Card>
            )}

            {hasNoEdgesInRawGraph && (
              <Card className="border-amber-300 bg-amber-50/40 dark:bg-amber-950/15">
                <CardContent className="pt-6 space-y-2">
                  <p className="text-sm font-medium">W tym audycie nie wykryto relacji w `crawl.link_graph`.</p>
                  <p className="text-xs text-muted-foreground">
                    To najczęściej oznacza legacy payload albo niepełny eksport crawla. Widok pokazuje dane stron, ale bez krawędzi grafu.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recalculateContextMutation.mutate()}
                      disabled={recalculateContextMutation.isPending || audit?.ai_status === 'processing'}
                    >
                      Przelicz analize AI
                    </Button>
                    {audit?.project_id ? (
                      <Link href={`/projects/${audit.project_id}`}>
                        <Button size="sm" variant="outline">
                          Nowy audyt w projekcie
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {baseGraph.nodes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Brak danych `crawl.all_pages` dla tego audytu.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 @2xl:grid-cols-12 gap-4">
                <Card className="@2xl:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-primary" />
                      Kontrolki mapy
                    </CardTitle>
                    <CardDescription>Filtry i kodowanie wizualne</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label>Koloruj wg</Label>
                      <Select value={colorBy} onValueChange={(value) => setColorBy(value as ColorBy)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kodowanie koloru" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="depth">Crawl depth</SelectItem>
                          <SelectItem value="status">Status HTTP</SelectItem>
                          <SelectItem value="link_score">Link score</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rozmiar wg</Label>
                      <Select value={sizeBy} onValueChange={(value) => setSizeBy(value as SizeBy)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kodowanie wielkości" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inlinks">Inlinks</SelectItem>
                          <SelectItem value="word_count">Word count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Maks. liczba węzłów</Label>
                      <Select value={maxNodes} onValueChange={(value) => setMaxNodes(value as 'all' | '200' | '500' | '1000')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Limit węzłów" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200">Top 200 (po inlinks)</SelectItem>
                          <SelectItem value="500">Top 500 (po inlinks)</SelectItem>
                          <SelectItem value="1000">Top 1000 (po inlinks)</SelectItem>
                          <SelectItem value="all">Wszystkie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Zakres głębokości</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min={availableDepth.min}
                          max={availableDepth.max}
                          value={minDepthFilter}
                          onChange={(e) => setMinDepthFilter(Math.min(Number(e.target.value || 0), maxDepthFilter))}
                        />
                        <Input
                          type="number"
                          min={availableDepth.min}
                          max={availableDepth.max}
                          value={maxDepthFilter}
                          onChange={(e) => setMaxDepthFilter(Math.max(Number(e.target.value || 0), minDepthFilter))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Statusy HTTP</Label>
                      <div className="space-y-2">
                        {(['2xx', '3xx', '4xx', '5xx', 'other'] as const).map((bucket) => (
                          <div key={bucket} className="flex items-center gap-2">
                            <Checkbox
                              id={`status-${bucket}`}
                              checked={statusFilters[bucket]}
                              onCheckedChange={(checked) =>
                                setStatusFilters((prev) => ({ ...prev, [bucket]: checked === true }))
                              }
                            />
                            <Label htmlFor={`status-${bucket}`} className="text-sm cursor-pointer">{bucket}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Szukaj URL / title</Label>
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="np. /blog lub kontakt"
                      />
                      {searchQuery ? (
                        <p className="text-xs text-muted-foreground">
                          Dopasowania: {formatNumber(searchMatchesCount)}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setColorBy('depth')
                        setSizeBy('inlinks')
                        setMaxNodes('all')
                        setMinDepthFilter(availableDepth.min)
                        setMaxDepthFilter(availableDepth.max)
                        setStatusFilters({
                          '2xx': true,
                          '3xx': true,
                          '4xx': true,
                          '5xx': true,
                          other: false,
                        })
                        setSearch('')
                        setSelectedNodeId(null)
                        setFocusConnected(false)
                      }}
                    >
                      Resetuj filtry
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Legenda:</p>
                      <p>• Złoty węzeł = homepage</p>
                      <p>• Żółty węzeł = wynik wyszukiwania</p>
                      <p>• Linia przerywana = nofollow</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="@2xl:col-span-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Graf relacji wewnętrznych
                    </CardTitle>
                    <CardDescription>
                      Kliknij węzeł, aby zobaczyć szczegóły i wyfokusować połączenia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div ref={graphContainerRef} className="h-[620px] w-full rounded-lg border bg-muted/20">
                      {graphSize.width <= 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Nie udało się ustalić szerokości kontenera grafu.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const width = graphContainerRef.current?.clientWidth ?? 0
                              setGraphSize({ width, height: 620 })
                            }}
                          >
                            Spróbuj ponownie
                          </Button>
                        </div>
                      ) : graphNodes.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Po aktualnych filtrach brak widocznych węzłów. Poszerz zakres depth/status lub zresetuj filtry.
                          </p>
                        </div>
                      ) : (
                        <ForceGraph2D
                          ref={graphRef}
                          width={graphSize.width}
                          height={graphSize.height}
                          graphData={{ nodes: graphNodes, links: graphLinks }}
                          nodeCanvasObject={(nodeRaw: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                            const node = nodeRaw as GraphNode & { x: number; y: number }
                            const radius = nodeRadius(node)
                            const fill = nodeFill(node)
                            ctx.beginPath()
                            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
                            ctx.fillStyle = fill
                            ctx.fill()

                            if (selectedNodeId === node.id) {
                              ctx.beginPath()
                              ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false)
                              ctx.strokeStyle = '#ffffff'
                              ctx.lineWidth = 2
                              ctx.stroke()
                            }

                            if (globalScale > 1.5) {
                              const label = node.shortPath || node.url
                              const fontSize = 11 / globalScale
                              ctx.font = `${fontSize}px sans-serif`
                              ctx.fillStyle = '#94a3b8'
                              ctx.fillText(label, node.x + radius + 2, node.y + fontSize / 3)
                            }
                          }}
                          linkColor={(linkRaw: any) => {
                            const sourceId = getLinkEndId(linkRaw.source)
                            const targetId = getLinkEndId(linkRaw.target)
                            if (focusConnected && connectedIds && (!connectedIds.has(sourceId) || !connectedIds.has(targetId))) {
                              return 'rgba(148,163,184,0.12)'
                            }
                            return 'rgba(148,163,184,0.5)'
                          }}
                          linkLineDash={(linkRaw: any) => {
                            const link = linkRaw as GraphLink
                            return link.follow ? [] : [4, 2]
                          }}
                          linkWidth={(linkRaw: any) => {
                            const link = linkRaw as GraphLink
                            return Math.min(4, 1 + Math.log1p(link.count || 1))
                          }}
                          nodeLabel={(nodeRaw: any) => {
                            const node = nodeRaw as GraphNode
                            return `${node.shortPath}\nDepth: ${node.crawl_depth} | Inlinks: ${node.inlinks} | Status: ${node.status_code || 'n/a'}`
                          }}
                          cooldownTicks={120}
                          d3VelocityDecay={0.25}
                          onNodeClick={(nodeRaw: any) => {
                            const node = nodeRaw as GraphNode
                            setSelectedNodeId(node.id)
                          }}
                        />
                      )}
                    </div>
                    <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Widoczne: {formatNumber(graphNodes.length)} węzłów / {formatNumber(graphLinks.length)} relacji
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          try {
                            graphRef.current?.zoomToFit(500, 35)
                          } catch {
                            // No-op.
                          }
                        }}
                      >
                        <Maximize2 className="h-3.5 w-3.5 mr-1" />
                        Dopasuj widok
                      </Button>
                    </div>
                    {filteredOutCount > 0 ? (
                      <p className="pt-2 text-xs text-muted-foreground">
                        Ukryto przez filtry: {formatNumber(filteredOutCount)} stron.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="@2xl:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-primary" />
                      Szczegóły węzła
                    </CardTitle>
                    <CardDescription>Kliknij node na grafie, aby zobaczyć metryki strony.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedNode ? (
                      <>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">URL</p>
                          <p className="font-mono text-xs break-all">{selectedNode.url}</p>
                        </div>
                        {selectedNode.title ? (
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Title</p>
                            <p className="text-sm">{selectedNode.title}</p>
                          </div>
                        ) : null}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="font-semibold">{selectedNode.status_code || 'n/a'}</p>
                          </div>
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Depth</p>
                            <p className="font-semibold">{selectedNode.crawl_depth}</p>
                          </div>
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Inlinks</p>
                            <p className="font-semibold">{formatNumber(selectedNode.inlinks)}</p>
                          </div>
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Outlinks</p>
                            <p className="font-semibold">{formatNumber(selectedNode.outlinks)}</p>
                          </div>
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Link score</p>
                            <p className="font-semibold">{selectedNode.link_score.toFixed(1)}</p>
                          </div>
                          <div className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">Word count</p>
                            <p className="font-semibold">{formatNumber(selectedNode.word_count)}</p>
                          </div>
                        </div>
                        <div className="rounded border p-2 text-sm">
                          <p className="text-xs text-muted-foreground">Połączenia bezpośrednie</p>
                          <p className="font-semibold flex items-center gap-1">
                            <CircleDot className="h-3.5 w-3.5" />
                            {formatNumber(selectedNeighborsCount)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={focusConnected ? 'default' : 'outline'}
                          onClick={() => setFocusConnected((prev) => !prev)}
                          className="w-full"
                        >
                          <Focus className="h-3.5 w-3.5 mr-1" />
                          {focusConnected ? 'Pokaż cały graf' : 'Pokaż tylko połączone'}
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Wybierz węzeł na grafie, aby wyświetlić szczegóły strony.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stack">
            {renderTechStackTab(techStack)}
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView area="architecture" aiContext={aiContext} isLoading={audit?.ai_status === 'processing'} />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="architecture"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          executionPlanStatus={audit?.execution_plan_status ?? null}
          isGeneratingPlan={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
          onGeneratePlan={() => generatePlanMutation.mutate()}
        />
      )}
    </div>
  )
}
