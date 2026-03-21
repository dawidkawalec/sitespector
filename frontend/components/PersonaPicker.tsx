'use client'

/**
 * PersonaPicker — Card grid for selecting audit persona.
 * Used in NewAuditDialog step 1.
 */

import { useQuery } from '@tanstack/react-query'
import { personasAPI, type PersonaConfig } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface PersonaPickerProps {
  selected: string | null  // slug or null for full audit
  onSelect: (slug: string | null) => void
  workspaceId?: string
}

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return FileSearch
  const Icon = (LucideIcons as any)[iconName]
  return Icon || FileSearch
}

export function PersonaPicker({ selected, onSelect, workspaceId }: PersonaPickerProps) {
  const { data: personas, isLoading } = useQuery<PersonaConfig[]>({
    queryKey: ['personas', workspaceId],
    queryFn: () => personasAPI.list(workspaceId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
          Pod jakim katem sprawdzic strone?
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Wybierz perspektywe — dostaniesz dopasowany dashboard i rekomendacje. Pelny audyt jest zawsze dostepny.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Full audit option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
            selected === null
              ? 'border-teal-400 bg-teal-50/50 ring-1 ring-teal-400 dark:border-teal-600 dark:bg-teal-950/20'
              : 'border-stone-200 hover:border-stone-300 dark:border-white/10 dark:hover:border-white/20'
          )}
        >
          <div className="rounded-md bg-stone-100 p-1.5 dark:bg-stone-800">
            <FileSearch className="h-4 w-4 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Pelny audyt</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              Kompletny techniczny audyt SEO bez persony
            </p>
          </div>
          {selected === null && <CheckCircle className="h-4 w-4 text-teal-600 shrink-0 ml-auto" />}
        </button>

        {/* Persona options */}
        {(personas || []).map((p) => {
          const Icon = getIcon(p.icon)
          const isSelected = selected === p.slug
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onSelect(p.slug)}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                isSelected
                  ? 'border-teal-400 bg-teal-50/50 ring-1 ring-teal-400 dark:border-teal-600 dark:bg-teal-950/20'
                  : 'border-stone-200 hover:border-stone-300 dark:border-white/10 dark:hover:border-white/20'
              )}
            >
              <div className="rounded-md bg-stone-100 p-1.5 dark:bg-stone-800">
                <Icon className="h-4 w-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-white">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {p.description}
                </p>
              </div>
              {isSelected && <CheckCircle className="h-4 w-4 text-teal-600 shrink-0 ml-auto" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
