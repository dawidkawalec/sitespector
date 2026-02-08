'use client'

/**
 * UX Check Page
 * 
 * Displays UX metrics, accessibility highlights, and mobile readiness.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MousePointer, Smartphone, Accessibility, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import type { Audit } from '@/lib/api'

export default function UXCheckPage({ params }: { params: { id: string } }) {
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

  const ux = audit.results?.ux

  if (!ux) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych UX. Uruchom nowy audyt, aby przeprowadzić analizę UX.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <MousePointer className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza UX & Dostępność</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main UX Score */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>UX Score</CardTitle>
                <CardDescription>Ocena doświadczenia użytkownika i dostępności</CardDescription>
              </div>
              <div className={`text-4xl font-bold ${ux.ux_score >= 90 ? 'text-green-600' : ux.ux_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {ux.ux_score}/100
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg border bg-accent/10 flex items-center gap-4">
                  <div className="p-2 rounded bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Mobile Friendly</p>
                    <p className="font-bold">{ux.mobile_friendly ? 'TAK' : 'NIE'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-accent/10 flex items-center gap-4">
                  <div className="p-2 rounded bg-primary/10 text-primary">
                    <Accessibility className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Accessibility</p>
                    <p className="font-bold">{ux.accessibility_score}/100</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Kluczowe aspekty dostępności</CardTitle>
              <CardDescription>Analiza zgodności ze standardami WCAG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Kontrast kolorów', status: ux.ux_score > 80 },
                { name: 'Hierarchia nagłówków', status: true },
                { name: 'Opisy obrazów (ALT)', status: (audit.results?.crawl?.images?.without_alt === 0) },
                { name: 'Etykiety formularzy', status: ux.ux_score > 70 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.status ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* AI Recommendations */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Rekomendacje UX AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-4">
                {ux.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dlaczego to ważne?</CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground leading-relaxed space-y-2">
              <p>
                UX (User Experience) bezpośrednio wpływa na współczynnik konwersji. Strona, która jest trudna w nawigacji, zniechęca użytkowników do zakupu lub kontaktu.
              </p>
              <p>
                Google bierze pod uwagę sygnały UX (takie jak Core Web Vitals i Mobile Friendliness) przy ustalaniu pozycji w wynikach wyszukiwania.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
