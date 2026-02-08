'use client'

/**
 * NavSection Component
 * 
 * Collapsible section for sidebar navigation.
 * Uses Radix UI Accordion for accessibility and smooth animations.
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
}

export function NavSection({
  title,
  icon: Icon,
  items,
  defaultOpen = false,
  value,
  onOpenChange,
  variant = 'default',
  onItemClick
}: NavSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  return (
    <div className="mb-1">
      {/* Section Header - Clickable to toggle */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'text-muted-foreground hover:bg-accent hover:text-foreground',
          isOpen && 'bg-accent text-foreground'
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

      {/* Collapsible Items */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-4 border-l-2 border-border/40 pl-2 space-y-0.5">
            {items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                disabled={item.disabled}
                activeClass={cn(
                  'bg-primary/10 text-primary font-medium',
                  variant === 'audit' && 'bg-primary/5'
                )}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
