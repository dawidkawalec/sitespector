'use client'

/**
 * Main Sidebar Navigation
 * 
 * Features:
 * - Workspace switcher at top
 * - Main navigation links
 * - User section at bottom with logout
 * - Active route highlighting
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileSearch,
  Settings,
  Users,
  CreditCard,
  LogOut,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and stats'
  },
  { 
    name: 'Audits', 
    href: '/dashboard', // Same as dashboard for now
    icon: FileSearch,
    description: 'All website audits'
  },
  { 
    name: 'Team', 
    href: '/settings/team', 
    icon: Users,
    description: 'Manage members'
  },
  { 
    name: 'Billing', 
    href: '/settings/billing', 
    icon: CreditCard,
    description: 'Subscription & invoices'
  },
  { 
    name: 'Settings', 
    href: '/settings/profile', 
    icon: Settings,
    description: 'Account settings'
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">SiteSpector</span>
        </Link>
      </div>

      {/* Workspace switcher */}
      <div className="p-4 border-b">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="space-y-2">
          {currentWorkspace && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{currentWorkspace.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentWorkspace.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
