'use client'

/**
 * Settings Layout
 * 
 * Simplified layout for settings pages.
 * Navigation is now in the main UnifiedSidebar.
 */

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {children}
    </div>
  )
}
