import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SiteSpector - Professional Website Audits',
  description: 'Comprehensive SEO, performance, and content audits with AI recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
