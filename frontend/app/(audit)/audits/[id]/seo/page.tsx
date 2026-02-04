'use client'

/**
 * SEO Analysis Page
 * 
 * Displays comprehensive SEO metrics including:
 * - Meta tags (title, description)
 * - Header structure (H1 tags)
 * - Technical metrics (status code, load time, word count, page size)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Audit } from '@/lib/api'

export default function SeoPage({ params }: { params: { id: string } }) {
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych SEO.</p>
      </div>
    )
  }

  const crawl = audit.results?.crawl
  if (!crawl) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych z crawlowania.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analiza SEO</h1>
      
      <div className="space-y-6">
        {/* Meta Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Meta Title</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold break-words">{crawl.title || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Długość: {crawl.title?.length || 0} znaków
                {crawl.title && crawl.title.length < 30 && ' (za krótki)'}
                {crawl.title && crawl.title.length > 70 && ' (za długi)'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Meta Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm break-words">{crawl.meta_desc || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Długość: {crawl.meta_desc?.length || 0} znaków
                {crawl.meta_desc && crawl.meta_desc.length < 120 && ' (za krótka)'}
                {crawl.meta_desc && crawl.meta_desc.length > 170 && ' (za długa)'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* H1 Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nagłówki H1</CardTitle>
          </CardHeader>
          <CardContent>
            {crawl.h1_tags && crawl.h1_tags.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {crawl.h1_tags.map((h1: string, i: number) => (
                  <li key={i} className="text-sm">{h1}</li>
                ))}
              </ul>
            ) : (
              <span className="text-yellow-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Brak nagłówków H1
              </span>
            )}
          </CardContent>
        </Card>

        {/* Technical Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Status Code</div>
            <div className="text-2xl font-bold mt-1">{crawl.status_code || '-'}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Load Time</div>
            <div className="text-2xl font-bold mt-1">
              {crawl.load_time ? `${Math.round(crawl.load_time * 1000)}ms` : '-'}
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Word Count</div>
            <div className="text-2xl font-bold mt-1">{crawl.word_count || 0}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Page Size</div>
            <div className="text-2xl font-bold mt-1">
              {crawl.size_bytes ? `${Math.round(crawl.size_bytes / 1024)} KB` : '-'}
            </div>
          </div>
        </div>

        {/* SEO Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Rekomendacje SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!crawl.title && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Brak title tag - dodaj tytuł strony</span>
                </div>
              )}
              {crawl.title && crawl.title.length < 30 && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Title za krótki - zalecane 30-70 znaków</span>
                </div>
              )}
              {!crawl.meta_desc && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Brak meta description - dodaj opis strony</span>
                </div>
              )}
              {(!crawl.h1_tags || crawl.h1_tags.length === 0) && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Brak nagłówka H1 - dodaj główny nagłówek strony</span>
                </div>
              )}
              {crawl.word_count && crawl.word_count < 300 && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Za mało treści - zalecane minimum 300 słów</span>
                </div>
              )}
              {crawl.title && crawl.meta_desc && crawl.h1_tags && crawl.h1_tags.length > 0 && 
               crawl.word_count && crawl.word_count >= 300 && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Podstawowe elementy SEO są prawidłowe!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
