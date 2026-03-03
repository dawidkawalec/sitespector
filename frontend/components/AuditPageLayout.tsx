'use client'

/**
 * AuditPageLayout - Simplified layout wrapper for audit detail pages
 * 
 * Provides a responsive single-column layout with an inline collapsible AI section.
 * This is designed to work well with the persistent ChatPanel.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, PanelBottomClose, PanelBottomOpen, Loader2, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditPageLayoutProps {
  children: React.ReactNode
  aiPanel?: React.ReactNode
  aiPanelTitle?: string
  isAiLoading?: boolean
  hasAiData?: boolean
  onTriggerAi?: () => void
}

const STORAGE_KEY = 'sitespector_ai_panel_visible'

export function AuditPageLayout({
  children,
  aiPanel,
  aiPanelTitle = 'Wnioski AI',
  isAiLoading = false,
  hasAiData = false,
  onTriggerAi,
}: AuditPageLayoutProps) {
  const [showPanel, setShowPanel] = useState(true)

  // Load preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setShowPanel(stored === 'true')
      }
    }
  }, [])

  // Persist preference
  const togglePanel = () => {
    const next = !showPanel
    setShowPanel(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next))
    }
  }

  const hasPanel = !!aiPanel || isAiLoading || hasAiData

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 @md:px-6 @md:py-8 min-w-0">
      {/* Toggle button */}
      {hasPanel && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePanel}
            className="gap-2 text-xs"
          >
            {showPanel ? (
              <>
                <PanelBottomClose className="h-3.5 w-3.5" />
                Ukryj wnioski AI
              </>
            ) : (
              <>
                <PanelBottomOpen className="h-3.5 w-3.5" />
                Pokaż wnioski AI
              </>
            )}
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {/* AI Section (Inline) */}
        {hasPanel && showPanel && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/10 bg-accent/10 backdrop-blur-sm">
              <BrainCircuit className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-accent">{aiPanelTitle}</span>
              {isAiLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-accent ml-auto" />
              )}
            </div>

            {/* Panel content */}
            <div className="p-4">
              {isAiLoading && !aiPanel && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent mb-3" />
                  <p className="text-xs text-muted-foreground">AI analizuje dane...</p>
                </div>
              )}

              {!isAiLoading && !hasAiData && !aiPanel && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground/50 mb-3" />
                  <p className="text-xs text-muted-foreground">Brak wniosków AI</p>
                  {onTriggerAi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onTriggerAi}
                      className="mt-3 gap-2 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Uruchom analizę AI
                    </Button>
                  )}
                </div>
              )}

              {aiPanel}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
