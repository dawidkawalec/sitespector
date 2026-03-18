'use client'

import Link from 'next/link'
import { SiteSpectorLogo } from '@/components/brand/SiteSpectorLogo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Lock } from 'lucide-react'
import { DEMO_SIDEBAR_SECTIONS } from '@/lib/demo-data'
import { useState } from 'react'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [showAlert, setShowAlert] = useState(false)

  const handleSidebarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        <Eye className="inline h-4 w-4 mr-1" />
        To jest <strong>demo audytu</strong> — przykładowe dane. Chcesz audyt swojej strony?{' '}
        <Link href="/register" className="underline font-bold ml-1">
          Zacznij za darmo →
        </Link>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 h-[52px] border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full w-full items-center gap-3 px-4">
          <SiteSpectorLogo href="/" logoHeight={23} />
          <div className="flex-1" />
          <Badge variant="secondary" className="hidden sm:inline-flex">Demo</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Zacznij za darmo</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Demo Sidebar */}
        <aside className="hidden md:block w-[240px] border-r border-border/50 bg-muted/30 p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Demo audytu
            </p>
            <Link href="/demo" className="block px-3 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium">
              Podsumowanie
            </Link>
          </div>

          {DEMO_SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
                {section.title}
              </p>
              {section.items.map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={handleSidebarClick}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Lock className="h-3 w-3 opacity-40" />
                  {item}
                </a>
              ))}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {showAlert && (
            <div className="fixed top-16 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-top-2">
              <Lock className="inline h-3.5 w-3.5 mr-1" />
              Szczegółowe zakładki dostępne po rejestracji.{' '}
              <Link href="/register" className="underline font-bold">Zacznij za darmo</Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
