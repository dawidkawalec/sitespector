---
title: "E-commerce FashionHouse: poprawa Core Web Vitals z 45 do 82"
slug: "ecommerce-fashionhouse"
date: "2026-01-15"
category: "E-commerce"
client_type: "Sklep internetowy z odzieżą"
challenge_summary: "Performance Score 45/100, LCP > 5s, CLS > 0.3"
results_summary: "Performance Score 82, +12 pozycji w Google w 2 miesiące"
key_metrics:
  - label: "Performance Score"
    before: "45"
    after: "82"
  - label: "LCP"
    before: "5.2s"
    after: "1.8s"
  - label: "CLS"
    before: "0.3"
    after: "0.05"
  - label: "Pozycja w Google"
    before: "-"
    after: "+12 pozycji (główne frazy)"
cover_image:
  src: "/images/case-studies/fashionhouse-cover.png"
  alt: "FashionHouse — case study e-commerce SiteSpector"
  placeholder: "PLACEHOLDER: Dashboard audytu e-commerce z wykresami Performance Score przed i po — 1200x630px"
logo:
  src: "/images/case-studies/fashionhouse-logo.png"
  placeholder: "PLACEHOLDER: Logo FashionHouse — 200x100px"
testimonial:
  quote: "Core Web Vitals były naszym problemem. SiteSpector pokazał dokładnie gdzie gubimy milisekundy."
  author: "Tomek R."
  role: "CTO, E-commerce Fashion House"
---

## Wyzwanie

Sklep online z odzieżą z Performance Score 45/100. Główne problemy zidentyfikowane przez SiteSpector:
- **LCP > 5.2s** — duże, niezoptymalizowane obrazy produktów
- **CLS > 0.3** — dynamiczne bannery i reklamy zmieniające layout
- **TTFB > 1s** — wolny hosting bez CDN

Sklep tracił pozycje w Google od czasu wprowadzenia Core Web Vitals jako czynnika rankingowego.

## Rozwiązanie

Audyt SiteSpector z analizą konkurencji (3 główne sklepy z branży odzieżowej):

1. **Screaming Frog** zidentyfikował 234 obrazy bez ALT tagów i 45 stron z duplikatami meta opisów
2. **Lighthouse** pokazał konkretne problemy z LCP (niezoptymalizowane hero images) i CLS (bannery bez stałych wymiarów)
3. **AI Gemini** wygenerował Action Plan z priorytetami: najpierw obrazy (największy impact), potem layout stability, potem hosting

Raport PDF z 9 sekcjami przekazany zespołowi deweloperów z konkretną listą zadań.

## Wyniki (po 2 miesiącach)

- **Performance Score**: z 45 na 82 (+37 punktów)
- **LCP**: z 5.2s na 1.8s (optymalizacja obrazów, lazy loading, WebP)
- **CLS**: z 0.3 na 0.05 (stałe wymiary elementów, placeholder'y)
- **Pozycja w Google**: wzrost o 12 pozycji na główne frazy w 2 miesiące
- **Bounce rate**: spadek o 18% (strona ładuje się szybciej)
