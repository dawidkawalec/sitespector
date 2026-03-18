'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaywallOverlayProps {
  /** 'full' blurs everything, 'partial' shows titles but blurs details */
  variant?: 'full' | 'partial'
  /** Feature name shown in CTA, e.g. "Analiza AI" */
  feature?: string
  className?: string
}

/**
 * Paywall overlay for Free tier users.
 * Place inside a `relative` parent. Renders an absolute overlay with blur + upgrade CTA.
 */
export function PaywallOverlay({
  variant = 'full',
  feature = 'tę funkcję',
  className,
}: PaywallOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center',
        variant === 'full'
          ? 'backdrop-blur-md bg-background/60'
          : 'backdrop-blur-sm bg-background/40',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-background/90 border border-border/50 p-8 shadow-xl max-w-md text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">
            Odblokuj {feature}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ulepsz plan, aby zobaczyć pełną analizę AI, plan zadań z kodem i raporty PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/pricing">
              <Sparkles className="h-4 w-4 mr-1" />
              Zobacz plany
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Od $9.99/msc — bez opłat per-seat
        </p>
      </div>
    </div>
  )
}
