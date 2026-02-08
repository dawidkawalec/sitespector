'use client'

/**
 * NavSection Component
 * 
 * Collapsible section for sidebar navigation.
 * Uses conditional rendering (no CSS grid tricks) to avoid ghost elements.
 */

import * as React from 'react'
import { ChevronDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavItem } from './NavItem'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavSectionItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
  disabled?: boolean
  tooltip?: string
  id?: string
}

interface NavSectionProps {
  title: string
  icon: LucideIcon
  items: NavSectionItem[]
  defaultOpen?: boolean
  value: string
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'audit'
  onItemClick?: () => void
  disabled?: boolean
}

export function NavSection({
  title,
  icon: Icon,
  items,
  defaultOpen = false,
  value,
  onOpenChange,
  variant = 'default',
  onItemClick,
  disabled = false
}: NavSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])

  const handleToggle = () => {
    if (disabled) return
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  return (
    <div className={cn("mb-1", disabled && "opacity-50")}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'text-white/70 hover:bg-white/10 hover:text-white',
          isOpen && !disabled && 'bg-white/10 text-white',
          disabled && 'cursor-not-allowed hover:bg-transparent hover:text-white/40'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown 
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 border-l-2 border-white/10 pl-2 space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
          {items.map((item, index) => (
            <NavItem
              key={item.id || `${value}-${index}`}
              href={item.href}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              disabled={item.disabled}
              tooltip={item.tooltip}
              activeClass={cn(
                'bg-accent/10 text-accent font-medium',
                variant === 'audit' && 'bg-accent/5'
              )}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
