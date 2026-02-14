import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logowanie | SiteSpector',
  description: 'Zaloguj się lub załóż konto w SiteSpector.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

