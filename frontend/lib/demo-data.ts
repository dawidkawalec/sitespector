/**
 * Hardcoded mock audit data for the static demo page.
 * Realistic but completely fake — represents a mid-quality Polish e-commerce site.
 */

export const DEMO_AUDIT = {
  id: 'demo-audit-sitespector',
  url: 'https://przykładowy-sklep.pl',
  status: 'completed' as const,
  ai_status: 'completed',
  execution_plan_status: 'completed',
  created_at: '2026-03-15T10:00:00Z',
  completed_at: '2026-03-15T10:28:00Z',
  overall_score: 72,
  seo_score: 78,
  performance_score: 65,
  content_score: 81,
  results: {
    crawl: {
      pages_crawled: 156,
      pages_by_status: { '200': 142, '301': 8, '404': 4, '500': 1, other: 1 },
      links: {
        broken: 7,
        internal: 1245,
        external: 89,
        redirects: 23,
        nofollow: 18,
      },
      technical_seo: {
        missing_canonical: 12,
        noindex_pages: 5,
        redirects: 23,
        nofollow_pages: 18,
        hreflang_pages: 0,
        missing_title: 3,
        missing_meta_description: 8,
        duplicate_title: 6,
        duplicate_meta_description: 4,
        missing_h1: 2,
        multiple_h1: 7,
      },
      images: { without_alt: 34, total: 289 },
      has_sitemap: true,
      has_robots: true,
      ai_readiness: {
        score: 58,
        status: 'partial',
        checks: [
          { name: 'Robots.txt', status: 'pass' },
          { name: 'Sitemap.xml', status: 'pass' },
          { name: 'Schema.org', status: 'warning' },
          { name: 'Blokowanie botów AI', status: 'warning' },
          { name: 'llms.txt', status: 'fail' },
        ],
        citation_bots: { blocked: ['GPTBot', 'CCBot'] },
        llms_txt: { exists: false },
      },
    },
    lighthouse: {
      desktop: {
        performance_score: 72,
        accessibility_score: 88,
        best_practices_score: 83,
        seo_score: 85,
        lcp: 2650,
        cls: 0.11,
        total_blocking_time: 210,
        fcp: 1350,
        speed_index: 3400,
        ttfb: 720,
        interactive: 4100,
        bootup_time: 1950,
        total_byte_weight: 1680000,
        dom_size: 1120,
      },
      mobile: {
        performance_score: 58,
        accessibility_score: 84,
        best_practices_score: 79,
        seo_score: 78,
        lcp: 3800,
        cls: 0.16,
        total_blocking_time: 480,
        fcp: 1900,
        speed_index: 5100,
        ttfb: 950,
        interactive: 6200,
        bootup_time: 2400,
        total_byte_weight: 1680000,
        dom_size: 1180,
      },
    },
    senuto: {
      visibility: { score: 1245, trend: 'growing' },
      positions: [
        { keyword: 'sklep internetowy meble', statistics: { position: { current: 4 }, searches: { current: 2400 }, difficulty: { current: 58 }, url: { current: '/meble' } } },
        { keyword: 'tanie meble online', statistics: { position: { current: 8 }, searches: { current: 1800 }, difficulty: { current: 45 }, url: { current: '/promocje' } } },
        { keyword: 'meble do salonu', statistics: { position: { current: 14 }, searches: { current: 3200 }, difficulty: { current: 72 }, url: { current: '/meble/salon' } } },
        { keyword: 'sofa narożna', statistics: { position: { current: 22 }, searches: { current: 1500 }, difficulty: { current: 55 }, url: { current: '/meble/sofy' } } },
        { keyword: 'stół drewniany', statistics: { position: { current: 6 }, searches: { current: 890 }, difficulty: { current: 38 }, url: { current: '/meble/stoly' } } },
      ],
    },
    technical_health_index: {
      score: 68,
      status: 'moderate',
      grade: 'C',
      breakdown: {
        lighthouse_pillar: 65,
        crawl_health_pillar: 78,
        tech_extras_pillar: 62,
        content_pillar: 74,
        security_pillar: 71,
      },
    },
    visibility_momentum: {
      score: 12.5,
      status: 'growing',
      wins_count: 18,
      losses_count: 7,
      net_keywords: 11,
      top_wins: [
        { keyword: 'meble do salonu', search_volume: 3200 },
        { keyword: 'sklep z meblami', search_volume: 1400 },
        { keyword: 'meble online sklep', search_volume: 890 },
      ],
      top_losses: [
        { keyword: 'tanie meble', search_volume: 2100 },
        { keyword: 'meble ogrodowe', search_volume: 980 },
      ],
    },
    traffic_estimation: {
      total_estimated_monthly: 4820,
      potential_gain: 1340,
      by_position_bracket: {
        '1-3': { label: 'Pozycja 1-3', estimated_traffic: 1850, keywords: 12 },
        '4-10': { label: 'Pozycja 4-10', estimated_traffic: 1680, keywords: 28 },
        '11-20': { label: 'Pozycja 11-20', estimated_traffic: 890, keywords: 45 },
        '21-50': { label: 'Pozycja 21-50', estimated_traffic: 320, keywords: 89 },
        '51+': { label: 'Pozycja 51+', estimated_traffic: 80, keywords: 156 },
      },
      top_traffic_keywords: [
        { keyword: 'sklep internetowy meble', estimated_traffic: 580 },
        { keyword: 'meble do salonu', estimated_traffic: 420 },
        { keyword: 'tanie meble online', estimated_traffic: 310 },
      ],
    },
    content_quality_index: {
      site_score: 76,
      grade: 'B',
      distribution: { A: 42, B: 58, C: 38, D: 14, F: 4 },
      top_issues: [
        { issue: 'thin_content', count: 18 },
        { issue: 'missing_meta_description', count: 8 },
        { issue: 'low_text_ratio', count: 14 },
        { issue: 'duplicate_h1', count: 7 },
      ],
    },
  },
}

export const DEMO_SIDEBAR_SECTIONS = [
  {
    title: 'SEO i Treść',
    items: ['SEO', 'Content Quality', 'Schema.org', 'Linki', 'Obrazy'],
  },
  {
    title: 'Widoczność i AI',
    items: ['Widoczność', 'AI Overviews', 'AI Readiness'],
  },
  {
    title: 'Technikalia',
    items: ['Technical SEO', 'Wydajność', 'Użyteczność', 'Bezpieczeństwo', 'Architektura'],
  },
  {
    title: 'Strategia',
    items: ['Quick Wins', 'AI Strategy'],
  },
  {
    title: 'Raporty',
    items: ['Porównanie', 'Benchmark', 'Konkurencja', 'Raport PDF'],
  },
]
