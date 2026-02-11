'use client'

/**
 * AiInsightsPanel - Reusable AI insights panel for the right column
 * 
 * Displays contextual AI recommendations, key findings, quick wins,
 * and priority issues for a specific audit area.
 */

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Lightbulb,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react'
import type { Audit } from '@/lib/api'

type AiArea = 'seo' | 'performance' | 'visibility' | 'ai_overviews' | 'backlinks' | 'links' | 'images' | 'crawl' | 'lighthouse'

interface AiInsightsPanelProps {
  area: AiArea
  audit: Audit
  onTriggerAi?: () => void
}

interface AiContextData {
  key_findings?: string[]
  recommendations?: string[]
  quick_wins?: Array<{ title: string; description: string; impact: string; effort: string }>
  priority_issues?: string[]
  desktop_vs_mobile_comparison?: string
  keyword_opportunities?: string[]
  competitor_gaps?: string[]
  seasonality_strategy?: string
  toxic_risk_assessment?: string
  anchor_diversity_score?: number
  link_building_suggestions?: string[]
  orphan_pages?: string[]
  link_juice_distribution?: string
  silo_suggestions?: string[]
  missing_alt_count?: number
  oversized_images?: string[]
  format_suggestions?: string[]
}

const AREA_LABELS: Record<AiArea, string> = {
  seo: 'SEO',
  performance: 'Wydajność',
  visibility: 'Widoczność',
  ai_overviews: 'AI Overviews',
  backlinks: 'Backlinki',
  links: 'Linki wewnętrzne',
  images: 'Obrazy',
  crawl: 'Dane techniczne',
  lighthouse: 'Lighthouse',
}

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="h-3 w-3 text-red-500" />,
  medium: <Info className="h-3 w-3 text-yellow-500" />,
  low: <CheckCircle2 className="h-3 w-3 text-green-500" />,
}

function getContextData(audit: Audit, area: AiArea): AiContextData | null {
  const contexts = audit.results?.ai_contexts
  if (!contexts) return null
  return contexts[area] || null
}

function getFallbackData(audit: Audit, area: AiArea): AiContextData | null {
  const results = audit.results
  if (!results) return null

  switch (area) {
    case 'seo': {
      const content = results.content_analysis
      const local = results.local_seo
      const contentDeep = results.content_deep
      if (!content && !local) return null
      return {
        key_findings: [
          content?.summary,
          content?.tone_voice ? `Ton komunikacji: ${content.tone_voice}` : null,
          local?.is_local_business ? 'Wykryto lokalny biznes' : null,
          contentDeep?.thin_content_count > 0 ? `${contentDeep.thin_content_count} stron z thin content` : null,
          contentDeep?.duplicate_content_count > 0 ? `${contentDeep.duplicate_content_count} duplikatów treści` : null,
        ].filter(Boolean) as string[],
        recommendations: [
          ...(content?.recommendations || []),
          ...(local?.recommendations || []),
        ],
        quick_wins: content?.roi_action_plan?.map((a: any) => ({
          title: a.action,
          description: '',
          impact: a.impact,
          effort: a.effort,
        })),
      }
    }
    case 'performance': {
      const perf = results.performance_analysis
      const ux = results.ux
      const benchmarks = results.benchmarks
      if (!perf && !ux) return null
      return {
        key_findings: [
          perf?.impact ? `Impact: ${perf.impact}` : null,
          ux?.mobile_friendly ? 'Strona przyjazna mobile' : ux?.mobile_friendly === false ? 'Strona NIE jest mobile-friendly' : null,
          ux?.accessibility_score ? `Accessibility: ${ux.accessibility_score}/100` : null,
        ].filter(Boolean) as string[],
        recommendations: [
          ...(perf?.recommendations || []),
          ...(ux?.recommendations || []),
        ],
        priority_issues: perf?.issues || [],
      }
    }
    case 'crawl': {
      const tech = results.tech_stack
      const security = results.security
      if (!tech && !security) return null
      return {
        key_findings: [
          tech?.server ? `Server: ${tech.server}` : null,
          security?.is_https ? 'HTTPS aktywne' : 'Brak HTTPS!',
          security?.mixed_content_count > 0 ? `${security.mixed_content_count} zasobów mixed content` : null,
          security?.security_score ? `Security score: ${security.security_score}/100` : null,
        ].filter(Boolean) as string[],
        recommendations: [
          ...(tech?.recommendations || []),
          ...(security?.recommendations || []),
        ],
      }
    }
    case 'lighthouse': {
      const perf = results.performance_analysis
      const ux = results.ux
      if (!perf && !ux) return null
      return {
        key_findings: perf?.issues || [],
        recommendations: [
          ...(perf?.recommendations || []),
          ...(ux?.recommendations || []),
        ],
      }
    }
    default:
      return null
  }
}

