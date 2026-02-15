'use client'

import Link from 'next/link'
import { RiSearchEyeFill } from 'react-icons/ri'
import { JsonLd } from '@/components/JsonLd'
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema'

const sitemapSections = [
  {
    title: 'Główne',
    links: [
      { label: 'Strona główna', href: '/' },
      { label: 'Zaloguj się / Załóż konto', href: '/login' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Cennik', href: '/cennik' },
    ],
  },
  {
    title: 'Produkt',
    links: [
      { label: 'Funkcje', href: '/funkcje' },
      { label: 'Cennik', href: '/cennik' },
      { label: 'Blog', href: '/blog' },
      { label: 'Dokumentacja', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Rozwiązania',
    links: [
      { label: 'Dla agencji SEO', href: '/dla-agencji-seo' },
      { label: 'Dla freelancerów', href: '/dla-freelancerow' },
      { label: 'Dla e-commerce', href: '/dla-ecommerce' },
      { label: 'Sprawdź agencję SEO', href: '/sprawdz-agencje-seo' },
      { label: 'Case study', href: '/case-study' },
      { label: 'Porównanie', href: '/porownanie' },
    ],
  },
  {
    title: 'Firma',
    links: [
      { label: 'O nas', href: '/o-nas' },
      { label: 'Kontakt', href: '/kontakt' },
    ],
  },
  {
    title: 'Prawne',
    links: [
      { label: 'Regulamin', href: '/regulamin' },
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci' },
      { label: 'Polityka cookies', href: '/polityka-cookies' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/sitemap',
            title: 'Mapa strony | SiteSpector',
            description: 'Pełna struktura strony SiteSpector – szybki dostęp do wszystkich sekcji i podstron.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Mapa strony', path: '/sitemap' },
          ]),
        ]}
      />
      <div className="mb-12 flex items-center gap-3">
        <RiSearchEyeFill size={32} className="text-[#ff8945]" />
        <h1 className="text-3xl font-bold text-[#0b363d]">Mapa strony</h1>
      </div>
      <p className="mb-12 text-[#616c6e]">
        Pełna struktura strony SiteSpector – szybki dostęp do wszystkich sekcji i podstron.
      </p>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {sitemapSections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-4 text-lg font-semibold text-[#0b363d]">{section.title}</h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#616c6e] transition-colors hover:text-[#ff8945]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-[#616c6e]">
        Dla wyszukiwarek:{' '}
        <Link href="/sitemap.xml" className="text-[#ff8945] hover:underline">
          sitemap.xml
        </Link>
      </p>
    </div>
  )
}
