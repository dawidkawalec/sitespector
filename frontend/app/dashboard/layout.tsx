/**
 * Dashboard Layout
 * 
 * Wraps dashboard and all authenticated pages with:
 * - Sidebar navigation (desktop)
 * - Mobile header with menu
 * - Main content area
 */

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu */}
        <header className="md:hidden h-16 border-b flex items-center px-4 bg-white dark:bg-gray-950 flex-shrink-0">
          <MobileSidebar />
          <h1 className="ml-4 text-xl font-bold">SiteSpector</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
