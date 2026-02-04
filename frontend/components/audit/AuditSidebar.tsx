'use client'

/**
 * Audit Sidebar Component
 * 
 * Navigation sidebar for audit detail pages.
 * Organized in 3 sections: Current Audit, Tools, System.
 */

import { AuditMenuItem } from './AuditMenuItem'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  FileText,
  Search,
  Gauge,
  Sparkles,
  ArrowLeftRight,
  Network,
  Bug,
  FileDown,
  FileUser,
  Target,
  Users,
  Zap,
  Code2,
  Shield,
  MousePointer,
  Plug,
  Activity,
  ListTodo,
  Download
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface AuditSidebarProps {
  auditId: string
}

export function AuditSidebar({ auditId }: AuditSidebarProps) {
  return (
    <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Aktualny audyt
        </h2>
      </div>

      {/* Section 1: Aktualny audyt */}
      <nav className="p-2">
        <AuditMenuItem 
          href={`/audits/${auditId}`}
          icon={FileText}
          label="Podsumowanie"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/seo`}
          icon={Search}
          label="SEO"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/performance`}
          icon={Gauge}
          label="Wydajność"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/ai-analysis`}
          icon={Sparkles}
          label="Analiza AI"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/comparison`}
          icon={ArrowLeftRight}
          label="Porównanie"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/architecture`}
          icon={Network}
          label="Architektura"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/debug`}
          icon={Bug}
          label="Debug"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/pdf`}
          icon={FileDown}
          label="Raport PDF"
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/client-report`}
          icon={FileUser}
          label="Raport dla klienta"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/benchmark`}
          icon={Target}
          label="Benchmark"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/competitors`}
          icon={Users}
          label="Konkurencja"
        />
      </nav>

      <Separator className="my-2" />

      {/* Section 2: Narzędzia */}
      <div className="p-2">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Narzędzia
        </h3>
        <AuditMenuItem 
          href={`/audits/${auditId}/quick-wins`}
          icon={Zap}
          label="Quick Wins"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/performance-tools`}
          icon={Gauge}
          label="Performance"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/seo-tools`}
          icon={Search}
          label="SEO"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/tech-stack`}
          icon={Code2}
          label="Tech Stack"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/security`}
          icon={Shield}
          label="Security"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/ai-content`}
          icon={Sparkles}
          label="AI Content"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/ux-check`}
          icon={MousePointer}
          label="UX Check"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/integrations`}
          icon={Plug}
          label="Integracje"
          disabled
        />
      </div>

      <Separator className="my-2" />

      {/* Section 3: System */}
      <div className="p-2">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          System
        </h3>
        <AuditMenuItem 
          href={`/audits/${auditId}/status`}
          icon={Activity}
          label="Status silników"
          disabled
        />
        <AuditMenuItem 
          href={`/audits/${auditId}/tasks`}
          icon={ListTodo}
          label="Zadania z audytu"
          disabled
        />
      </div>

      <Separator className="my-2" />

      {/* Download Extension */}
      <div className="p-2">
        <AuditMenuItem 
          href="/extension"
          icon={Download}
          label="Pobierz wtyczkę"
          disabled
        />
      </div>

      {/* Theme toggle at bottom - Push to bottom with margin-top auto */}
      <div className="p-4 border-t mt-auto">
        <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Motyw
        </h3>
        <ThemeToggle />
      </div>
    </aside>
  )
}
