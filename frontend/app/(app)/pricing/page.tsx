'use client'

/**
 * Pricing Page — 4 plans with monthly/annual toggle + Stripe checkout
 */

import { useState, useEffect } from 'react'
import { billingAPI, creditsAPI, type PlanInfo, type CreditBalance } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Coins, Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PricingPage() {
  const { currentWorkspace } = useWorkspace()
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    billingAPI.getPlans().then(setPlans).catch(console.error).finally(() => setLoading(false))
    if (currentWorkspace?.id) {
      creditsAPI.getBalance(currentWorkspace.id).then(setBalance).catch(() => {})
    }
  }, [currentWorkspace?.id])

  const handleCheckout = async (plan: PlanInfo) => {
    if (!currentWorkspace?.id) return
    if (plan.id === 'free') return

    // Find the right Stripe price ID from the plan list endpoint
    // We pass the price_id directly — backend resolves plan from it
    const priceField = isAnnual ? 'stripe_price_annual' : 'stripe_price_monthly'
    // Plans endpoint doesn't expose stripe IDs, so we pass plan.id and let backend figure out
    // Actually we need to call create-checkout with actual Stripe price ID
    // The /plans endpoint strips stripe_ fields. We need to get price IDs another way.
    // Solution: pass plan ID + billing period, backend resolves price ID from config
    setCheckoutLoading(plan.id)
    try {
      const response = await billingAPI.createCheckoutSession(
        currentWorkspace.id,
        plan.id,
        isAnnual ? 'annual' : 'monthly',
      )
      if (response.checkout_url) {
        window.location.href = response.checkout_url
      }
    } catch (err: any) {
      alert(err.message || 'Błąd tworzenia sesji checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const currentPlan = balance?.plan || 'free'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 min-h-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-4 text-primary tracking-tight">
          Wybierz plan dla siebie
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Wszystkie plany zawierają Screaming Frog + Lighthouse + Senuto + AI Gemini w jednym.
          Bez opłat per-seat.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={cn('text-sm font-medium', !isAnnual && 'text-primary')}>Miesięcznie</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isAnnual ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isAnnual ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span className={cn('text-sm font-medium', isAnnual && 'text-primary')}>
            Rocznie <Badge variant="secondary" className="ml-1 text-xs">-20%</Badge>
          </span>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const price = isAnnual ? plan.price_annual : plan.price_monthly
          const isCurrent = currentPlan === plan.id || (currentPlan === 'pro' && plan.id === 'solo')
          const isHighlighted = plan.highlighted

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                isHighlighted && 'border-primary shadow-lg ring-2 ring-primary/20',
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" /> Najlepsza wartość
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  {price === 0 ? (
                    <div>
                      <span className="text-3xl font-black">$0</span>
                      <span className="text-muted-foreground text-sm ml-1">na zawsze</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-black">${(price / 100).toFixed(2)}</span>
                      <span className="text-muted-foreground text-sm ml-1">/msc</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Coins className="h-3.5 w-3.5" />
                  <span>{plan.credits_per_cycle} kr {plan.credits_note}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Twój plan
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Darmowy
                  </Button>
                ) : (
                  <Button
                    className={cn('w-full', isHighlighted && 'bg-primary hover:bg-primary/90')}
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutLoading === plan.id}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Wybierz plan
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Bottom info */}
      <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
        <p>Wszystkie ceny w USD. Płatność kartą przez Stripe. Możesz anulować w dowolnym momencie.</p>
        <p>1 audyt = 30 kredytów (20 tech + 10 AI). 1 wiadomość chat = 1 kredyt. 1 audyt konkurenta = 3 kredyty.</p>
        <p>
          Potrzebujesz API lub integracji?{' '}
          <a href="mailto:support@sitespector.app" className="text-accent hover:underline font-bold">
            Kontakt — plan Custom
          </a>
        </p>
      </div>
    </div>
  )
}
