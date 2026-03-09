import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { JsonLd } from '@/components/JsonLd'
import { SITE_NAME, SITE_URL } from '@/lib/seo'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/schema'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SiteSpector - Professional Website Audits',
    template: '%s | SiteSpector',
  },
  description: 'Comprehensive SEO, performance, and content audits with AI recommendations',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={[buildOrganizationSchema(), buildWebSiteSchema()]} />
      </head>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
