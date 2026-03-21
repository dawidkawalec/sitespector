'use client'

/**
 * PageTypeFilter - Pills filter for page types detected by page classifier.
 * Shows page type distribution and allows filtering audit data by type.
 */

import { useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingBag,
  FolderOpen,
  FileText,
  Briefcase,
  Phone,
  Info,
  MoreHorizontal,
  LayoutGrid,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type PageType = 'homepage' | 'product' | 'category' | 'blog' | 'service' | 'contact' | 'about' | 'other'

interface PageTypeConfig {
  label: string
  icon: LucideIcon
  color: string
}

const PAGE_TYPE_CONFIG: Record<PageType, PageTypeConfig> = {
  homepage: { label: 'Strona glowna', icon: Home, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  product: { label: 'Produkty', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  category: { label: 'Kategorie', icon: FolderOpen, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  blog: { label: 'Blog', icon: FileText, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  service: { label: 'Uslugi', icon: Briefcase, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  contact: { label: 'Kontakt', icon: Phone, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  about: { label: 'O nas', icon: Info, color: 'bg-stone-100 text-stone-700 dark:bg-stone-800/40 dark:text-stone-300' },
  other: { label: 'Inne', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300' },
}

interface PageTypeFilterProps {
  pageTypeStats: Record<string, number> | undefined | null
  className?: string
}

export function PageTypeFilter({ pageTypeStats, className }: PageTypeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeType = searchParams.get('pageType') as PageType | null

  const availableTypes = useMemo(() => {
    if (!pageTypeStats) return []
    return Object.entries(pageTypeStats)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type: type as PageType, count }))
  }, [pageTypeStats])

  const totalPages = useMemo(
    () => availableTypes.reduce((sum, { count }) => sum + count, 0),
    [availableTypes]
  )

  if (!pageTypeStats || availableTypes.length <= 1) return null

  const handleSelect = (type: PageType | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === null || type === activeType) {
      params.delete('pageType')
    } else {
      params.set('pageType', type)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {/* All pages pill */}
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
          !activeType
            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
        )}
      >
        <LayoutGrid className="h-3 w-3" />
        Wszystkie
        <span className="text-[10px] opacity-70">{totalPages}</span>
      </button>

      {availableTypes.map(({ type, count }) => {
        const config = PAGE_TYPE_CONFIG[type]
        if (!config) return null
        const Icon = config.icon
        const isActive = activeType === type
        return (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
              isActive
                ? 'ring-2 ring-offset-1 ring-stone-400 dark:ring-white/40 ' + config.color
                : config.color + ' opacity-75 hover:opacity-100'
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
            <span className="text-[10px] opacity-70">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Hook to filter pages by the active page type from URL search params.
 */
export function usePageTypeFilter(
  allPages: any[] | undefined,
  classifications: Record<string, string> | undefined | null
) {
  const searchParams = useSearchParams()
  const activeType = searchParams.get('pageType') as PageType | null

  return useMemo(() => {
    if (!allPages) return { filteredPages: [], activeType }
    if (!activeType || !classifications) return { filteredPages: allPages, activeType }

    const filtered = allPages.filter((page) => {
      const url = page.url || page.Address || ''
      return classifications[url] === activeType
    })

    return { filteredPages: filtered, activeType }
  }, [allPages, classifications, activeType])
}

/**
 * Get page type label and icon for a single URL.
 */
export function getPageTypeInfo(type: string | undefined): { label: string; icon: LucideIcon; color: string } {
  return PAGE_TYPE_CONFIG[(type as PageType)] ?? PAGE_TYPE_CONFIG.other
}
