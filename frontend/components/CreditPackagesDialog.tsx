'use client'

import { useState, useEffect } from 'react'
import { billingAPI, creditsAPI, type CreditPackage } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, Loader2, Zap } from 'lucide-react'

interface CreditPackagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditPackagesDialog({ open, onOpenChange }: CreditPackagesDialogProps) {
  const { currentWorkspace } = useWorkspace()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      creditsAPI.getPackages().then(setPackages).catch(console.error)
    }
  }, [open])

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!currentWorkspace?.id) return
    setLoading(pkg.id)
    try {
      const response = await billingAPI.purchaseCredits(currentWorkspace.id, pkg.id)
      if (response.checkout_url) {
        window.location.href = response.checkout_url
      }
    } catch (err: any) {
      alert(err.message || 'Błąd zakupu')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Kup pakiet kredytów
          </DialogTitle>
          <DialogDescription>
            Dokupione kredyty nie wygasają i przenoszą się między cyklami.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-2xl font-black">{pkg.credits}</span>
                  <span className="text-sm text-muted-foreground">kr</span>
                </div>
                <div className="text-lg font-bold">
                  ${(pkg.price_cents / 100).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${(pkg.price_cents / pkg.credits / 100).toFixed(3)}/kr
                </div>
                <Button
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading === pkg.id}
                >
                  {loading === pkg.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Kup
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
