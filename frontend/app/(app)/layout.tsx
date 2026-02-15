/**
 * Dashboard Layout
 * 
 * Wraps dashboard and all authenticated pages with:
 * - Sidebar navigation (desktop)
 * - Mobile header with menu
 * - Main content area
 */

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatToggleButton } from '@/components/chat/ChatToggleButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <UnifiedSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu */}
        <header className="md:hidden h-16 border-b border-white/10 flex items-center px-4 bg-[#0b363d] text-white flex-shrink-0">
          <MobileSidebar />
          <h1 className="ml-4 text-xl font-bold">SiteSpector</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      <ChatPanel />
      <ChatToggleButton />
    </div>
  )
}
