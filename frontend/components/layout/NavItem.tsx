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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
  disabled?: boolean
  tooltip?: string
  activeClass?: string
  onClick?: () => void
  activeMatch?: 'exact' | 'prefix'
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  badge, 
  disabled,
  tooltip,
  activeClass = 'bg-accent/10 text-accent font-medium',
  onClick,
  activeMatch = 'exact',
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = activeMatch === 'prefix' ? pathname.startsWith(href) : pathname === href

  const content = (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ease-out',
        isActive
          ? activeClass
          : 'text-stone-600 hover:bg-muted/80 hover:text-stone-900 hover:translate-x-[1px] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white',
        disabled &&
          'cursor-not-allowed text-stone-300 hover:bg-transparent hover:text-stone-300 hover:translate-x-0 dark:text-white/30 dark:hover:text-white/30'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_0_1px_rgba(146,64,14,0.14)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
      )}
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-all duration-200',
          isActive
            ? 'scale-[1.03] text-accent'
            : 'text-stone-400 group-hover:scale-[1.03] group-hover:text-stone-700 dark:text-white/40 dark:group-hover:text-white',
          disabled && 'text-stone-300 group-hover:scale-100 group-hover:text-stone-300 dark:text-white/20 dark:group-hover:text-white/20'
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
    </div>
  )

  if (disabled && tooltip) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (disabled) {
    return content
  }

  return (
    <Link href={href} onClick={onClick} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md">
      {content}
    </Link>
  )
}
