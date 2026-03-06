'use client'

/**
 * PDF Report Download Page
 * Allows selecting report type (Executive / Standard / Full) before downloading.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Download,
  FileText,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ReportType = 'executive' | 'standard' | 'full'

interface ReportTypeOption {
  id: ReportType
  label: string
  subtitle: string
  description: string
  pages: string
  audience: string
  features: string[]
  icon: React.ReactNode
  color: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

const REPORT_TYPES: ReportTypeOption[] = [
  {
    id: 'executive',
    label: 'Executive Summary',
    subtitle: 'Skrócony raport',
    description:
      'Raport dla zarządu i prezentacji. Kluczowe wyniki, dashboard metryk i TOP 5 Quick Wins.',
    pages: '15–25 stron',
    audience: 'Zarząd, prezentacje klientom',
    features: [
      'Executive Summary z AI',
      'Kluczowe wyniki (4 scores)',
      'Schema.org Executive (AI readiness + krytyczne braki)',
      'Render bez JS + soft404 (skrót)',
      'Robots/Hreflang/SSL — status techniczny',
      'Widoczność — metryki dashboardu',
      'TOP 5 Quick Wins',
      'Akcje natychmiastowe',
      'Benchmark branżowy',
    ],
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'text-blue-600',
    badgeVariant: 'outline',
  },
  {
    id: 'standard',
    label: 'Standard Report',
    subtitle: 'Kompletny raport',
    description:
      'Pełna analiza dla zespołów marketingowych. SEO techniczne, wydajność, Senuto, pełna strategia AI.',
    pages: '50–80 stron',
    audience: 'Zespoły marketingowe, SEO',
    features: [
      'Wszystko z Executive +',
      'Schema.org Standard (typy, priorytety, rekomendacje)',
      'Render/no-JS + Semantyka HTML + Soft404',
      'Dyrektywy robots / hreflang / nofollow',
      'SEO techniczne (on-page, linki, redirecty, URL)',
      'Wydajność + Lighthouse audyts',
      'Widoczność TOP 50 keywords',
      'Backlinks + analiza',
      'AI Insights per obszar (9)',
      'Pełny Roadmap AI',
      'Plan Wykonania (30 zadań)',
      'Załącznik — TOP 50 stron',
    ],
    icon: <FileText className="h-6 w-6" />,
    color: 'text-violet-600',
    badgeVariant: 'default',
  },
  {
    id: 'full',
    label: 'Full Audit Report',
    subtitle: 'Pełny raport techniczny',
    description:
      'Kompletny raport z wszystkimi danymi surowymi. Dla agencji i zaawansowanych audytorów SEO.',
    pages: '80–150+ stron',
    audience: 'Agencje SEO, audytorzy techniczni',
    features: [
      'Wszystko ze Standard +',
      'Schema.org Full (pełna walidacja i checklista)',
      'Surowe dane Screaming Frog',
      'Pełne Lighthouse (opportunities + passed)',
      'TOP 200 keywords + wins/losses',
      'TOP 200 backlinks + ref domains',
      'AI Overviews — pełne dane',
      'Quick Wins z fix suggestions',
      'Pełny Plan Wykonania',
      'Załączniki: WSZYSTKIE strony, obrazy, keywords, backlinks',
    ],
    icon: <BookOpen className="h-6 w-6" />,
    color: 'text-orange-600',
    badgeVariant: 'destructive',
  },
]

export default function PDFPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [selectedType, setSelectedType] = useState<ReportType>('standard')
  const [downloading, setDownloading] = useState(false)
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
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

  const handleDownload = async (reportType: ReportType) => {
    setDownloading(true)
    setDownloadingType(reportType)
    try {
      const blob = await auditsAPI.downloadPDF(params.id, reportType)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const suffix = reportType !== 'standard' ? `_${reportType}` : ''
      a.download = `sitespector_audit_${params.id}${suffix}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Błąd podczas generowania PDF. Spróbuj ponownie.')
    } finally {
      setDownloading(false)
      setDownloadingType(null)
    }
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie został znaleziony.</p>
      </div>
    )
  }

  if (audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Raport PDF</CardTitle>
            <CardDescription>Raport nie jest jeszcze dostępny</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <p>Raport PDF będzie dostępny po zakończeniu audytu.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedOption = REPORT_TYPES.find((r) => r.id === selectedType)!

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Raport PDF</h1>
        <p className="text-muted-foreground">
          Wybierz typ raportu dostosowany do odbiorcy i poziomu szczegółowości.
        </p>
      </div>

      {/* Report type selector */}
      <div className="grid @md:grid-cols-3 gap-4 mb-8">
        {REPORT_TYPES.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedType(option.id)}
            className={cn(
              'text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md',
              selectedType === option.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40',
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2 rounded-lg bg-muted', option.color)}>{option.icon}</div>
              <Badge variant={option.badgeVariant} className="text-xs">
                {option.pages}
              </Badge>
            </div>
            <div className="font-semibold mb-0.5">{option.label}</div>
            <div className="text-xs text-muted-foreground mb-3">{option.subtitle}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
            {selectedType === option.id && (
              <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Wybrany
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected report details + download */}
      <div className="grid @md:grid-cols-5 gap-6">
        {/* Features list */}
        <Card className="@md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={selectedOption.color}>{selectedOption.icon}</span>
              {selectedOption.label}
            </CardTitle>
            <CardDescription>{selectedOption.audience}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedOption.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Download area */}
        <Card className="@md:col-span-2">
          <CardHeader>
            <CardTitle>Pobierz raport</CardTitle>
            <CardDescription>
              Generowanie może potrwać 30–90 sekund w zależności od rozmiaru danych.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Typ:</span>
                <span className="font-medium">{selectedOption.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Szacowane strony:</span>
                <span className="font-medium">{selectedOption.pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">PDF A4</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => handleDownload(selectedType)}
              disabled={downloading}
            >
              {downloading && downloadingType === selectedType ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generowanie PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Pobierz {selectedOption.label}
                </>
              )}
            </Button>

            {/* Quick download buttons for other types */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Szybkie pobieranie:</p>
              <div className="space-y-2">
                {REPORT_TYPES.filter((r) => r.id !== selectedType).map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleDownload(option.id)}
                    disabled={downloading}
                  >
                    {downloading && downloadingType === option.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {option.label} ({option.pages})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
