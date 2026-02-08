'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { RiSearchEyeFill, RiMenu5Line } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'home', label: 'Start', href: '/' },
  { id: 'about', label: 'Funkcje', href: '/#about' },
  { id: 'services', label: 'Wydajność', href: '/#services' },
  { id: 'price', label: 'Cennik', href: '/#price' },
  { id: 'faq', label: 'FAQ', href: '/#faq' },
  { id: 'contacts', label: 'Kontakt', href: '/#contacts' },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
        >
          <RiSearchEyeFill size={28} className="text-accent" />
          SiteSpector
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex gap-6">
            {sections.map((sec) => (
              <li key={sec.id}>
                <Link
                  href={sec.href}
                  className={cn(
                    'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    pathname === sec.href && 'text-foreground'
                  )}
                >
                  {sec.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/login">
            <Button variant="accent" size="default" className="shrink-0">
              Zaloguj się / Załóż konto
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Otwórz menu">
              <RiMenu5Line size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-6 pt-8">
              {sections.map((sec) => (
                <Link
                  key={sec.id}
                  href={sec.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-foreground hover:text-accent"
                >
                  {sec.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="accent" className="w-full">
                  Zaloguj się / Załóż konto
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
