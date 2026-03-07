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
    <div className={cn('mb-1', disabled && 'opacity-50')}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
          'text-stone-600 hover:bg-amber-100/45 hover:text-stone-900 hover:translate-x-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white',
          isOpen && !disabled && 'bg-amber-100/45 text-stone-900 shadow-sm dark:bg-white/10 dark:text-white',
          disabled &&
            'cursor-not-allowed text-stone-300 hover:bg-transparent hover:text-stone-300 dark:text-white/40 dark:hover:text-white/40'
        )}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200', isOpen && 'scale-[1.03]')} />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown 
          className={cn(
            'h-4 w-4 transition-transform duration-200 ease-out',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-stone-200 pl-2.5 animate-in slide-in-from-top-2 fade-in duration-200 dark:border-white/10">
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
                'bg-accent/12 text-accent font-semibold',
                variant === 'audit' && 'bg-accent/10'
              )}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
