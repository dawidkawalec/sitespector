import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">SiteSpector</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-Powered Website Audits
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline" size="lg">
              Zaloguj się
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg">
              Załóż konto
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

