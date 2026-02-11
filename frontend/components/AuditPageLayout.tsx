'use client'

/**
 * AuditPageLayout - Split layout wrapper for audit detail pages
 * 
 * Provides a responsive split layout:
 * - Desktop (xl+): Left column (data) + Right column (sticky AI panel)
 * - Mobile/Tablet: Data first, AI panel below with toggle
 * 
 * AI panel state (show/hide) is persisted in localStorage.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, PanelRightClose, PanelRightOpen, Loader2, BrainCircuit } from 'lucide-react'
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
    <div className="container mx-auto py-8 px-4">
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
                <PanelRightClose className="h-3.5 w-3.5" />
                Ukryj panel AI
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                Pokaż wnioski AI
              </>
            )}
          </Button>
        </div>
      )}

      {/* Split layout */}
      <div className={cn(
        'grid gap-6',
        hasPanel && showPanel
          ? 'grid-cols-1 xl:grid-cols-[1fr_380px]'
          : 'grid-cols-1'
      )}>
        {/* Left column: Data */}
        <div className="space-y-8 min-w-0">
          {children}
        </div>

        {/* Right column: AI Panel */}
        {hasPanel && showPanel && (
          <div className="hidden xl:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-accent/20 bg-accent/5 shadow-sm">
              {/* Panel header */}
              <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-accent/10 bg-accent/10 backdrop-blur-sm rounded-t-lg">
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
                    <p className="text-[10px] text-muted-foreground mt-1">To może potrwać chwilę</p>
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
          </div>
        )}

        {/* Mobile AI Panel (below data) */}
        {hasPanel && showPanel && (
          <div className="xl:hidden">
            <div className="rounded-lg border border-accent/20 bg-accent/5 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/10 bg-accent/10 rounded-t-lg">
                <BrainCircuit className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold text-accent">{aiPanelTitle}</span>
                {isAiLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-accent ml-auto" />
                )}
              </div>
              <div className="p-4">
                {isAiLoading && !aiPanel && (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <p className="text-xs text-muted-foreground">AI analizuje dane...</p>
                  </div>
                )}
                {!isAiLoading && !hasAiData && !aiPanel && (
                  <div className="flex flex-col items-center py-4 text-center">
                    <p className="text-xs text-muted-foreground">Brak wniosków AI</p>
                    {onTriggerAi && (
                      <Button variant="outline" size="sm" onClick={onTriggerAi} className="mt-2 gap-2 text-xs">
                        <Sparkles className="h-3 w-3" /> Uruchom analizę AI
                      </Button>
                    )}
                  </div>
                )}
                {aiPanel}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
