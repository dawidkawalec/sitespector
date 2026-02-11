'use client'

import { Badge } from '@/components/ui/badge'

function toReadableLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export function SerpTags({ snippets }: { snippets?: string[] }) {
  if (!snippets || snippets.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {snippets.slice(0, 4).map((snippet) => (
        <Badge key={snippet} variant="outline" className="text-[9px] h-5 normal-case tracking-normal">
          {toReadableLabel(snippet)}
        </Badge>
      ))}
      {snippets.length > 4 && (
        <Badge variant="secondary" className="text-[9px] h-5 normal-case tracking-normal">
          +{snippets.length - 4}
        </Badge>
      )}
    </div>
  )
}

