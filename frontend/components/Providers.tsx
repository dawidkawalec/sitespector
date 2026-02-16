'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'
import { ProjectProvider } from '@/lib/ProjectContext'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <WorkspaceProvider>
          <ProjectProvider>
            {children}
            <Toaster />
          </ProjectProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
