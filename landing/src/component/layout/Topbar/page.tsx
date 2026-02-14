'use client';
import useScrollEvent from '@/hooks/useScrollEvent';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Collapse, Container } from 'react-bootstrap';
import { RiSearchEyeFill, RiMenu5Line } from 'react-icons/ri';

const sections = [
  { id: 'home', label: 'Start', isHash: true },
  { id: 'about', label: 'Funkcje', isHash: true },
  { id: 'price', label: 'Cennik', isHash: true },
  { id: 'blog', label: 'Blog', isHash: false },
  { id: 'docs', label: 'Dokumentacja', isHash: false },
  { id: 'kontakt', label: 'Kontakt', isHash: false },
];

const Topbar = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const pathname = usePathname();
  const { scrollY } = useScrollEvent();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isMainPage = pathname === '/';

  const isLightHeader = ['/home-3', '/home-5', '/home-6'].includes(pathname);

  useEffect(() => {
    if (!isMainPage || isAuthPage) return;
    for (const section of sections) {
      if (!section.isHash) continue;
      const el = document.getElementById(section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
          setActiveSection(section.id);
          break;
        }
      }
    }
  }, [scrollY, isAuthPage, isMainPage]);

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
                {sections.map(sec => (
                  <li className="nav-item" key={sec.id}>
                    <Link
                      className={`nav-link ${isMainPage && activeSection === sec.id ? 'active' : ''}`}
                      href={sec.isHash ? (isMainPage ? `#${sec.id}` : `/#${sec.id}`) : `/${sec.id}`}
                    >
                      {sec.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="navbar-nav nav-btn">
                <li className="nav-item">
                  <Link className="btn btn-orange text-light" href="/login">
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
