'use client'

/**
 * AI Deep Content Analysis Page
 * 
 * Displays deep analysis of all pages including:
 * - Thin content detection
 * - Duplicate content detection
 * - Content gaps
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Copy, FileWarning, AlertCircle, CheckCircle2, Search, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Audit } from '@/lib/api'

export default function AIDeepContentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

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

  const contentDeep = audit.results?.content_deep
  const allPages = audit.results?.crawl?.all_pages || []

  if (!contentDeep) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych głębokiej analizy treści. Uruchom nowy audyt, aby wygenerować te dane.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Głęboka Analiza Treści AI</h1>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={contentDeep.thin_content_count > 0 ? "border-yellow-200 bg-yellow-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-yellow-600" />
              Thin Content (Mało treści)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentDeep.thin_content_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Strony z liczbą słów poniżej 200</p>
          </CardContent>
        </Card>
        <Card className={contentDeep.duplicate_content_count > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Copy className="h-4 w-4 text-red-600" />
              Duplicate Content (Duplikaty)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentDeep.duplicate_content_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Strony z identycznymi tytułami/treścią</p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Content Details */}
      {contentDeep.duplicates?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wykryte Duplikaty</CardTitle>
            <CardDescription>Strony o identycznych lub bardzo zbliżonych tytułach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentDeep.duplicates.map((dup: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-bold text-primary">Tytuł: {dup.title}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{dup.url1}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{dup.url2}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thin Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Strony wymagające rozbudowy</CardTitle>
          <CardDescription>Lista podstron z najmniejszą ilością treści</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">URL</TableHead>
                  <TableHead>Liczba Słów</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPages
                  .filter((p: any) => p.status_code === 200)
                  .sort((a: any, b: any) => a.word_count - b.word_count)
                  .slice(0, 10)
                  .map((page: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium truncate max-w-[400px]" title={page.url}>
                        {page.url}
                      </TableCell>
                      <TableCell>
                        <span className={page.word_count < 200 ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                          {page.word_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        {page.word_count < 200 ? (
                          <Badge variant="destructive">KRYTYCZNE</Badge>
                        ) : (
                          <Badge variant="outline">OSTRZEŻENIE</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <a href={page.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Content Strategy */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Strategia Treści AI
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4 leading-relaxed">
          <p>
            Na podstawie głębokiej analizy Twojej witryny, AI sugeruje następujące kroki:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Konsolidacja duplikatów:</strong> Strony o identycznych tytułach powinny zostać połączone lub otrzymać unikalne tagi title.</li>
            <li><strong>Rozbudowa "Thin Content":</strong> Strony z liczbą słów poniżej 200 są negatywnie oceniane przez Google. Dodaj min. 300-500 słów wartościowej treści na każdą z nich.</li>
            <li><strong>Optymalizacja pod intencję:</strong> Sprawdź, czy strony z niską liczbą słów nie są stronami technicznymi, które powinny mieć tag <code>noindex</code>.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function ArrowRight({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
