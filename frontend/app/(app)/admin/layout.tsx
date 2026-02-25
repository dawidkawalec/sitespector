'use client'

/**
 * Admin Layout
 *
 * Wraps all /admin/* pages. Checks is_super_admin flag and redirects
 * to /dashboard if the user is not authorised.
 */

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdmin } from '@/lib/useAdmin'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  Server,
  Shield,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Przegląd', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Użytkownicy', icon: Users },
  { href: '/admin/workspaces', label: 'Workspace\'y', icon: Building2 },
  { href: '/admin/audits', label: 'Audyty', icon: Activity },
  { href: '/admin/system', label: 'System', icon: Server },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.replace('/dashboard')
    }
  }, [isLoading, isSuperAdmin, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-10 w-10 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Weryfikacja uprawnień…</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card shrink-0">
        {/* Header */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Shield className="h-5 w-5 text-red-500" />
          <span className="text-sm font-bold tracking-wide uppercase text-foreground">
            Admin Panel
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Link href="/dashboard">
            <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <LogOut className="h-4 w-4 shrink-0" />
              Wróć do aplikacji
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            Wyloguj się
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex h-14 items-center gap-3 border-b border-border px-4 bg-card shrink-0">
          <button
            className="text-muted-foreground"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Shield className="h-5 w-5 text-red-500" />
          </button>
          <span className="text-sm font-bold uppercase tracking-wide">Admin Panel</span>
        </header>

        {/* Mobile nav drawer */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="w-64 h-full bg-card border-r border-border p-4 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <span
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto @container">
          {children}
        </main>
      </div>
    </div>
  )
}
