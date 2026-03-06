'use client'

/**
 * Pricing Page
 *
 * Temporary placeholder until final pricing is published.
 */

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="container mx-auto py-16 px-4 bg-[#fff9f5]/30 dark:bg-transparent min-h-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-4 text-primary tracking-tight">
          Cennik <span className="text-line">wkrótce</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Finalizujemy pakiety i warunki współpracy. W tej chwili cennik nie jest jeszcze publicznie dostępny.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto border-none shadow-xl">
        <CardHeader className="text-center bg-primary/5 rounded-t-xl pb-6">
          <CardTitle className="text-2xl font-bold">Oferta jest w przygotowaniu</CardTitle>
          <CardDescription className="text-base mt-2">
            Wróć wkrótce albo skontaktuj się z nami, jeśli potrzebujesz dostępu już teraz.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-muted-foreground text-center space-y-2">
          <p>Placeholder cenowy został ustawiony globalnie do czasu publikacji finalnego cennika.</p>
          <p>Po wdrożeniu nowej oferty przywrócimy szczegóły planów i checkout.</p>
        </CardContent>
        <CardFooter className="pb-8 justify-center">
          <Button asChild className="rounded-xl px-8">
            <Link href="/kontakt">Skontaktuj się z nami</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>Szczegóły cenowe wkrótce.</p>
        <p className="mt-2">
          Masz pytania? <a href="mailto:support@sitespector.app" className="text-accent hover:underline font-bold">Skontaktuj się z nami</a>
        </p>
      </div>
    </div>
  )
}
