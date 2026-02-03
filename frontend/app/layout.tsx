import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <WorkspaceProvider>
              {children}
            </WorkspaceProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

