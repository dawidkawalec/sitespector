'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Users, CreditCard, Calendar, Palette, Bell, Sparkles } from 'lucide-react'
import { NavItem } from '@/components/layout/NavItem'

const settingsItems = [
  { href: '/settings/profile', label: 'Profil', icon: User },
  { href: '/settings/team', label: 'Zespol', icon: Users },
  { href: '/settings/billing', label: 'Platnosci', icon: CreditCard },
  { href: '/settings/schedules', label: 'Automatyzacja', icon: Calendar },
  { href: '/settings/appearance', label: 'Wyglad', icon: Palette },
  { href: '/settings/notifications', label: 'Powiadomienia', icon: Bell },
  { href: '/settings/agents', label: 'Agenci czatu', icon: Sparkles },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-[292px] shrink-0 flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 md:flex dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-black dark:text-white">
        <div className="border-b border-slate-200/80 px-3 py-3.5 dark:border-white/10">
          <p className="px-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
            Ustawienia
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3.5">
          {settingsItems.map((item) => {
            const active = pathname === item.href
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                activeClass={cn('bg-accent/12 text-accent font-medium', active && 'shadow-sm')}
              />
            )
          })}
        </nav>
      </aside>

      <div className="w-full px-4 py-4 md:hidden">
        <div className="mb-4 flex flex-wrap gap-2">
          {settingsItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-background text-foreground/80 hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <section className="min-w-0 flex-1 px-4 py-6 @container md:px-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </section>
    </div>
  )
}
