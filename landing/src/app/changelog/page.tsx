import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import { RiAddCircleLine, RiBugLine, RiMagicLine } from 'react-icons/ri';

export const metadata: Metadata = {
  title: 'Changelog — SiteSpector | Co nowego',
  description:
    'Historia aktualizacji SiteSpector: nowe funkcje, ulepszenia i poprawki. Senuto, AI Overviews, Execution Plan, 3-fazowy audyt, harmonogramy — sprawdź, co się zmieniło.',
  keywords: ['changelog SiteSpector', 'co nowego', 'aktualizacje', 'nowe funkcje'],
};

type EntryType = 'feature' | 'improvement' | 'fix';

type ChangelogEntry = {
  type: EntryType;
  title: string;
  description: string;
};

type MonthBlock = {
  month: string; // YYYY-MM
  entries: ChangelogEntry[];
};

const months: MonthBlock[] = [
  {
    month: '2026-02',
    entries: [
      {
        type: 'feature',
        title: '[Feature] Integracja Senuto',
        description:
          'Widoczność, pozycje, trendy, backlinki i monitoring AI Overviews z Senuto. Dane z polskiego rynku SEO w jednym audycie. Konfiguracja API w ustawieniach konta.',
      },
      {
        type: 'feature',
        title: '[Feature] AI Overviews',
        description:
          'Monitoring, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google. Unikalna funkcja w połączeniu z Senuto — śledź wpływ AI na widoczność.',
      },
      {
        type: 'feature',
        title: '[Feature] Execution Plan',
        description:
          'AI generuje konkretne zadania z priorytetami, tagami quick win i gotowym kodem. Odznaczaj wykonane, dodawaj notatki. Nie tylko „co poprawić”, ale „jak to zrobić”.',
      },
      {
        type: 'feature',
        title: '[Feature] 3-fazowy audyt',
        description:
          'Pełny flow: faza techniczna (Screaming Frog + Lighthouse + Senuto) → Analiza AI (treść, wydajność, UX, bezpieczeństwo) → Execution Plan. Wyniki w 1–3 minuty.',
      },
      {
        type: 'feature',
        title: '[Feature] Kontekstowa analiza AI per obszar',
        description:
          'Gemini analizuje każdy obszar audytu osobno z pełnym kontekstem: SEO, Performance, Visibility, Backlinks, treść, UX, bezpieczeństwo.',
      },
      {
        type: 'feature',
        title: '[Feature] Zaplanowane audyty',
        description:
          'Harmonogramy dzienne, tygodniowe, miesięczne. Audyt uruchamia się automatycznie. Możliwość dodania konkurentów do harmonogramu.',
      },
      {
        type: 'feature',
        title: '[Feature] Głęboka analiza treści',
        description:
          'Wykrywanie thin content, duplikatów, brakujących meta tagów. Priorytetyzacja stron do optymalizacji.',
      },
      {
        type: 'feature',
        title: '[Feature] Analiza UX',
        description:
          'Dostępność, użyteczność, Core Web Vitals w kontekście doświadczenia użytkownika. Rekomendacje z Execution Plan.',
      },
      {
        type: 'feature',
        title: '[Feature] Analiza bezpieczeństwa',
        description:
          'HTTPS, nagłówki bezpieczeństwa, mixed content. Osobna zakładka Security w panelu audytu.',
      },
      {
        type: 'feature',
        title: '[Feature] Benchmarki branżowe',
        description: 'Porównaj wyniki z benchmarkami. Zobacz, gdzie Twoja strona stoi na tle branży.',
      },
      {
        type: 'improvement',
        title: '[Improvement] Przyspieszenie analizy AI',
        description: "Optymalizacja pipeline'u — szybsze wyniki bez utraty jakości.",
      },
      {
        type: 'improvement',
        title: '[Improvement] Ulepszony eksport PDF',
        description: '9 sekcji raportu, lepsze formatowanie, white-label w Pro i Enterprise.',
      },
    ],
  },
  {
    month: '2026-01',
    entries: [
      {
        type: 'feature',
        title: "[Feature] Zespoły i Workspace'y",
        description: 'Role (Właściciel, Admin, Członek), zaproszenia, współdzielone audyty.',
      },
      {
        type: 'feature',
        title: '[Feature] Konkurenci w audycie',
        description: 'Dodaj do 3 domen konkurencyjnych (Pro). Porównanie widoczności i backlinków.',
      },
      {
        type: 'improvement',
        title: '[Improvement] Panel audytu',
        description: 'Nowe zakładki, lepsza nawigacja, responsywność.',
      },
      {
        type: 'fix',
        title: '[Fix] Poprawki w crawlingu',
        description: 'Stabilność dla dużych stron.',
      },
    ],
  },
  {
    month: '2025-12',
    entries: [
      {
        type: 'feature',
        title: '[Feature] Raporty PDF',
        description: '9 sekcji, white-label, eksport surowych danych.',
      },
      {
        type: 'feature',
        title: '[Feature] Integracja Stripe',
        description: 'Subskrypcje, Customer Portal, zarządzanie planami.',
      },
      {
        type: 'improvement',
        title: '[Improvement] Lighthouse mobile',
        description: 'Pełna analiza Core Web Vitals na mobile.',
      },
    ],
  },
];

function entryMeta(type: EntryType) {
  if (type === 'feature') return { icon: RiAddCircleLine, className: 'text-success', label: 'Feature' };
  if (type === 'improvement') return { icon: RiMagicLine, className: 'text-info', label: 'Improvement' };
  return { icon: RiBugLine, className: 'text-warning', label: 'Fix' };
}

export default function ChangelogPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-9 text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">
                  Changelog — co nowego w <span className="text-gradient text-line">SiteSpector</span>
                </h1>
                <p className="lead text-muted mb-0">Śledź rozwój platformy. Nowe funkcje, ulepszenia i poprawki w jednym miejscu.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                {months.map(m => (
                  <div key={m.month} className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <h2 className="h4 fw-bold text-primary mb-0 me-3">{m.month}</h2>
                      <div className="flex-grow-1 border-bottom" />
                    </div>

                    <div className="bg-light rounded-4 border p-3 p-lg-4">
                      <ul className="list-unstyled mb-0">
                        {m.entries.map((e, idx) => {
                          const meta = entryMeta(e.type);
                          const Icon = meta.icon;
                          return (
                            <li key={idx} className="py-3 border-bottom">
                              <div className="d-flex align-items-start gap-3">
                                <div className="bg-white rounded-circle d-inline-flex p-2 shadow-sm">
                                  <Icon size={20} className={meta.className} />
                                </div>
                                <div>
                                  <div className="text-primary fw-bold">
                                    <span className="me-2 text-muted small">[{meta.label}]</span>
                                    {e.title.replace(/^\[[^\]]+\]\s*/, '')}
                                  </div>
                                  <div className="text-muted mt-1">{e.description}</div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}

                <div className="mt-5 p-4 p-lg-5 bg-light rounded-4 text-center border shadow-sm">
                  <div className="title-sm">
                    <span>CHCESZ WIĘCEJ?</span>
                  </div>
                  <h3 className="fw-bold text-primary mt-2 mb-2">Wypróbuj nowe funkcje na własnych stronach</h3>
                  <p className="text-muted mb-4">Włącz darmowy plan i od razu zobacz Execution Plan, AI Overviews i 3-fazowy audyt.</p>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Rozpocznij darmowy audyt
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
