'use client';
import useScrollEvent from '@/hooks/useScrollEvent';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Collapse, Container } from 'react-bootstrap';
import { RiSearchEyeFill, RiMenu5Line } from 'react-icons/ri';

type NavLinkItem = { label: string; href: string };
type NavDropdown = { id: string; label: string; items: NavLinkItem[] };

const Topbar = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'price'>('home');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { scrollY } = useScrollEvent();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isMainPage = pathname === '/';

  const isLightHeader = ['/home-3', '/home-5', '/home-6'].includes(pathname);

  const dropdowns: NavDropdown[] = useMemo(
    () => [
      {
        id: 'produkt',
        label: 'Produkt',
        items: [
          { label: 'Funkcje', href: '/funkcje' },
          { label: 'Jak to działa', href: '/jak-to-dziala' },
          { label: 'Integracje', href: '/integracje' },
          { label: 'Porównanie', href: '/porownanie' },
          { label: 'Cennik', href: '/#price' },
        ],
      },
      {
        id: 'dla-kogo',
        label: 'Dla kogo',
        items: [
          { label: 'Dla e-commerce', href: '/dla-ecommerce' },
          { label: 'Dla agencji SEO', href: '/dla-agencji-seo' },
          { label: 'Dla freelancerów', href: '/dla-freelancerow' },
          { label: 'Dla menedżerów', href: '/dla-managerow' },
          { label: 'Sprawdź agencję SEO', href: '/sprawdz-agencje-seo' },
        ],
      },
      {
        id: 'zasoby',
        label: 'Zasoby',
        items: [
          { label: 'Blog', href: '/blog' },
          { label: 'Case studies', href: '/case-study' },
          { label: 'Centrum pomocy', href: '/docs' },
          { label: 'Changelog', href: '/changelog' },
        ],
      },
      {
        id: 'firma',
        label: 'Firma',
        items: [
          { label: 'O nas', href: '/o-nas' },
          { label: 'Kontakt', href: '/kontakt' },
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

  const closeAll = () => {
    setOpen(false);
    setOpenDropdown(null);
  };

  useEffect(() => {
    if (!isMainPage || isAuthPage) return;
    for (const id of ['home', 'about', 'price'] as const) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
          setActiveSection(id);
          break;
        }
      }
    }
  }, [scrollY, isAuthPage, isMainPage]);

  useEffect(() => {
    // Close dropdowns on route change
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.('.navbar-nav')) return;
      setOpenDropdown(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header>
      <nav
        className={`navbar navbar-expand-lg fixed-top navbar-custom sticky sticky-light 
        ${isLightHeader ? 'navbar-light' : 'nav-light'} 
        ${scrollY > 100 ? 'nav-sticky' : ''}`}
      >
        <Container>
          <div className="navbar-brand logo">
            <Link
              className={`navbar-caption fs-4 ${isLightHeader ? 'text-light' : 'text-primary'} ls-1 fw-bold`}
              href="/"
            >
              <RiSearchEyeFill size={28} className="text-orange fs-4 mb-2 me-1" /> SiteSpector
            </Link>
          </div>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setOpen(!open)}
            aria-controls="navbarCollapse"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <span className="fw-bold fs-4">
              <RiMenu5Line />
            </span>
          </button>

          <Collapse in={open}>
            <div className="navbar-collapse" id="navbarCollapse">
              <ul className="navbar-nav mx-auto" id="navbar-navlist">
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isMainPage && activeSection === 'home' ? 'active' : ''}`}
                    href={isMainPage ? '#home' : '/'}
                    onClick={() => setOpen(false)}
                  >
                    Start
                  </Link>
                </li>

                {isMainPage && (
                  <>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                        href="#about"
                        onClick={() => setOpen(false)}
                      >
                        Funkcje
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${activeSection === 'price' ? 'active' : ''}`}
                        href="#price"
                        onClick={() => setOpen(false)}
                      >
                        Cennik
                      </Link>
                    </li>
                  </>
                )}

                {dropdowns.map(d => (
                  <li className="nav-item dropdown" key={d.id}>
                    <button
                      type="button"
                      className={`nav-link dropdown-toggle ${d.items.some(i => isActivePath(i.href)) ? 'active' : ''}`}
                      aria-expanded={openDropdown === d.id}
                      onClick={() => setOpenDropdown(prev => (prev === d.id ? null : d.id))}
                    >
                      {d.label}
                    </button>
                    <ul className={`dropdown-menu ${openDropdown === d.id ? 'show' : ''}`}>
                      {d.items.map(item => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`dropdown-item ${isActivePath(item.href) ? 'active' : ''}`}
                            onClick={() => closeAll()}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <ul className="navbar-nav nav-btn">
                <li className="nav-item">
                  <Link className="btn btn-orange text-light" href="/login" onClick={() => closeAll()}>
                    Zaloguj się / Załóż konto
                  </Link>
                </li>
              </ul>
            </div>
          </Collapse>
        </Container>
      </nav>
    </header>
  );
};

export default Topbar;
