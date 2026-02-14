import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mapa strony | SiteSpector',
  description: 'Pełna struktura strony SiteSpector – szybki dostęp do wszystkich sekcji i podstron.',
  alternates: { canonical: '/sitemap' },
}

export default function SitemapLayout({ children }: { children: React.ReactNode }) {
  return children
}

