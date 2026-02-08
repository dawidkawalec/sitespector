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
    <header className="public-navbar-bg sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-[#fff9f5]/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="public-navbar-logo flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <RiSearchEyeFill size={28} className="text-[#ff8945]" />
          SiteSpector
        </Link>

        {/* Desktop nav – jasny jak na landingu: dark teal linki, jeden pomarańczowy przycisk */}
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex gap-6">
            {sections.map((sec) => (
              <li key={sec.id}>
                <Link
                  href={sec.href}
                  className={cn(
                    'public-navbar-link text-sm font-medium transition-colors',
                    pathname === sec.href && 'text-[#ff8945]'
                  )}
                >
                  {sec.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/login">
            <Button variant="accent" size="default" className="public-btn-accent shrink-0 bg-[#ff8945] text-white hover:bg-[#e67a3d]">
              Zaloguj się / Załóż konto
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Otwórz menu" className="text-[#0b363d] hover:bg-[#0b363d]/10">
              <RiMenu5Line size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] border-[#0b363d]/12 bg-[#fff9f5]">
            <div className="flex flex-col gap-6 pt-8">
              {sections.map((sec) => (
                <Link
                  key={sec.id}
                  href={sec.href}
                  onClick={() => setMobileOpen(false)}
                  className="public-navbar-link text-base font-medium text-[#0b363d] transition-colors hover:text-[#ff8945]"
                >
                  {sec.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button className="public-btn-accent w-full bg-[#ff8945] text-white hover:bg-[#e67a3d]">
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
