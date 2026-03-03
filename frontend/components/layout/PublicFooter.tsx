'use client'

import { useState } from 'react'
import { RiSendPlane2Line } from 'react-icons/ri'
import { SiteSpectorLogo } from '@/components/brand/SiteSpectorLogo'

const footerColumns = [
  {
    heading: 'Produkt',
    links: [
      { label: 'Funkcje', link: '/funkcje' },
      { label: 'Jak to działa', link: '/jak-to-dziala' },
      { label: 'Integracje', link: '/integracje' },
      { label: 'Porównanie', link: '/porownanie' },
      { label: 'Cennik', link: '/cennik' },
    ],
  },
  {
    heading: 'Dla kogo',
    links: [
      { label: 'Dla e-commerce', link: '/dla-ecommerce' },
      { label: 'Dla agencji SEO', link: '/dla-agencji-seo' },
      { label: 'Dla freelancerów', link: '/dla-freelancerow' },
      { label: 'Dla menedżerów', link: '/dla-managerow' },
      { label: 'Sprawdź agencję SEO', link: '/sprawdz-agencje-seo' },
    ],
  },
  {
    heading: 'Zasoby',
    links: [
      { label: 'Blog', link: '/blog' },
      { label: 'Case studies', link: '/case-study' },
      { label: 'Centrum pomocy', link: '/docs' },
      { label: 'Changelog', link: '/changelog' },
    ],
  },
  {
    heading: 'Firma',
    links: [
      { label: 'O nas', link: '/o-nas' },
      { label: 'Kontakt', link: '/kontakt' },
      { label: 'Regulamin', link: '/regulamin' },
      { label: 'Polityka prywatności', link: '/polityka-prywatnosci' },
      { label: 'Polityka cookies', link: '/polityka-cookies' },
      { label: 'Sitemap', link: '/sitemap' },
    ],
  },
]

export function PublicFooter() {
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage('')
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sitespector.app'
      const res = await fetch(`${appUrl}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Dziękujemy za zapis!')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.detail || 'Wystąpił błąd. Spróbuj ponownie.')
      }
    } catch {
      setStatus('error')
      setMessage('Błąd połączenia. Spróbuj ponownie później.')
    }
  }

  return (
    <footer className="border-t border-[#0b363d]/20 bg-[#0b363d] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <SiteSpectorLogo
              href="/"
              className="mb-4 text-white"
              textClassName="text-xl text-white"
            />
            <p className="mt-4 text-sm text-white/80">
              Profesjonalna platforma do audytów SEO i optymalizacji stron
              internetowych.
            </p>

            <div className="mt-6">
              <div className="text-sm font-semibold text-white">Zapisz się do newslettera</div>
              <form onSubmit={handleNewsletterSubmit} className="mt-3 flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  placeholder="Twój email"
                  className="h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 outline-none ring-0 transition focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff8945] text-white transition hover:bg-[#e67a3d] disabled:opacity-70"
                  aria-label="Zapisz"
                >
                  {status === 'loading' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  ) : (
                    <RiSendPlane2Line size={18} />
                  )}
                </button>
              </form>
              {message ? (
                <div
                  className={`mt-2 text-xs ${
                    status === 'success' ? 'text-emerald-300' : status === 'error' ? 'text-red-300' : 'text-white/70'
                  }`}
                >
                  {message}
                </div>
              ) : null}
            </div>

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
                    <a
                      href={link.link}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
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
