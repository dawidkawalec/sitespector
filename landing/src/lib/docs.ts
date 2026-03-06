export type DocPage = {
  slug: string;
  title: string;
  description: string;
  bullets: string[];
};

// Central source of truth for docs routes (used by pages + sitemap).
export const DOC_PAGES: DocPage[] = [
  {
    slug: 'jak-zaczac',
    title: 'Jak zacząć',
    description: 'Pierwszy audyt krok po kroku, konfiguracja Senuto i omówienie aktualnej oferty.',
    bullets: ['Rejestracja i pierwsze logowanie', 'Uruchomienie pierwszego audytu', 'Konfiguracja Senuto (kraj analizy)', 'Szczegóły oferty — wkrótce'],
  },
  {
    slug: 'panel-audytu',
    title: 'Panel audytu',
    description: 'Przegląd zakładek i wyników audytu oraz gdzie szukać najważniejszych danych.',
    bullets: ['SEO, Performance, Visibility, AI Overviews', 'Backlinks, Links, Images', 'Quick Wins, Benchmark i konkurenci', 'Eksport danych i analiza per-page'],
  },
  {
    slug: 'execution-plan',
    title: 'Execution Plan',
    description: 'Zadania z priorytetami, quick wins i gotowym kodem do wdrożenia.',
    bullets: ['Jak AI generuje zadania', 'Statusy: do zrobienia / w toku / wykonane', 'Notatki i śledzenie postępu', 'Eksport zadań do wdrożenia'],
  },
  {
    slug: 'raporty-pdf',
    title: 'Raporty PDF',
    description: 'Generowanie raportu, 9 sekcji i white-label.',
    bullets: ['9 sekcji raportu', 'White-label', 'Eksport surowych danych', 'Wysyłka do klienta'],
  },
  {
    slug: 'zespoly-workspaces',
    title: "Zespoły i Workspace'y",
    description: 'Role, zaproszenia i współdzielenie audytów w zespole.',
    bullets: ['Role: Właściciel, Admin, Członek', 'Zapraszanie użytkowników', "Przełączanie między workspace'ami", 'Współdzielone audyty'],
  },
  {
    slug: 'harmonogramy',
    title: 'Harmonogramy',
    description: 'Audyty cykliczne oraz powiadomienia i zarządzanie harmonogramami.',
    bullets: ['Audyty dzienne, tygodniowe, miesięczne', 'Konkurenci w harmonogramie', 'Powiadomienia', 'Zarządzanie harmonogramami'],
  },
  {
    slug: 'subskrypcje-platnosci',
    title: 'Subskrypcje i płatności',
    description: 'Pakiety, Stripe, faktury oraz zmiana/anulowanie subskrypcji.',
    bullets: ['Pakiety i dostępność', 'Stripe — płatność i faktury', 'Customer Portal', 'Limity audytów'],
  },
  {
    slug: 'integracje',
    title: 'Integracje',
    description: 'Senuto, silniki audytu (Screaming Frog, Lighthouse) oraz integracje infrastrukturalne.',
    bullets: ['Senuto — konfiguracja API', 'Screaming Frog + Lighthouse', 'Stripe i Supabase', 'Jakie dane pobieramy i zapisujemy'],
  },
  {
    slug: 'ai-analiza',
    title: 'AI analiza',
    description: 'Jak działa analiza Gemini i jakie dane są przetwarzane.',
    bullets: ['Co analizuje Gemini', 'Jakie dane wysyłamy do AI', 'Ograniczenia i prywatność', 'Rekomendacje i kontekst'],
  },
  {
    slug: 'bezpieczenstwo',
    title: 'Bezpieczeństwo',
    description: 'RODO, dane w UE, RLS oraz podstawy szyfrowania i SSL.',
    bullets: ['Dane w UE', 'RLS (Row Level Security)', 'SSL i szyfrowanie', 'RODO/GDPR'],
  },
];

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

