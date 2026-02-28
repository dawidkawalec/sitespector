'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ElementType } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RiAddCircleLine,
  RiBankCardLine,
  RiBookOpenLine,
  RiEarthLine,
  RiHourglassFill,
  RiLineChartLine,
  RiMagicLine,
  RiMenu5Line,
  RiQuoteText,
  RiSearchEyeFill,
  RiShieldCheckLine,
  RiTeamLine,
  RiTerminalBoxLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type NavLinkItem = {
  label: string
  href: string
  description?: string
  icon?: ElementType<{ size?: number; className?: string }>
}

type NavPanel = {
  id: string
  label: string
  items: NavLinkItem[]
}

export function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState<string | null>(null)
  const [canHover, setCanHover] = useState(false)
  const hoverOpenTimer = useRef<number | null>(null)
  const hoverCloseTimer = useRef<number | null>(null)

  const panels: NavPanel[] = useMemo(
    () => [
      {
        id: 'produkt',
        label: 'Produkt',
        items: [
          {
            label: 'Funkcje',
            href: '/funkcje',
            description: 'Wszystkie kluczowe funkcje platformy.',
            icon: RiTerminalBoxLine,
          },
          {
            label: 'Jak to działa',
            href: '/jak-to-dziala',
            description: 'Proces audytu krok po kroku.',
            icon: RiMagicLine,
          },
          {
            label: 'Integracje',
            href: '/integracje',
            description: 'Połącz SiteSpector z narzędziami i danymi.',
            icon: RiEarthLine,
          },
          {
            label: 'Porównanie',
            href: '/porownanie',
            description: 'Zobacz różnice vs inne podejścia i narzędzia.',
            icon: RiLineChartLine,
          },
        ],
      },
      {
        id: 'dla-kogo',
        label: 'Dla kogo',
        items: [
          {
            label: 'Dla e-commerce',
            href: '/dla-ecommerce',
            description: 'Audyt i priorytety dla sklepów online.',
            icon: RiBankCardLine,
          },
          {
            label: 'Dla agencji SEO',
            href: '/dla-agencji-seo',
            description: 'Raportowanie, white-label i workflow dla agencji.',
            icon: RiTeamLine,
          },
          {
            label: 'Dla freelancerów',
            href: '/dla-freelancerow',
            description: 'Szybkie audyty i gotowe wskazówki do wdrożenia.',
            icon: RiHourglassFill,
          },
          {
            label: 'Dla menedżerów',
            href: '/dla-managerow',
            description: 'Kontrola jakości, KPI i jasne priorytety.',
            icon: RiLineChartLine,
          },
          {
            label: 'Sprawdź agencję SEO',
            href: '/sprawdz-agencje-seo',
            description: 'Zweryfikuj jakość działań i raportów dostawcy.',
            icon: RiShieldCheckLine,
          },
        ],
      },
      {
        id: 'zasoby',
        label: 'Zasoby',
        items: [
          {
            label: 'Blog',
            href: '/blog',
            description: 'SEO, wydajność, AI i praktyczne poradniki.',
            icon: RiBookOpenLine,
          },
          {
            label: 'Case studies',
            href: '/case-study',
            description: 'Historie wdrożeń i realne wyniki.',
            icon: RiQuoteText,
          },
          {
            label: 'Centrum pomocy',
            href: '/docs',
            description: 'Dokumentacja funkcji i instrukcje.',
            icon: RiBookOpenLine,
          },
          {
            label: 'Changelog',
            href: '/changelog',
            description: 'Lista zmian i nowości w produkcie.',
            icon: RiAddCircleLine,
          },
        ],
      },
      {
        id: 'firma',
        label: 'Firma',
        items: [
          { label: 'O nas', href: '/o-nas', description: 'Kim jesteśmy i co budujemy.' },
          { label: 'Kontakt', href: '/kontakt', description: 'Napisz do nas lub umów demo.' },
        ],
      },
    ],
    []
  )

  const isActivePath = (href: string) => {
    const base = href.split('#')[0]
    if (!base || base === '/') return pathname === '/'
    return pathname === base || pathname.startsWith(`${base}/`)
  }

  const clearTimers = () => {
    if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current)
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current)
    hoverOpenTimer.current = null
    hoverCloseTimer.current = null
  }

  const closeAll = () => {
    clearTimers()
    setMobileOpen(false)
    setMobileAccordionOpen(null)
    setActivePanel(null)
  }

  const scheduleOpenPanel = (id: string) => {
    if (!canHover) return
    clearTimers()
    hoverOpenTimer.current = window.setTimeout(() => setActivePanel(id), 120)
  }

  const scheduleClosePanel = () => {
    if (!canHover) return
    clearTimers()
    hoverCloseTimer.current = window.setTimeout(() => setActivePanel(null), 140)
  }

  useEffect(() => {
    const mql = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(Boolean(mql?.matches))
    update()
    if (!mql) return
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    // Close menus on route change (prevents stuck-open mega panel).
    clearTimers()
    setActivePanel(null)
    setMobileAccordionOpen(null)
    setMobileOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest?.('[data-mega-root]')) return
      setActivePanel(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <header
      data-mega-root
      onMouseLeave={() => scheduleClosePanel()}
      className="public-navbar-bg sticky top-0 z-50 w-full border-b border-[#0b363d]/10 backdrop-blur supports-[backdrop-filter]:bg-[#fff9f5]/80"
    >
      <nav className="container relative mx-auto flex h-16 items-center justify-between px-4">
        <a
          href="/"
          onClick={() => closeAll()}
          className="public-navbar-logo flex items-center gap-2 text-xl font-bold tracking-tight text-[#0b363d]"
        >
          <RiSearchEyeFill size={28} className="text-[#ff8945]" />
          SiteSpector
        </a>

        {/* Desktop nav (mega menu) */}
        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-2">
            <li>
              <a
                href="/"
                onClick={() => closeAll()}
                className={`rounded-md px-3 py-2 text-sm font-medium text-[#0b363d] transition-colors hover:text-[#ff8945] ${
                  pathname === '/' ? 'text-[#ff8945]' : ''
                }`}
              >
                Start
              </a>
            </li>

            {panels.map((panel) => (
              <li key={panel.id}>
                <button
                  type="button"
                  aria-expanded={activePanel === panel.id}
                  aria-controls={`mega-panel-${panel.id}`}
                  onMouseEnter={() => scheduleOpenPanel(panel.id)}
                  onFocus={() => setActivePanel(panel.id)}
                  onClick={() => setActivePanel((prev) => (prev === panel.id ? null : panel.id))}
                  className={`group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#0b363d] transition-colors hover:text-[#ff8945] ${
                    panel.items.some((i) => isActivePath(i.href)) ? 'text-[#ff8945]' : ''
                  }`}
                >
                  {panel.label}
                  <span
                    className={`h-[6px] w-[6px] rotate-45 border-r border-b border-current opacity-70 transition-transform ${
                      activePanel === panel.id ? 'translate-y-[1px]' : ''
                    }`}
                  />
                </button>
              </li>
            ))}

            <li>
              <a
                href="/cennik"
                onClick={() => closeAll()}
                className={`rounded-md px-3 py-2 text-sm font-medium text-[#0b363d] transition-colors hover:text-[#ff8945] ${
                  isActivePath('/cennik') ? 'text-[#ff8945]' : ''
                }`}
              >
                Cennik
              </a>
            </li>
          </ul>

          <Link href="/login">
            <Button
              variant="accent"
              size="default"
              className="public-btn-accent shrink-0 bg-[#ff8945] text-white hover:bg-[#e67a3d]"
            >
              Zaloguj się / Załóż konto
            </Button>
          </Link>
        </div>

        {/* Mega panel (desktop) */}
        <div
          onMouseEnter={() => clearTimers()}
          onMouseLeave={() => scheduleClosePanel()}
          className={`absolute left-0 right-0 top-full hidden pt-3 lg:block ${
            activePanel ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          } transition-opacity duration-150`}
        >
          <div className="mx-auto max-w-5xl rounded-2xl border border-[#0b363d]/12 bg-[#fff9f5]/90 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur">
            {panels.map((panel) => (
              <div
                key={panel.id}
                id={`mega-panel-${panel.id}`}
                role="region"
                aria-hidden={activePanel !== panel.id}
                className={activePanel === panel.id ? 'block' : 'hidden'}
              >
                <div
                  className={`grid gap-3 ${
                    panel.id === 'firma' ? 'grid-cols-2' : 'grid-cols-2'
                  }`}
                >
                  {panel.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => closeAll()}
                        className={`group flex gap-3 rounded-xl border border-transparent p-3 transition hover:border-[#0b363d]/10 hover:bg-white/80 ${
                          isActivePath(item.href) ? 'border-[#ff8945]/40 bg-white/80' : ''
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff8945]/10 text-[#ff8945]">
                          {Icon ? <Icon size={20} /> : null}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#0b363d]">{item.label}</div>
                          {item.description ? (
                            <div className="mt-1 text-xs leading-snug text-[#0b363d]/70">
                              {item.description}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Otwórz menu" className="text-[#0b363d] hover:bg-[#0b363d]/10">
              <RiMenu5Line size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] border-[#0b363d]/12 bg-[#fff9f5]">
            <div className="flex flex-col gap-6 pt-8">
              <a
                href="/"
                onClick={() => closeAll()}
                className="public-navbar-link text-base font-medium text-[#0b363d] transition-colors hover:text-[#ff8945]"
              >
                Start
              </a>

              <a
                href="/cennik"
                onClick={() => closeAll()}
                className="public-navbar-link text-base font-medium text-[#0b363d] transition-colors hover:text-[#ff8945]"
              >
                Cennik
              </a>

              <div className="flex flex-col gap-3">
                {panels.map((panel) => (
                  <div key={panel.id} className="rounded-xl border border-[#0b363d]/10 bg-white/70">
                    <button
                      type="button"
                      aria-expanded={mobileAccordionOpen === panel.id}
                      onClick={() => setMobileAccordionOpen((prev) => (prev === panel.id ? null : panel.id))}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-medium text-[#0b363d]"
                    >
                      {panel.label}
                      <span className={`h-[7px] w-[7px] rotate-45 border-r border-b border-current opacity-70 transition-transform ${mobileAccordionOpen === panel.id ? 'rotate-[225deg]' : ''}`} />
                    </button>
                    {mobileAccordionOpen === panel.id ? (
                      <div className="border-t border-[#0b363d]/10 px-4 py-2">
                        <div className="flex flex-col">
                          {panel.items.map((item) => (
                            <a
                              key={item.href}
                              href={item.href}
                              onClick={() => closeAll()}
                              className="rounded-lg px-2 py-2 text-sm font-medium text-[#0b363d]/80 transition hover:bg-[#ff8945]/10 hover:text-[#0b363d]"
                            >
                              {item.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

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
