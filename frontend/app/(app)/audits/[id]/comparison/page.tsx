'use client'

/**
 * Comparison Page - Coming Soon
 * 
 * Future feature: Compare this audit with previous audits of the same URL.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftRight, Clock } from 'lucide-react'

export default function ComparisonPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Porównanie Audytów</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Wkrótce Dostępne
          </CardTitle>
          <CardDescription>
            Ta funkcja jest w przygotowaniu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Funkcja porównywania audytów pozwoli Ci:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Śledzić progres w czasie - porównaj wyniki z poprzednich audytów</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Wizualizować zmiany metryk SEO i wydajności</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Identyfikować trendy i obszary wymagające uwagi</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Eksportować raporty postępów</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Aby móc porównywać audyty, musisz najpierw wykonać więcej niż jeden audyt dla tego samego URL.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
