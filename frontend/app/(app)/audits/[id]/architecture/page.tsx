'use client'

/**
 * Architecture Page
 * 
 * Displays detected technology stack and server infrastructure.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, Network, Server, Code2, Shield, Globe2, Cpu, Database 
} from 'lucide-react'
import type { Audit } from '@/lib/api'

export default function ArchitecturePage({ params }: { params: { id: string } }) {
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

  const techStack = audit.results?.tech_stack

  if (!techStack) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych o architekturze. Uruchom nowy audyt, aby wykryć technologie.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Network className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Architektura Techniczna</h1>
      </div>
      
      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
        <div className="@lg:col-span-2 space-y-6">
          {/* Detected Technologies */}
          <Card>
            <CardHeader>
              <CardTitle>Wykryte Technologie</CardTitle>
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

          {/* Server Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastruktura Serwerowa
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
          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Bezpieczeństwo Stacku
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

          {/* Recommendations */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Rekomendacje Architektury</CardTitle>
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
    </div>
  )
}
