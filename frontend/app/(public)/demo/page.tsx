'use client'

import { DEMO_AUDIT } from '@/lib/demo-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Globe,
  Search,
  Gauge,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bot,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const audit = DEMO_AUDIT
const r = audit.results

function ScoreCard({ label, score, icon: Icon, color }: { label: string; score: number; icon: any; color: string }) {
  const bg = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <span className="text-3xl font-black">{score}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div className={`h-2 rounded-full ${bg} transition-all`} style={{ width: `${score}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center p-3">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DemoPage() {
  const crawl = r.crawl
  const lhDesktop = r.lighthouse.desktop
  const thi = r.technical_health_index
  const momentum = r.visibility_momentum
  const traffic = r.traffic_estimation
  const cqi = r.content_quality_index

  const errorCount = (crawl.pages_by_status['404'] || 0) + (crawl.pages_by_status['500'] || 0) + crawl.links.broken
  const warningCount = (crawl.technical_seo.missing_canonical || 0) + (crawl.technical_seo.missing_title || 0) + (crawl.technical_seo.missing_meta_description || 0)
  const noticeCount = (crawl.technical_seo.duplicate_title || 0) + (crawl.technical_seo.multiple_h1 || 0) + crawl.images.without_alt

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Audyt: {audit.url}</h1>
          <Badge variant="default">Zakończony</Badge>
          <Badge variant="secondary">Demo</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Rozpoczęto: {new Date(audit.created_at).toLocaleString('pl-PL')} • Czas analizy: 28 min
        </p>
      </div>

      {/* 4 Main Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard label="Overall Score" score={audit.overall_score} icon={Globe} color="text-primary" />
        <ScoreCard label="SEO Score" score={audit.seo_score} icon={Search} color="text-blue-500" />
        <ScoreCard label="Performance" score={audit.performance_score} icon={Gauge} color="text-amber-500" />
        <ScoreCard label="Content Score" score={audit.content_score} icon={FileText} color="text-emerald-500" />
      </div>

      {/* Technical Health Index + Issue Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Technical Health Index
            </CardTitle>
            <CardDescription>Ocena: {thi.grade} ({thi.score}/100) — {thi.status === 'moderate' ? 'Umiarkowany' : thi.status}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(thi.breakdown).map(([key, value]) => {
                const labels: Record<string, string> = {
                  lighthouse_pillar: 'Lighthouse',
                  crawl_health_pillar: 'Crawl Health',
                  tech_extras_pillar: 'Technical Extras',
                  content_pillar: 'Content',
                  security_pillar: 'Security',
                }
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{labels[key] || key}</span>
                      <span className="font-medium">{value}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Issue Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Info className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{noticeCount}</p>
                <p className="text-xs text-muted-foreground">Notices</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><AlertCircle className="h-3 w-3 text-red-500" /> {crawl.links.broken} broken links</div>
              <div className="flex items-center gap-2"><AlertCircle className="h-3 w-3 text-red-500" /> {crawl.pages_by_status['404']} stron 404</div>
              <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-amber-500" /> {crawl.technical_seo.missing_canonical} brak canonical</div>
              <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-amber-500" /> {crawl.technical_seo.missing_meta_description} brak meta description</div>
              <div className="flex items-center gap-2"><Info className="h-3 w-3 text-blue-500" /> {crawl.images.without_alt} obrazów bez alt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visibility + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Visibility Momentum
            </CardTitle>
            <CardDescription>
              Score: {momentum.score > 0 ? '+' : ''}{momentum.score} • {momentum.wins_count} wzrostów, {momentum.losses_count} spadków
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-600">Top wzrosty:</p>
              {momentum.top_wins.map((w, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{w.keyword}</span>
                  <span className="text-muted-foreground">{w.search_volume} wyszukiwań/msc</span>
                </div>
              ))}
              <p className="text-sm font-medium text-red-600 mt-3">Top spadki:</p>
              {momentum.top_losses.map((l, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{l.keyword}</span>
                  <span className="text-muted-foreground">{l.search_volume} wyszukiwań/msc</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Szacowany Ruch
            </CardTitle>
            <CardDescription>
              ~{traffic.total_estimated_monthly.toLocaleString()} wizyt/msc • Potencjał: +{traffic.potential_gain.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.values(traffic.by_position_bracket).map((bracket: any, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">{bracket.label}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(bracket.estimated_traffic / traffic.total_estimated_monthly) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{bracket.estimated_traffic}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{bracket.keywords} fraz</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Quality + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Content Quality Index
            </CardTitle>
            <CardDescription>Ocena: {cqi.grade} ({cqi.site_score}/100)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => (
                <div key={grade} className="text-center">
                  <p className="text-lg font-bold">{cqi.distribution[grade]}</p>
                  <p className="text-xs text-muted-foreground">Ocena {grade}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {cqi.top_issues.map((issue, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{issue.issue.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary" className="text-xs">{issue.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Stron przecrawlowanych" value={crawl.pages_crawled} />
              <StatCard label="Linków wewnętrznych" value={crawl.links.internal.toLocaleString()} />
              <StatCard label="Linków zewnętrznych" value={crawl.links.external} />
              <StatCard label="Obrazów bez alt" value={crawl.images.without_alt} sub={`z ${crawl.images.total} total`} />
              <StatCard label="Lighthouse Desktop" value={`${lhDesktop.performance_score}/100`} />
              <StatCard label="LCP (Desktop)" value={`${(lhDesktop.lcp / 1000).toFixed(1)}s`} />
              <StatCard label="AI Readiness" value={`${crawl.ai_readiness.score}%`} sub={crawl.ai_readiness.status} />
              <StatCard label="Sitemap" value={crawl.has_sitemap ? 'Tak' : 'Nie'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Bottom */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold text-primary mb-2">
            Chcesz taki audyt dla swojej strony?
          </h3>
          <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
            Wpisz URL swojej strony i w 30 minut otrzymasz kompletny audyt SEO z Execution Plan — gotowymi zadaniami z kodem do wdrożenia.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Zacznij za darmo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/cennik">Zobacz cennik</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            50 kredytów na start — bez karty kredytowej
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