export function AiInsightsPanel({ area, audit, onTriggerAi }: AiInsightsPanelProps) {
  const params = useParams()
  const auditId = params?.id as string
  const isAiRunning = audit.ai_status === 'processing' || (audit.processing_step || '').startsWith('ai_')

  // Try ai_contexts first, then fallback to existing AI data
  const contextData = getContextData(audit, area) || getFallbackData(audit, area)

  if (!contextData) {
    if (isAiRunning) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Sparkles className="h-5 w-5 text-accent mb-2 animate-pulse" />
          <p className="text-xs font-medium text-accent">
            AI analizuje dane dla obszaru: {AREA_LABELS[area]}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Etap: {audit.processing_step || 'ai:processing'}
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Sparkles className="h-5 w-5 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">
          Brak wniosków AI dla obszaru: {AREA_LABELS[area]}
        </p>
        {onTriggerAi && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerAi}
            className="mt-3 gap-2 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            Wygeneruj
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[9px] gap-1 border-accent/30 text-accent">
          <Sparkles className="h-2.5 w-2.5" />
          AI-generated
        </Badge>
      </div>

      <Accordion type="multiple" defaultValue={['findings', 'recommendations', 'quickwins']} className="space-y-2">
        {/* Key Findings */}
        {contextData.key_findings && contextData.key_findings.length > 0 && (
          <AccordionItem value="findings" className="border rounded-lg px-3 border-accent/10">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Target className="h-3.5 w-3.5 text-accent" />
                Kluczowe wnioski
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5">
                {contextData.key_findings.map((finding, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Priority Issues */}
        {contextData.priority_issues && contextData.priority_issues.length > 0 && (
          <AccordionItem value="issues" className="border rounded-lg px-3 border-red-200 dark:border-red-900/30">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                Problemy priorytetowe
                <Badge variant="destructive" className="text-[9px] h-4 ml-1">
                  {contextData.priority_issues.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5">
                {contextData.priority_issues.map((issue, i) => (
                  <li key={i} className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Recommendations */}
        {contextData.recommendations && contextData.recommendations.length > 0 && (
          <AccordionItem value="recommendations" className="border rounded-lg px-3 border-accent/10">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                Rekomendacje
                <Badge variant="secondary" className="text-[9px] h-4 ml-1">
                  {contextData.recommendations.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5">
                {contextData.recommendations.slice(0, 10).map((rec, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
                {contextData.recommendations.length > 10 && (
                  <li className="text-[10px] text-muted-foreground italic">
                    ...i {contextData.recommendations.length - 10} więcej
                  </li>
                )}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Quick Wins */}
        {contextData.quick_wins && contextData.quick_wins.length > 0 && (
          <AccordionItem value="quickwins" className="border rounded-lg px-3 border-green-200 dark:border-green-900/30">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Zap className="h-3.5 w-3.5 text-green-500" />
                Quick Wins
                <Badge className="text-[9px] h-4 ml-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {contextData.quick_wins.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {contextData.quick_wins.map((win, i) => (
                  <li key={i} className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <p className="text-[11px] font-semibold text-green-700 dark:text-green-400">{win.title}</p>
                    {win.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{win.description}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {win.impact && (
                        <Badge variant="outline" className="text-[8px] h-3.5 gap-0.5">
                          {PRIORITY_ICONS[win.impact] || PRIORITY_ICONS.medium}
                          {win.impact}
                        </Badge>
                      )}
                      {win.effort && (
                        <Badge variant="outline" className="text-[8px] h-3.5">
                          {win.effort}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Area-specific extras */}
        {area === 'visibility' && contextData.keyword_opportunities && contextData.keyword_opportunities.length > 0 && (
          <AccordionItem value="keywords" className="border rounded-lg px-3 border-accent/10">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                Szanse na frazy kluczowe
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {contextData.keyword_opportunities.map((kw, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">{kw}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {area === 'backlinks' && contextData.link_building_suggestions && contextData.link_building_suggestions.length > 0 && (
          <AccordionItem value="linkbuilding" className="border rounded-lg px-3 border-accent/10">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                Sugestie link building
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {contextData.link_building_suggestions.map((s, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">{s}</li>
                ))}
              </ul>
              {contextData.toxic_risk_assessment && (
                <p className="text-[10px] mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-100 dark:border-yellow-900/30">
                  <strong>Ryzyko toksycznych linków:</strong> {contextData.toxic_risk_assessment}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Link to full strategy */}
      {auditId && (
        <div className="pt-2 border-t border-accent/10">
          <Link href={`/audits/${auditId}/ai-strategy`}>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-accent hover:text-accent hover:bg-accent/10">
              Zobacz pełną strategię AI
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
