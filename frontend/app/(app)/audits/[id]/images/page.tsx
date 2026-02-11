'use client'

/**
 * Images Analysis Page
 * 
 * Displays comprehensive image analysis including:
 * - Summary metrics (total, with/without alt, size)
 * - Image size distribution chart
 * - Full image list with filtering
 * - AI ALT text generation
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, XCircle, Search, Filter, HardDrive, Download, Sparkles, Wand2, Database } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageSizeChart } from '@/components/AuditCharts'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function OverviewTab({ imagesData, allImages, params, generatingAlt, aiAlts, handleGenerateAlt }: { imagesData: any; allImages: any[]; params: any; generatingAlt: any; aiAlts: any; handleGenerateAlt: any }) {
  const largeImagesCount = allImages.filter((img: any) => img.size_bytes > 512000).length
  const altTextScore = imagesData.total > 0 ? (imagesData.with_alt / imagesData.total) * 100 : 100
  const sizeScore = imagesData.total > 0 ? Math.max(0, 100 - (largeImagesCount / imagesData.total) * 200) : 100

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wszystkie Obrazy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{imagesData.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brak ALT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(imagesData.without_alt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {imagesData.without_alt || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duże Obrazy (&gt;500KB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${largeImagesCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {largeImagesCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Łączny Rozmiar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{imagesData.total_size_mb?.toFixed(2) || 0} MB</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rekomendacje dla Obrazów</CardTitle>
            <CardDescription>Jak poprawić SEO i szybkość ładowania poprzez obrazy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imagesData.without_alt > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Uzupełnij brakujące teksty alternatywne (ALT)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {imagesData.without_alt} obrazów nie posiada opisu.
                    </p>
                  </div>
                </div>
              )}
              {largeImagesCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Zoptymalizuj duże obrazy</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wykryto {largeImagesCount} obrazów powyżej 500KB.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rozkład Rozmiarów</CardTitle>
            <CardDescription>Liczba obrazów w przedziałach wielkości</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageSizeChart images={allImages} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Obrazów</CardTitle>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={allImages}
            columns={[
              { key: 'url', label: 'URL', className: 'font-medium truncate', maxWidth: '300px' },
              { key: 'alt_text', label: 'ALT Text', render: (v: any) => v || <Badge variant="destructive">Brak</Badge> },
              { key: 'size_bytes', label: 'Rozmiar', render: (v: any) => formatBytes(v) },
              { key: 'format', label: 'Format' },
            ]}
            pageSize={20}
            exportFilename="obrazy_lista"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function RawDataTab({ imagesData, audit }: { imagesData: any; audit: Audit }) {
  const allImages = imagesData.all_images || []
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Surowe dane obrazów</h3>
        <Badge variant="outline">{allImages.length} rekordów</Badge>
      </div>

      <DataExplorerTable
        data={allImages}
        columns={allImages.length > 0 ? Object.keys(allImages[0]).slice(0, 8).map(k => ({ key: k, label: k })) : []}
        pageSize={25}
        exportFilename="obrazy_raw"
      />
    </div>
  )
}

export default function ImagesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [generatingAlt, setGeneratingAlt] = useState<Record<string, boolean>>({})
  const [aiAlts, setAiAlts] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

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

  const imagesData = audit.results?.crawl?.images
  const hasAiData = !!(audit?.results?.ai_contexts?.images)

  const handleGenerateAlt = async (imageUrl: string) => {
    setGeneratingAlt(prev => ({ ...prev, [imageUrl]: true }))
    try {
      const res = await auditsAPI.generateAlt(params.id, imageUrl)
      setAiAlts(prev => ({ ...prev, [imageUrl]: res.alt_text }))
      toast.success('Wygenerowano tekst ALT')
    } catch (error) {
      toast.error('Błąd AI')
    } finally {
      setGeneratingAlt(prev => ({ ...prev, [imageUrl]: false }))
    }
  }

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="images" audit={audit!} />}
      aiPanelTitle="AI: Obrazy"
      hasAiData={hasAiData}
      isAiLoading={audit?.ai_status === 'processing'}
    >
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Analiza Obrazów</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <OverviewTab 
              imagesData={imagesData} 
              allImages={imagesData.all_images || []} 
              params={params}
              generatingAlt={generatingAlt}
              aiAlts={aiAlts}
              handleGenerateAlt={handleGenerateAlt}
            />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab imagesData={imagesData} audit={audit!} />
          </TabsContent>
        </Tabs>
      </div>
    </AuditPageLayout>
  )
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
