'use client'

/**
 * Settings Layout
 * 
 * Provides sidebar navigation for settings pages
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Users, CreditCard, Palette, Bell } from 'lucide-react'

const settingsNav = [
  { 
    name: 'Profile', 
    href: '/settings/profile',
    icon: User,
    description: 'Manage your personal information'
  },
  { 
    name: 'Team', 
    href: '/settings/team',
    icon: Users,
    description: 'Manage workspace members'
  },
  { 
    name: 'Billing', 
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Subscription and invoices'
  },
  { 
    name: 'Appearance', 
    href: '/settings/appearance',
    icon: Palette,
    description: 'Theme and display preferences'
  },
  { 
    name: 'Notifications', 
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email notification settings'
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings sidebar */}
        <nav className="w-full md:w-64 space-y-1 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          {settingsNav.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Settings content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
