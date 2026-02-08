'use client'

import Link from 'next/link'
import { RiSearchEyeFill } from 'react-icons/ri'

const footerColumns = [
  {
    heading: 'Produkt',
    links: [
      { label: 'Funkcje', link: '/#about' },
      { label: 'Wydajność', link: '/#services' },
      { label: 'Cennik', link: '/#price' },
      { label: 'FAQ', link: '/#faq' },
    ],
  },
  {
    heading: 'Firma',
    links: [
      { label: 'O nas', link: '#' },
      { label: 'Kariera', link: '#' },
      { label: 'Kontakt', link: '/#contacts' },
    ],
  },
  {
    heading: 'Wsparcie',
    links: [
      { label: 'Zaloguj się / Załóż konto', link: '/login' },
      { label: 'Dokumentacja', link: '#' },
    ],
  },
]

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#0b363d]/20 bg-[#0b363d] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-white"
            >
              <RiSearchEyeFill size={28} className="text-[#ff8945]" />
              SiteSpector
            </Link>
            <p className="mt-4 text-sm text-white/80">
              Profesjonalna platforma do audytów SEO i optymalizacji stron
              internetowych.
            </p>
            <p className="mt-6 text-sm text-white/70">
              © {year} SiteSpector
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h5 className="mb-4 text-sm font-semibold text-white">{col.heading}</h5>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.link}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
