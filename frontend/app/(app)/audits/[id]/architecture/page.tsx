'use client'

/**
 * Architecture Page - Coming Soon
 * 
 * Future feature: Detect and display technology stack.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Network, Clock } from 'lucide-react'

export default function ArchitecturePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Architektura Techniczna</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            Wkrótce Dostępne
          </CardTitle>
          <CardDescription>
            Ta funkcja jest w przygotowaniu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Analiza architektury technicznej pozwoli Ci:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Wykrywać używane technologie (CMS, framework, biblioteki)</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Identyfikować serwery i infrastrukturę</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Analizować stack JavaScript i CSS</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Sprawdzać wersje bibliotek i potencjalne luki bezpieczeństwa</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
