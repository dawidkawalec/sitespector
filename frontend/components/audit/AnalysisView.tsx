'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle, CheckCircle2, Lightbulb, Zap } from 'lucide-react'
import { QuickWinBadge } from './QuickWinBadge'

interface AnalysisViewProps {
  area: string
  aiContext?: {
    key_findings?: string[]
    recommendations?: string[]
    quick_wins?: Array<{
      title: string
      description: string
      impact: string
      effort: string
    }>
    priority_issues?: string[]
    [key: string]: any
  }
  isLoading?: boolean
}

export function AnalysisView({ area, aiContext, isLoading }: AnalysisViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Analizuję dane...</p>
        </div>
      </div>
    )
  }

  if (!aiContext || aiContext.ai_unavailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            Analiza niedostępna
          </CardTitle>
          <CardDescription>
            {aiContext?.message || 'Analiza AI nie została jeszcze uruchomiona dla tego modułu.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const {
    key_findings = [],
    recommendations = [],
    quick_wins = [],
    priority_issues = [],
    ...extraFields
  } = aiContext

  return (
    <div className="space-y-6">
      {/* Key Findings */}
      {key_findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              Kluczowe ustalenia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {key_findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Priority Issues */}
      {priority_issues.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Problemy priorytetowe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {priority_issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {quick_wins.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Quick Wins
            </CardTitle>
            <CardDescription>Szybkie wygrane - łatwe do wdrożenia, duży wpływ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quick_wins.map((win, i) => (
                <div key={i} className="p-3 rounded-lg bg-background border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">{win.title}</p>
                    <QuickWinBadge showLabel={false} />
                  </div>
                  <p className="text-sm text-muted-foreground">{win.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Impact: {win.impact}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Effort: {win.effort}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekomendacje</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Extra Fields (module-specific) */}
      {Object.keys(extraFields).length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="extra">
            <AccordionTrigger>Szczegóły dodatkowe</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {Object.entries(extraFields).map(([key, value]) => {
                  if (!value || typeof value !== 'object') return null
                  
                  return (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">
                          {key.replace(/_/g, ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Array.isArray(value) ? (
                          <ul className="space-y-2">
                            {value.map((item, i) => (
                              <li key={i} className="text-sm">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm">{String(value)}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
