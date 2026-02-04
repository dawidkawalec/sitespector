'use client'

/**
 * Benchmark Page - Coming Soon
 * 
 * Future feature: Compare with industry standards.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Clock } from 'lucide-react'

export default function BenchmarkPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Benchmark</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Wkrótce Dostępne
          </CardTitle>
          <CardDescription>
            Ta funkcja jest w przygotowaniu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Funkcja benchmark pozwoli Ci:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Porównać Twoją stronę ze standardami branżowymi</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Zobaczyć jak wypadasz na tle konkurencji</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Otrzymać rekomendacje bazujące na najlepszych praktykach</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Ustawić cele optymalizacji oparte na danych rynkowych</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
