/**
 * Słownik tooltipów dla SiteSpector
 * Zawiera opisy metryk, ich źródła oraz zakresy wartości.
 */

export interface TooltipData {
  label: string
  description: string
  source: string
  good?: string
  warning?: string
  bad?: string
}

export const TOOLTIPS = {
  // Overview Scores
  overall_score: {
    label: "Wynik Ogólny",
    description: "Średnia ważona z SEO (40%), Wydajności (30%) i Treści (30%). Odzwierciedla ogólną kondycję witryny.",
    source: "Algorytm SiteSpector",
    good: "90-100",
    warning: "50-89",
    bad: "0-49",
  },
  seo_score: {
    label: "Wynik SEO",
    description: "Ocena technicznych aspektów optymalizacji pod wyszukiwarki, takich jak tagi meta, struktura nagłówków i indeksowalność.",
    source: "Screaming Frog + Lighthouse",
    good: "90-100",
    warning: "50-89",
    bad: "0-49",
  },
  performance_score: {
    label: "Wynik Wydajności",
    description: "Ocena szybkości ładowania i interaktywności strony na podstawie metryk Core Web Vitals.",
    source: "Google Lighthouse",
    good: "90-100",
    warning: "50-89",
    bad: "0-49",
  },
  content_score: {
    label: "Wynik Treści",
    description: "Ocena jakości treści, jej długości, czytelności oraz unikalności.",
    source: "AI Content Analysis",
    good: "90-100",
    warning: "50-89",
    bad: "0-49",
  },

  // Core Web Vitals
  lcp: {
    label: "Largest Contentful Paint (LCP)",
    description: "Czas potrzebny na wyrenderowanie największego elementu treści (np. obrazka lub bloku tekstu) widocznego w oknie przeglądarki.",
    source: "Google Lighthouse",
    good: "< 2.5s",
    warning: "2.5s - 4s",
    bad: "> 4s",
  },
  fcp: {
    label: "First Contentful Paint (FCP)",
    description: "Czas, po którym przeglądarka wyrenderowała pierwszy fragment treści DOM (tekst, obraz, itp.).",
    source: "Google Lighthouse",
    good: "< 1.8s",
    warning: "1.8s - 3s",
    bad: "> 3s",
  },
  cls: {
    label: "Cumulative Layout Shift (CLS)",
    description: "Mierzy sumę wszystkich nieoczekiwanych przesunięć układu strony podczas ładowania. Wpływa na stabilność wizualną.",
    source: "Google Lighthouse",
    good: "< 0.1",
    warning: "0.1 - 0.25",
    bad: "> 0.25",
  },
  tbt: {
    label: "Total Blocking Time (TBT)",
    description: "Suma czasu między FCP a Time to Interactive, kiedy główny wątek był zablokowany na tyle długo, by uniemożliwić reakcję na dane wejściowe.",
    source: "Google Lighthouse",
    good: "< 200ms",
    warning: "200ms - 600ms",
    bad: "> 600ms",
  },
  speed_index: {
    label: "Speed Index",
    description: "Mierzy, jak szybko treści są wizualnie wyświetlane podczas ładowania strony.",
    source: "Google Lighthouse",
    good: "< 3.4s",
    warning: "3.4s - 5.8s",
    bad: "> 5.8s",
  },
  ttfb: {
    label: "Time to First Byte (TTFB)",
    description: "Czas oczekiwania na pierwszy bajt odpowiedzi z serwera po wysłaniu żądania HTTP.",
    source: "Google Lighthouse / Crawler",
    good: "< 0.8s",
    warning: "0.8s - 1.8s",
    bad: "> 1.8s",
  },

  // SEO Technical
  indexability: {
    label: "Indeksowalność",
    description: "Określa, czy strona może być indeksowana przez roboty wyszukiwarek (brak tagu noindex i blokady w robots.txt).",
    source: "Screaming Frog",
  },
  canonical: {
    label: "Tag Kanoniczny",
    description: "Wskazuje wyszukiwarkom preferowaną wersję strony w przypadku duplikacji treści.",
    source: "Screaming Frog",
  },
  meta_title: {
    label: "Tytuł Meta",
    description: "Tytuł strony wyświetlany w wynikach wyszukiwania i na karcie przeglądarki. Kluczowy dla SEO i CTR.",
    source: "Screaming Frog",
    good: "30-60 znaków",
  },
  meta_description: {
    label: "Opis Meta",
    description: "Krótkie podsumowanie treści strony wyświetlane w wynikach wyszukiwania pod tytułem.",
    source: "Screaming Frog",
    good: "70-155 znaków",
  },
  h1_tag: {
    label: "Nagłówek H1",
    description: "Główny nagłówek strony. Powinien być unikalny i zawierać główne słowo kluczowe.",
    source: "Screaming Frog",
    good: "Dokładnie jeden na stronę",
  },

  // Content
  word_count: {
    label: "Liczba Słów",
    description: "Całkowita liczba słów w głównej treści strony.",
    source: "Screaming Frog",
    good: "> 300 (zależy od typu strony)",
  },
  readability: {
    label: "Czytelność (Flesch)",
    description: "Wskaźnik łatwości czytania tekstu. Wyższy wynik oznacza łatwiejszy tekst.",
    source: "AI Content Analysis",
    good: "> 60 (standardowa treść)",
  },
  thin_content: {
    label: "Thin Content",
    description: "Strony o bardzo małej ilości wartościowej treści, które mogą być negatywnie oceniane przez Google.",
    source: "AI Content Analysis",
  },

  // Links & Images
  broken_links: {
    label: "Uszkodzone Linki (404)",
    description: "Linki prowadzące do nieistniejących stron. Negatywnie wpływają na UX i SEO.",
    source: "Screaming Frog",
    good: "0",
  },
  alt_text: {
    label: "Tekst Alternatywny (ALT)",
    description: "Opis obrazka dla robotów wyszukiwarek i czytników ekranu dla osób niedowidzących.",
    source: "Screaming Frog",
    good: "Wszystkie obrazy z opisem",
  },
  internal_links: {
    label: "Linki Wewnętrzne",
    description: "Liczba linków prowadzących do innych podstron w obrębie tej samej domeny.",
    source: "Screaming Frog",
  },
  external_links: {
    label: "Linki Zewnętrzne",
    description: "Linki prowadzące do innych domen (wychodzące).",
    source: "Screaming Frog",
  },
} as const

export type TooltipKey = keyof typeof TOOLTIPS
