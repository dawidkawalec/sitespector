'use client'

/**
 * PDF Page
 * 
 * PDF preview and download page.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Download, FileDown } from 'lucide-react'

export default function PDFPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const blob = await auditsAPI.downloadPDF(params.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitespector_audit_${params.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Błąd podczas pobierania PDF.')
    } finally {
      setDownloading(false)
    }
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Raport PDF</CardTitle>
            <CardDescription>Raport nie jest jeszcze dostępny</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Raport PDF będzie dostępny po zakończeniu audytu.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Raport PDF</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pobierz Profesjonalny Raport</CardTitle>
            <CardDescription>
              Kompletny raport audytu w formacie PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <FileDown className="h-16 w-16 text-primary" />
              <p className="text-center text-muted-foreground max-w-md">
                Pobierz szczegółowy raport zawierający wszystkie metryki, analizy i rekomendacje
                w formacie gotowym do prezentacji.
              </p>
              <Button size="lg" onClick={downloadPDF} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generowanie PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Pobierz PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zawartość Raportu</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Executive Summary - ogólny wynik i kluczowe metryki</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Analiza SEO - meta tagi, nagłówki, struktura</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Wydajność - Core Web Vitals, Lighthouse scores</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Analiza treści - jakość, czytelność, rekomendacje AI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Porównanie z konkurencją (jeśli dostępne)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Plan działania - priorytetowe zadania</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
