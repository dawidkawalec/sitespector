'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Users, CreditCard, Calendar, Palette, Bell, Sparkles } from 'lucide-react'

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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 @container">
      <div className="grid gap-6 @lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border bg-card/90 p-2 shadow-sm">
          <p className="px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Ustawienia
          </p>
          <nav className="space-y-1.5">
            {settingsItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-[1px]'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 transition-transform duration-200', active && 'scale-[1.04]')} />
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  )
}
