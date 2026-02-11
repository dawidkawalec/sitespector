'use client'

import { Badge } from '@/components/ui/badge'
import { Compass, Info, ShoppingCart, Tag } from 'lucide-react'

type IntentName = 'informational' | 'transactional' | 'navigational' | 'commercial' | string

function getIntentMeta(intent: IntentName) {
  switch (intent) {
    case 'informational':
      return { icon: Info, className: 'text-blue-700 border-blue-200 bg-blue-50', label: 'Info' }
    case 'transactional':
      return { icon: ShoppingCart, className: 'text-green-700 border-green-200 bg-green-50', label: 'Transakc.' }
    case 'navigational':
      return { icon: Compass, className: 'text-purple-700 border-purple-200 bg-purple-50', label: 'Nawig.' }
    case 'commercial':
      return { icon: Tag, className: 'text-orange-700 border-orange-200 bg-orange-50', label: 'Commercial' }
    default:
      return { icon: Info, className: 'text-slate-700 border-slate-200 bg-slate-50', label: intent || 'Unknown' }
  }
}

export function IntentBadge({
  intent,
  stage,
}: {
  intent?: IntentName
  stage?: 'tofu' | 'mofu' | 'bofu' | string
}) {
  if (!intent) return <span className="text-muted-foreground text-xs">—</span>
  const meta = getIntentMeta(intent)
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={`normal-case tracking-normal text-[10px] h-5 ${meta.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {meta.label}
      </Badge>
      {stage && (
        <Badge variant="secondary" className="normal-case tracking-normal text-[9px] h-5">
          {stage.toUpperCase()}
        </Badge>
      )}
    </div>
  )
}

