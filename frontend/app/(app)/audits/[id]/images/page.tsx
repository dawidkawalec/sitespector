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
import { Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, XCircle, Search, Filter, HardDrive, Download, Sparkles, Wand2 } from 'lucide-react'
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

export default function ImagesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych obrazów.</p>
      </div>
    )
  }

  const imagesData = audit.results?.crawl?.images
  if (!imagesData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych o obrazach.</p>
      </div>
    )
  }

  const allImages = imagesData.all_images || []
  
  const filteredImages = allImages.filter((img: any) => {
    const matchesSearch = img.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (img.alt_text && img.alt_text.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'no-alt' && !img.alt_text) ||
                         (filter === 'large' && img.size_bytes > 512000) ||
                         (filter === 'huge' && img.size_bytes > 1048576)
    
    return matchesSearch && matchesFilter
  })

  const largeImagesCount = allImages.filter((img: any) => img.size_bytes > 512000).length
  const altTextScore = imagesData.total > 0 ? (imagesData.with_alt / imagesData.total) * 100 : 100
  const sizeScore = imagesData.total > 0 ? Math.max(0, 100 - (largeImagesCount / imagesData.total) * 200) : 100
  const optimizationScore = Math.round((altTextScore + sizeScore) / 2)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleGenerateAlt = async (imageUrl: string) => {
    setGeneratingAlt(prev => ({ ...prev, [imageUrl]: true }))
    try {
      const res = await auditsAPI.generateAlt(params.id, imageUrl)
      setAiAlts(prev => ({ ...prev, [imageUrl]: res.alt_text }))
      toast.success('Wygenerowano tekst ALT')
    } catch (error) {
      toast.error('Błąd generowania tekstu ALT')
    } finally {
      setGeneratingAlt(prev => ({ ...prev, [imageUrl]: false }))
    }
  }

  const hasAiData = !!(audit?.results?.ai_contexts?.images)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="images" audit={audit!} />}
      aiPanelTitle="AI: Obrazy"
      hasAiData={hasAiData}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Analiza Obrazów</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground uppercase font-bold">Optimization Score</p>
            <p className={`text-2xl font-bold ${optimizationScore >= 80 ? 'text-green-600' : optimizationScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {optimizationScore}/100
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>
      
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
                      {imagesData.without_alt} obrazów nie posiada opisu. Możesz użyć naszej sztucznej inteligencji, aby wygenerować brakujące teksty ALT na podstawie zawartości obrazu.
                    </p>
                  </div>
                </div>
              )}
              
              {largeImagesCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Zoptymalizuj duże obrazy</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wykryto {largeImagesCount} obrazów powyżej 500KB. Duże pliki spowalniają ładowanie strony (LCP). Rozważ kompresję lub użycie formatów nowej generacji (WebP, AVIF).
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Wszystkie Obrazy</CardTitle>
              <CardDescription>Szczegółowa lista z opcją generowania ALT przez AI</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj URL lub ALT..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtruj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="no-alt">Bez ALT</SelectItem>
                  <SelectItem value="large">&gt; 500 KB</SelectItem>
                  <SelectItem value="huge">&gt; 1 MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Podgląd</TableHead>
                  <TableHead className="w-[250px]">URL</TableHead>
                  <TableHead className="min-w-[200px]">ALT Text / AI Suggestion</TableHead>
                  <TableHead>Rozmiar</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImages.length > 0 ? (
                  filteredImages.slice(0, 50).map((img: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="w-12 h-12 rounded border bg-accent/20 overflow-hidden flex items-center justify-center relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={img.url} 
                            alt={img.alt_text || ""} 
                            className="max-w-full max-h-full object-contain"
                            onError={(e: any) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'block'
                            }}
                          />
                          <ImageIcon className="h-4 w-4 text-muted-foreground hidden" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[250px]" title={img.url}>
                        <a href={img.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-xs">
                          {img.url} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {aiAlts[img.url] ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
                              <Sparkles className="h-3 w-3" /> AI Suggestion
                            </div>
                            <p className="text-sm italic text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800/30">
                              {aiAlts[img.url]}
                            </p>
                          </div>
                        ) : img.alt_text ? (
                          <span className="text-sm">{img.alt_text}</span>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Brak ALT</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={img.size_bytes > 512000 ? 'text-yellow-600 font-bold' : ''}>
                          {formatBytes(img.size_bytes)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{img.format?.toUpperCase() || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!img.alt_text && !aiAlts[img.url] && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleGenerateAlt(img.url)}
                            disabled={generatingAlt[img.url]}
                          >
                            {generatingAlt[img.url] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Generuj ALT
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Brak obrazów spełniających kryteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
