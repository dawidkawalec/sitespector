'use client'

/**
 * Billing Settings Page
 * 
 * Displays:
 * - Current subscription plan and status
 * - Audit usage this month (progress bar)
 * - Upgrade/manage subscription buttons
 * - Invoice history
 */

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Subscription {
  plan: string
  status: string
  audit_limit: number
  audits_used_this_month: number
  current_period_end: string | null
  stripe_customer_id: string | null
}

interface Invoice {
  id: string
  stripe_invoice_id: string
  amount_paid: number
  currency: string
  status: string
  invoice_pdf: string | null
  created_at: string
}

export default function BillingPage() {
  // Next.js requires useSearchParams() to be wrapped in a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4" />}>
      <BillingPageInner />
    </Suspense>
  )
}

function BillingPageInner() {
  const { currentWorkspace } = useWorkspace()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isManaging, setIsManaging] = useState(false)
  const searchParams = useSearchParams()
  const showSuccess = searchParams?.get('success') === 'true'

  useEffect(() => {
    if (currentWorkspace) {
      fetchData()
    }
  }, [currentWorkspace])

  const fetchData = async () => {
    setIsLoading(true)
    await Promise.all([fetchSubscription(), fetchInvoices()])
    setIsLoading(false)
  }

  const fetchSubscription = async () => {
    if (!currentWorkspace) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (error) throw error
      setSubscription(data as Subscription)
    } catch (error: any) {
      console.error('Error fetching subscription:', error)
    }
  }

  const fetchInvoices = async () => {
    if (!currentWorkspace) return

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setInvoices((data as Invoice[]) || [])
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
    }
  }

  const handleManageSubscription = async () => {
    if (!currentWorkspace || !subscription?.stripe_customer_id) return

    setIsManaging(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-portal-session?workspace_id=${currentWorkspace.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to create portal session')

      const { portal_url } = await response.json()
      window.location.href = portal_url
    } catch (error: any) {
      alert(error.message || 'Failed to open billing portal')
    } finally {
      setIsManaging(false)
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

  if (!subscription) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Subscription not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const usagePercent = (subscription.audits_used_this_month / subscription.audit_limit) * 100
  const isNearLimit = usagePercent > 80

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription for {currentWorkspace.name}
        </p>
      </div>

      {showSuccess && (
        <Alert>
          <AlertDescription>
            Subscription upgraded successfully! Your new limits are now active.
          </AlertDescription>
        </Alert>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your active subscription and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold capitalize">{subscription.plan}</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.status === 'active' ? 'Active' : 'Canceled'} • 
                {subscription.current_period_end && (
                  <> Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
              {subscription.status}
            </Badge>
          </div>

          {/* Usage meter */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Audits this month</span>
              <span className={cn(
                "text-sm font-medium",
                isNearLimit && "text-orange-600"
              )}>
                {subscription.audits_used_this_month} / {subscription.audit_limit}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  isNearLimit ? "bg-orange-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            {isNearLimit && (
              <p className="text-sm text-orange-600 mt-2">
                You&apos;re approaching your audit limit. Consider upgrading.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            {subscription.plan === 'free' ? (
              <Link href="/pricing" className="flex-1">
                <Button className="w-full">
                  Upgrade to Pro
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isManaging}
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isManaging ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
            
            {subscription.plan !== 'free' && (
              <Link href="/pricing">
                <Button variant="outline">
                  Change Plan
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Download your past invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No invoices yet
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      ${(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()} • 
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
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ or Help */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">How do audit limits work?</h4>
            <p className="text-sm text-muted-foreground">
              Audit limits reset on the 1st of each month. Unused audits don&apos;t roll over.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You&apos;ll keep access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards via Stripe. Enterprise customers can request invoice billing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
