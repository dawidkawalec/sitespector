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
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  badge, 
  disabled,
  tooltip,
  activeClass = 'bg-accent/10 text-accent font-medium',
  onClick
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  const content = (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
        isActive
          ? activeClass
          : 'text-white/70 hover:bg-white/10 hover:text-white',
        disabled && 'text-white/30 cursor-not-allowed hover:bg-transparent hover:text-white/30'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
      )}
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0 transition-colors",
        isActive ? "text-accent" : "text-white/40 group-hover:text-white",
        disabled && "text-white/20 group-hover:text-white/20"
      )} />
      <span className="flex-1">{label}</span>
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
    <Link href={href} onClick={onClick}>
      {content}
    </Link>
  )
}
