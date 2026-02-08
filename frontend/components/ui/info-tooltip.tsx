"use client"

import React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { TOOLTIPS, TooltipKey } from "@/lib/tooltips"

interface InfoTooltipProps {
  id: TooltipKey
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function InfoTooltip({
  id,
  className,
  iconClassName,
  side = "top",
}: InfoTooltipProps) {
  const tooltip = TOOLTIPS[id]

  if (!tooltip) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
            <span className="sr-only">Informacja o {tooltip.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[300px] p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm leading-none">{tooltip.label}</h4>
            <p className="text-xs text-muted-foreground leading-normal">
              {tooltip.description}
            </p>
            <div className="pt-2 border-t mt-2 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-medium">Źródło:</span>
                <span className="text-muted-foreground">{tooltip.source}</span>
              </div>
              {tooltip.good && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium">Dobre:</span>
                  <span className="text-green-600">{tooltip.good}</span>
                </div>
              )}
              {tooltip.warning && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium">Wymaga poprawy:</span>
                  <span className="text-yellow-600">{tooltip.warning}</span>
                </div>
              )}
              {tooltip.bad && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium">Złe:</span>
                  <span className="text-red-600">{tooltip.bad}</span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
