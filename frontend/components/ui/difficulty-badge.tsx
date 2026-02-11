'use client'

import { Badge } from '@/components/ui/badge'

function getDifficultyClass(value: number) {
  if (value <= 20) return 'text-green-700 border-green-200 bg-green-50'
  if (value <= 40) return 'text-yellow-700 border-yellow-200 bg-yellow-50'
  if (value <= 60) return 'text-orange-700 border-orange-200 bg-orange-50'
  if (value <= 80) return 'text-red-700 border-red-200 bg-red-50'
  return 'text-rose-700 border-rose-200 bg-rose-50'
}

export function DifficultyBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  return (
    <Badge variant="outline" className={`normal-case tracking-normal text-[10px] h-5 ${getDifficultyClass(value)}`}>
      {value}
    </Badge>
  )
}

