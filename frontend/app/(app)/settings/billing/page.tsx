'use client'

/**
 * Billing Settings Page — Credit-based billing
 *
 * Displays:
 * - Credit balance (subscription + purchased)
 * - Credit transaction history
 * - Plan info and upgrade path
 * - Invoice history
 */

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { creditsAPI, type CreditBalance, type CreditTransaction } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Coins, Download, Loader2, Plus, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
import { CreditPackagesDialog } from '@/components/CreditPackagesDialog'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  stripe_invoice_id: string
  amount_paid: number
  currency: string
  status: string
  invoice_pdf: string | null
  created_at: string
}

const TX_TYPE_LABELS: Record<string, string> = {
  grant_subscription: 'Kredyty subskrypcji',
  grant_purchase: 'Zakup pakietu',
  grant_free: 'Kredyty startowe',
  deduct_audit: 'Audyt SEO',
  deduct_chat: 'Wiadomość chat',
  deduct_competitor: 'Audyt konkurenta',
  refund: 'Zwrot',
  admin_adjustment: 'Korekta admina',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  solo: 'Solo',
  pro: 'Solo',
  agency: 'Agency',
  enterprise: 'Enterprise',
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4" />}>
      <BillingPageInner />
    </Suspense>
  )
}

function BillingPageInner() {
  const { currentWorkspace } = useWorkspace()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPackages, setShowPackages] = useState(false)
  const searchParams = useSearchParams()
  const showSuccess = searchParams?.get('success') === 'true'

  useEffect(() => {
    if (currentWorkspace) {
      fetchData()
    }
  }, [currentWorkspace])

  const fetchData = async () => {
    if (!currentWorkspace) return
    setIsLoading(true)
    try {
      const [bal, txs, inv] = await Promise.all([
        creditsAPI.getBalance(currentWorkspace.id),
        creditsAPI.getTransactions(currentWorkspace.id, 20, 0),
        supabase
          .from('invoices')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(r => (r.data as Invoice[]) || []),
      ])
      setBalance(bal)
      setTransactions(txs)
      setInvoices(inv)
    } catch (err) {
      console.error('Error fetching billing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentWorkspace) {
    return <div className="p-8">No workspace selected</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!balance) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Nie udało się pobrać danych o kredytach</AlertDescription>
        </Alert>
      </div>
    )
  }

  const pct = balance.credits_per_cycle > 0
    ? (balance.total / balance.credits_per_cycle) * 100
    : balance.total > 0 ? 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Płatności i kredyty</h1>
        <p className="text-muted-foreground mt-1">
          Workspace: {currentWorkspace.name}
        </p>
      </div>

      {showSuccess && (
        <Alert>
          <AlertDescription>
            Dziękujemy za zakup! Kredyty zostały dodane do salda.
          </AlertDescription>
        </Alert>
      )}

      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Saldo kredytów
          </CardTitle>
          <CardDescription>
            Plan: {PLAN_LABELS[balance.plan] || balance.plan} ({balance.credits_per_cycle} kr/cykl)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{balance.total}</span>
            <span className="text-lg text-muted-foreground mb-1">kr</span>
          </div>

          {/* Balance bar */}
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span>Subskrypcja: {balance.subscription_credits} kr</span>
              <span>Dokupione: {balance.purchased_credits} kr</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 flex overflow-hidden">
              {balance.credits_per_cycle > 0 && (
                <>
                  <div
                    className="h-2.5 bg-primary transition-all"
                    style={{ width: `${Math.min((balance.subscription_credits / balance.credits_per_cycle) * 100, 100)}%` }}
                  />
                  <div
                    className="h-2.5 bg-accent transition-all"
                    style={{ width: `${Math.min((balance.purchased_credits / balance.credits_per_cycle) * 100, 50)}%` }}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full" variant="outline">
                Zmień plan <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            {balance.plan !== 'free' && (
              <Button variant="default" onClick={() => setShowPackages(true)}>
                <Plus className="h-4 w-4 mr-1" /> Kup kredyty
              </Button>
            )}
          </div>

          <CreditPackagesDialog open={showPackages} onOpenChange={setShowPackages} />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Historia transakcji</CardTitle>
          <CardDescription>Ostatnie operacje na kredytach</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Brak transakcji</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{TX_TYPE_LABELS[tx.type] || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', tx.amount > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} kr
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo: {tx.balance_after} kr</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Faktury</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Brak faktur</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString('pl-PL')} •
                      <span className="capitalize"> {invoice.status}</span>
                    </p>
                  </div>
                  {invoice.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
