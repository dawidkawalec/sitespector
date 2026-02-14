import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface QuickWinBadgeProps {
  className?: string
  showLabel?: boolean
}

export function QuickWinBadge({ className, showLabel = true }: QuickWinBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300 ${className}`}
          >
            <Flame className="w-3 h-3" />
            {showLabel && <span>Quick Win</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Wysoki wpływ, łatwa realizacja</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
