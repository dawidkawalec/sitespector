'use client'

/**
 * BusinessContextForm — Renders AI-generated smart form questions
 * and collects business context from the user.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, SkipForward, ArrowRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmartFormQuestion, BusinessContext } from '@/lib/api'

interface BusinessContextFormProps {
  questions: SmartFormQuestion[]
  workspaceId: string
  projectId?: string | null
  isSubmitting: boolean
  onSubmit: (context: Partial<BusinessContext>) => void
  onSkip: () => void
}

// Map question IDs to BusinessContext fields
function mapAnswersToContext(
  answers: Record<string, string | string[]>,
  questions: SmartFormQuestion[],
  workspaceId: string,
  projectId?: string | null,
): Partial<BusinessContext> {
  const ctx: Partial<BusinessContext> = {
    workspace_id: workspaceId,
    project_id: projectId,
    source: 'smart_form',
    smart_form_questions: questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] || '',
    })),
  }

  // Try to extract structured fields from answers
  for (const q of questions) {
    const answer = answers[q.id]
    if (!answer) continue
    const qLower = q.question.toLowerCase()
    const ansStr = typeof answer === 'string' ? answer : (answer as string[]).join(', ')

    if (qLower.includes('typ biznesu') || qLower.includes('type of business')) {
      ctx.business_type = ansStr
    } else if (qLower.includes('bran') || qLower.includes('industry')) {
      ctx.industry = ansStr
    } else if (qLower.includes('cel') || qLower.includes('goal')) {
      ctx.business_goals = typeof answer === 'string' ? [answer] : answer as string[]
    } else if (qLower.includes('grup') || qLower.includes('audience') || qLower.includes('docelow')) {
      ctx.target_audience = ansStr
    } else if (qLower.includes('zespo') || qLower.includes('wdro') || qLower.includes('team') || qLower.includes('capabilities')) {
      const teamMap: Record<string, string> = {
        'brak dewelopera': 'no_dev',
        'podstawowy': 'basic_dev',
        'pelny': 'full_team',
      }
      const matchedKey = Object.keys(teamMap).find((k) => ansStr.toLowerCase().includes(k))
      ctx.team_capabilities = matchedKey ? teamMap[matchedKey] : ansStr
    } else if (qLower.includes('produkt') || qLower.includes('uslug') || qLower.includes('kategori')) {
      ctx.key_products_services = typeof answer === 'string' ? [answer] : answer as string[]
    } else if (qLower.includes('wyzwan') || qLower.includes('problem') || qLower.includes('challenge')) {
      ctx.current_challenges = ansStr
    } else if (qLower.includes('priorytet') || qLower.includes('priority')) {
      ctx.priorities = typeof answer === 'string' ? [answer] : answer as string[]
    }
  }

  return ctx
}

export function BusinessContextForm({
  questions,
  workspaceId,
  projectId,
  isSubmitting,
  onSubmit,
  onSkip,
}: BusinessContextFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const handleTextChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleMultiSelectToggle = (id: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) || []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [id]: next }
    })
  }

  const handleSubmit = () => {
    const ctx = mapAnswersToContext(answers, questions, workspaceId, projectId)
    onSubmit(ctx)
  }

  const answeredCount = Object.values(answers).filter(
    (v) => v && (typeof v === 'string' ? v.trim() : v.length > 0)
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/40">
          <Sparkles className="h-5 w-5 text-teal-700 dark:text-teal-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Kontekst biznesowy
          </h2>
          <p className="text-sm text-muted-foreground">
            Odpowiedz na pytania, aby AI lepiej dopasowalo rekomendacje do Twojego biznesu.
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="border-stone-200/80 dark:border-white/10">
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm font-medium text-stone-900 dark:text-white">
                <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                {q.question}
              </Label>
              {q.hint && (
                <p className="text-xs text-muted-foreground">{q.hint}</p>
              )}

              {q.type === 'text' && (
                <Textarea
                  placeholder="Twoja odpowiedz..."
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              )}

              {q.type === 'select' && q.options && (
                <Select
                  value={(answers[q.id] as string) || ''}
                  onValueChange={(v) => handleSelectChange(q.id, v)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Wybierz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {q.type === 'multiselect' && q.options && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = ((answers[q.id] as string[]) || []).includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleMultiSelectToggle(q.id, opt)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all border',
                          selected
                            ? 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          disabled={isSubmitting}
          className="text-muted-foreground gap-1.5"
        >
          <SkipForward className="h-4 w-4" />
          Pomin (generuj bez kontekstu)
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{questions.length} odpowiedzi
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Zapisz i kontynuuj analize
          </Button>
        </div>
      </div>
    </div>
  )
}
