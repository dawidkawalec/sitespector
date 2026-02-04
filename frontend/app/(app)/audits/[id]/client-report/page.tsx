'use client'

/**
 * Client Report Page - Coming Soon
 * 
 * Future feature: Generate client-friendly reports.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUser, Clock } from 'lucide-react'

export default function ClientReportPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Raport dla Klienta</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUser className="h-6 w-6" />
            Wkrótce Dostępne
          </CardTitle>
          <CardDescription>
            Ta funkcja jest w przygotowaniu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Raporty dla klientów będą zawierać:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Uproszczone podsumowanie wyników w języku nietechnicznym</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Możliwość dostosowania brandingu (logo, kolory)</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Priorytetową listę zadań z wyjaśnieniami</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Harmonogram wdrożenia rekomendacji</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Export do różnych formatów (PDF, PowerPoint)</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
