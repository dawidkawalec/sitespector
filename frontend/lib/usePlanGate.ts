'use client'

import { useEffect, useState } from 'react'
import { creditsAPI, type CreditBalance } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface PlanGate {
  plan: string
  isFree: boolean
  isLoading: boolean
  balance: CreditBalance | null
}

/**
 * Hook to check if current workspace is on Free plan.
 * Caches balance per workspace, refetches on workspace change.
 */
export function usePlanGate(): PlanGate {
  const { currentWorkspace } = useWorkspace()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentWorkspace?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    creditsAPI
      .getBalance(currentWorkspace.id)
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setIsLoading(false))
  }, [currentWorkspace?.id])

  const plan = balance?.plan || 'free'
  const isFree = plan === 'free'

  return { plan, isFree, isLoading, balance }
}
