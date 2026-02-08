'use client'

/**
 * NavItem Component
 * 
 * Single navigation item for sidebar.
 * Highlights active route and supports optional badges/disabled state.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
  disabled?: boolean
  activeClass?: string
  onClick?: () => void
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  badge, 
  disabled,
  activeClass = 'bg-primary/10 text-primary font-medium',
  onClick
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  if (disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          'text-muted-foreground/50 cursor-not-allowed'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
        isActive
          ? activeClass
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
    </Link>
  )
}
