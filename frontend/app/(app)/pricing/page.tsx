'use client'

/**
 * Pricing Page
 * 
 * Displays subscription tiers with features and pricing.
 * Handles Stripe checkout redirect.
 */

export const dynamic = 'force-dynamic'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceId: null,
    description: 'For trying out SiteSpector',
    features: [
      '5 audits per month',
      'Basic SEO analysis',
      'Performance metrics (Lighthouse)',
      'PDF reports',
      'Email support',
      '1 personal workspace'
    ],
    limitations: [
      'No team workspaces',
      'No competitor analysis',
      'No API access'
    ]
  },
  {
    name: 'Pro',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
    description: 'For professionals and small teams',
    popular: true,
    features: [
      '50 audits per month',
      'All Free features',
      'Competitor analysis (up to 3)',
      'Team workspaces',
      'Priority email support',
      'White-label PDF reports',
      'API access',
      'Advanced metrics'
    ]
  },
  {
    name: 'Enterprise',
    price: '$99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise_monthly',
    description: 'For agencies and large teams',
    features: [
      'Unlimited audits',
      'All Pro features',
      'Unlimited team members',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom audit templates',
      'Priority processing'
    ]
  }
]

export default function PricingPage() {
  const { currentWorkspace } = useWorkspace()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!priceId) return // Free plan

    if (!currentWorkspace) {
      alert('Please select a workspace first')
      return
    }

    setLoading(planName)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please sign in first')
        return
      }

      // Call backend to create checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          price_id: priceId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create checkout session')
      }

      const { checkout_url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url
    } catch (error: any) {
      alert(error.message || 'Failed to start checkout')
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-16 px-4 bg-[#fff9f5]/30 dark:bg-transparent min-h-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4 text-primary tracking-tight">
          Prosty i przejrzysty <span className="text-line">cennik</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Wybierz plan dopasowany do Twoich potrzeb. Możesz zrezygnować w dowolnym momencie.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={cn(
              'relative border-none shadow-xl transition-all duration-300 hover:-translate-y-2',
              plan.popular && 'ring-2 ring-accent shadow-accent/10'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge variant="accent" className="px-4 py-1 shadow-lg">Najpopularniejszy</Badge>
              </div>
            )}
            
            <CardHeader className={cn(
              "text-center pb-8 rounded-t-xl",
              plan.popular ? "bg-primary text-white" : "bg-primary/5"
            )}>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className={cn(
                "text-base mt-2",
                plan.popular ? "text-white/80" : "text-muted-foreground"
              )}>
                {plan.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={plan.popular ? "text-white/60" : "text-muted-foreground"}>/miesiąc</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-8">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.limitations && (
                <div className="pt-4 border-t border-dashed">
                  <p className="text-xs text-muted-foreground mb-2">Ograniczenia:</p>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-muted-foreground/40">•</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pb-8">
              <Button
                className="w-full rounded-xl"
                variant={plan.popular ? 'accent' : 'outline'}
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading !== null}
              >
                {loading === plan.name ? 'Ładowanie...' : (
                  plan.name === 'Free' ? 'Twój obecny plan' : `Wybierz ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>Wszystkie plany zawierają 7-dniową gwarancję zwrotu pieniędzy.</p>
        <p className="mt-2">Potrzebujesz planu niestandardowego? <a href="mailto:support@sitespector.app" className="text-accent hover:underline font-bold">Skontaktuj się z nami</a></p>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
