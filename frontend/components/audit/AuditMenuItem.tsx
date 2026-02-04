'use client'

/**
 * Audit Menu Item Component
 * 
 * Single menu item for audit navigation.
 * Highlights active route and supports optional badges.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditMenuItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
  disabled?: boolean
}

export function AuditMenuItem({ href, icon: Icon, label, badge, disabled }: AuditMenuItemProps) {
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
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </Link>
  )
}
