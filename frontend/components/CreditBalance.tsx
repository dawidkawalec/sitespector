'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins } from 'lucide-react'
import { creditsAPI, CreditBalance as CreditBalanceType } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function CreditBalance() {
  const { workspace } = useWorkspace()
  const [balance, setBalance] = useState<CreditBalanceType | null>(null)

  useEffect(() => {
    if (!workspace?.id) return
    creditsAPI.getBalance(workspace.id).then(setBalance).catch(() => {})
  }, [workspace?.id])

  if (!balance) return null

  const pct = balance.credits_per_cycle > 0
    ? (balance.total / balance.credits_per_cycle) * 100
    : balance.total > 0 ? 100 : 0

  const color = pct > 50
    ? 'text-emerald-600 dark:text-emerald-400'
    : pct > 20
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/settings/billing"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted',
              color,
            )}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>{balance.total} kr</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Subskrypcja: {balance.subscription_credits} kr</p>
          <p>Dokupione: {balance.purchased_credits} kr</p>
          <p className="mt-1 text-muted-foreground">
            Plan: {balance.plan} ({balance.credits_per_cycle} kr/cykl)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
