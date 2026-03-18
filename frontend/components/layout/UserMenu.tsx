'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings, User, Users, CreditCard, Calendar, Stamp, Palette, Bell, Sparkles, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import { useAdmin } from '@/lib/useAdmin'
import { cn } from '@/lib/utils'

interface UserProfile {
  email: string | null
  fullName: string | null
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean)
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U'
  }
  if (email) return email[0]?.toUpperCase() ?? 'U'
  return 'U'
}

export function UserMenu({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isSuperAdmin } = useAdmin()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({ email: null, fullName: null })

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      setProfile({
        email: user?.email ?? null,
        fullName: (user?.user_metadata?.full_name as string | undefined) ?? null,
      })
    }

    loadUser()
    return () => {
      cancelled = true
    }
  }, [])

  const initials = useMemo(() => getInitials(profile.fullName, profile.email), [profile.fullName, profile.email])
  const displayName = useMemo(() => {
    if (profile.fullName?.trim()) return profile.fullName
    if (profile.email) return profile.email
    return 'Uzytkownik'
  }, [profile.fullName, profile.email])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
  }

  const links = [
    { href: '/settings/profile', label: 'Profil', icon: User },
    { href: '/settings/team', label: 'Zespol', icon: Users },
    { href: '/settings/billing', label: 'Platnosci', icon: CreditCard },
    { href: '/settings/schedules', label: 'Automatyzacja', icon: Calendar },
    { href: '/settings/branding', label: 'Branding', icon: Stamp },
    { href: '/settings/appearance', label: 'Wyglad', icon: Palette },
    { href: '/settings/notifications', label: 'Powiadomienia', icon: Bell },
    { href: '/settings/agents', label: 'Agenci czatu', icon: Sparkles },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-9 gap-1.5 rounded-md px-1.5 transition-all duration-200 hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/35',
            className
          )}
          aria-label="Menu uzytkownika"
        >
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent shadow-sm ring-1 ring-accent/20 transition-transform duration-200',
              open && 'scale-[1.03]'
            )}
          >
            {initials}
          </span>
          <span className="hidden max-w-[180px] truncate text-sm font-medium text-foreground lg:block">
            {displayName}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-1.5 shadow-lg">
        <div className="px-2 py-2.5 border-b border-border">
          <p className="text-sm font-medium truncate">{profile.fullName ?? 'Uzytkownik'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email ?? 'Brak adresu email'}</p>
        </div>

        <div className="py-1">
          <Link
            href="/settings/profile"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150',
              pathname === '/settings/profile'
                ? 'bg-accent/12 text-accent'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4" />
            Ustawienia
          </Link>

          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150',
                pathname === item.href
                  ? 'bg-accent/12 text-accent'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-accent/12 text-accent'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Shield className="h-4 w-4" />
              Panel Admina
            </Link>
          )}
        </div>

        <div className="border-t border-border pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj sie
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
