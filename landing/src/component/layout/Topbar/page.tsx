'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Collapse, Container } from 'react-bootstrap';
import { getAppUrl, supabase } from '@/lib/supabase';
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
} from 'react-icons/ri';

type NavLinkItem = {
  label: string;
  href: string;
  description?: string;
  icon?: ElementType<{ size?: number; className?: string }>;
};

type NavPanel = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

const Topbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = still checking
  const hoverOpenTimer = useRef<number | null>(null);
  const hoverCloseTimer = useRef<number | null>(null);

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
    [],
  );

  const isActivePath = (href: string) => {
    const base = href.split('#')[0];
    if (!base || base === '/') return pathname === '/';
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const clearTimers = () => {
    if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current);
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    hoverOpenTimer.current = null;
    hoverCloseTimer.current = null;
  };

  const closeAll = () => {
    clearTimers();
    setMobileOpen(false);
    setMobileAccordionOpen(null);
    setActivePanel(null);
  };

  const scheduleOpenPanel = (id: string) => {
    if (!canHover) return;
    clearTimers();
    hoverOpenTimer.current = window.setTimeout(() => setActivePanel(id), 120);
  };

  const scheduleClosePanel = () => {
    if (!canHover) return;
    clearTimers();
    hoverCloseTimer.current = window.setTimeout(() => setActivePanel(null), 140);
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(Boolean(mql?.matches));
    update();
    if (!mql) return;
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    // Close menus on route change (also fixes stuck-open panels after navigation).
    clearTimers();
    setActivePanel(null);
    setMobileAccordionOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.('[data-mega-root]')) return;
      setActivePanel(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!supabase) {
        if (mounted) setIsAuthenticated(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setIsAuthenticated(!!data.session);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };

    checkSession();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthenticated(!!session);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const appDashboardHref = `${getAppUrl().replace(/\/$/, '')}/dashboard`;

  return (
    <header>
      <nav
        className={`navbar navbar-expand-lg fixed-top navbar-custom sticky sticky-light nav-light ${isScrolled ? 'nav-sticky' : ''}`}
        data-mega-root
        onMouseLeave={() => scheduleClosePanel()}
      >
        <Container>
          <div className="navbar-brand logo flex-shrink-0">
            <Link
              className="navbar-caption fs-5 text-primary ls-1 fw-bold d-inline-flex align-items-center text-nowrap"
              href="/"
              onClick={() => closeAll()}
            >
              <RiSearchEyeFill size={28} className="text-orange fs-4 me-1 flex-shrink-0" /> SiteSpector
            </Link>
          </div>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-controls="navbarCollapse"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            <span className="fw-bold fs-4">
              <RiMenu5Line />
            </span>
          </button>

          <Collapse in={mobileOpen}>
            <div className="navbar-collapse" id="navbarCollapse">
              <ul className="navbar-nav mx-auto mega-nav-desktop" id="navbar-navlist">
                <li className="nav-item">
                  <Link className={`nav-link ${pathname === '/' ? 'active' : ''}`} href="/" onClick={() => closeAll()}>
                    Start
                  </Link>
                </li>

                {panels.map(panel => (
                  <li className="nav-item mega-nav-item" key={panel.id}>
                    <button
                      type="button"
                      className={`nav-link mega-nav-trigger ${panel.items.some(i => isActivePath(i.href)) ? 'active' : ''}`}
                      aria-expanded={activePanel === panel.id}
                      aria-controls={`mega-panel-${panel.id}`}
                      onMouseEnter={() => scheduleOpenPanel(panel.id)}
                      onFocus={() => setActivePanel(panel.id)}
                      onClick={() => setActivePanel(prev => (prev === panel.id ? null : panel.id))}
                    >
                      {panel.label}
                    </button>
                  </li>
                ))}

                <li className="nav-item">
                  <Link className={`nav-link ${isActivePath('/cennik') ? 'active' : ''}`} href="/cennik" onClick={() => closeAll()}>
                    Cennik
                  </Link>
                </li>
              </ul>

              {/* Mobile accordion menu (visible under 992px). */}
              <div className="mega-nav-mobile d-lg-none pt-2 pb-3">
                <div className="d-flex flex-column gap-2">
                  <Link className={`nav-link px-3 ${pathname === '/' ? 'active' : ''}`} href="/" onClick={() => closeAll()}>
                    Start
                  </Link>

                  <Link className={`nav-link px-3 ${isActivePath('/cennik') ? 'active' : ''}`} href="/cennik" onClick={() => closeAll()}>
                    Cennik
                  </Link>

                  {panels.map(panel => (
                    <div key={panel.id} className="mega-accordion">
                      <button
                        type="button"
                        className={`nav-link w-100 text-start px-3 mega-accordion-trigger ${
                          mobileAccordionOpen === panel.id ? 'active' : ''
                        }`}
                        aria-expanded={mobileAccordionOpen === panel.id}
                        onClick={() => setMobileAccordionOpen(prev => (prev === panel.id ? null : panel.id))}
                      >
                        {panel.label}
                      </button>
                      <Collapse in={mobileAccordionOpen === panel.id}>
                        <div className="mega-accordion-panel px-3 pb-2">
                          <div className="d-flex flex-column">
                            {panel.items.map(item => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`mega-accordion-link py-2 ${isActivePath(item.href) ? 'active' : ''}`}
                                onClick={() => closeAll()}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  ))}
                </div>
              </div>

              <ul className="navbar-nav nav-btn">
                {isAuthenticated === null ? (
                  <li className="nav-item" aria-hidden="true">
                    {/* Keep layout stable while session is checked */}
                    <span className="btn btn-orange text-light invisible">Przejdź do panelu</span>
                  </li>
                ) : isAuthenticated ? (
                  <li className="nav-item">
                    <Link className="btn btn-orange text-light" href={appDashboardHref} onClick={() => closeAll()}>
                      Przejdź do panelu
                    </Link>
                  </li>
                ) : (
                  <li className="nav-item d-flex align-items-center gap-2">
                    <Link className="btn btn-outline-orange" href="/login" onClick={() => closeAll()}>
                      Zaloguj się
                    </Link>
                    <Link className="btn btn-orange text-light" href="/register" onClick={() => closeAll()}>
                      Załóż konto
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </Collapse>
        </Container>

        {/* Mega panel (desktop) */}
        <div
          className={`mega-panel-wrap d-none d-lg-block ${activePanel ? 'is-open' : ''}`}
          onMouseEnter={() => clearTimers()}
          onMouseLeave={() => scheduleClosePanel()}
        >
          <div className="container">
            {panels.map(panel => (
              <div
                key={panel.id}
                id={`mega-panel-${panel.id}`}
                className={`mega-panel ${activePanel === panel.id ? 'is-active' : ''}`}
                role="region"
                aria-hidden={activePanel !== panel.id}
              >
                <div className={`mega-grid ${panel.id === 'firma' ? 'mega-grid--compact' : ''}`}>
                  {panel.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`mega-link ${isActivePath(item.href) ? 'is-active' : ''}`}
                        onClick={() => closeAll()}
                      >
                        <div className="mega-link-icon">{Icon ? <Icon size={20} /> : null}</div>
                        <div className="mega-link-content">
                          <div className="mega-link-title">{item.label}</div>
                          {item.description ? <div className="mega-link-desc">{item.description}</div> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Topbar;
