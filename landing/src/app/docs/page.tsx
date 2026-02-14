import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  RiBookOpenLine,
  RiCalendarScheduleLine,
  RiDashboardLine,
  RiFilePdfLine,
  RiLockLine,
  RiPlugLine,
  RiRobotLine,
  RiTeamLine,
  RiTerminalBoxLine,
  RiWalletLine,
} from 'react-icons/ri';

export const metadata: Metadata = {
  title: 'Dokumentacja — SiteSpector | Centrum pomocy',
  description:
    'Pełna dokumentacja SiteSpector: jak zacząć, panel audytu, Execution Plan, raporty PDF, zespoły, harmonogramy, integracje. Wszystkie instrukcje w jednym miejscu.',
  keywords: ['dokumentacja SiteSpector', 'pomoc audyt SEO', 'Execution Plan', 'Senuto integracja', 'raport PDF'],
};

type DocCategory = {
  slug: string;
  title: string;
  icon: (props: { size?: number; className?: string }) => ReactNode;
  bullets: string[];
};

const categories: DocCategory[] = [
  {
    slug: 'jak-zaczac',
    title: 'Jak zacząć',
    icon: props => <RiBookOpenLine {...props} />,
    bullets: ['Rejestracja i pierwsze logowanie', 'Pierwszy audyt krok po kroku', 'Konfiguracja Senuto', 'Plan Free vs Pro — co zawiera'],
  },
  {
    slug: 'panel-audytu',
    title: 'Panel audytu',
    icon: props => <RiDashboardLine {...props} />,
    bullets: ['Zakładki: SEO, Performance, Visibility, AI Overviews', 'Backlinks, Links, Images', 'Quick Wins, AI Strategy, Benchmark', 'Eksport danych i per-page analysis'],
  },
  {
    slug: 'execution-plan',
    title: 'Execution Plan',
    icon: props => <RiTerminalBoxLine {...props} />,
    bullets: ['Zadania z priorytetami i kodem', 'Statusy: do zrobienia / w toku / wykonane', 'Filtr quick wins', 'Eksport zadań'],
  },
  {
    slug: 'raporty-pdf',
    title: 'Raporty PDF',
    icon: props => <RiFilePdfLine {...props} />,
    bullets: ['9 sekcji raportu', 'White-label (Pro, Enterprise)', 'Eksport surowych danych', 'Wysyłka do klienta'],
  },
  {
    slug: 'zespoly-workspaces',
    title: "Zespoły i Workspace'y",
    icon: props => <RiTeamLine {...props} />,
    bullets: ['Role: Właściciel, Admin, Członek', 'Zapraszanie użytkowników', "Przełączanie między workspace'ami", 'Współdzielone audyty'],
  },
  {
    slug: 'harmonogramy',
    title: 'Harmonogramy',
    icon: props => <RiCalendarScheduleLine {...props} />,
    bullets: ['Audyty dzienne, tygodniowe, miesięczne', 'Konkurenci w harmonogramie', 'Powiadomienia', 'Zarządzanie harmonogramami'],
  },
  {
    slug: 'subskrypcje-platnosci',
    title: 'Subskrypcje i płatności',
    icon: props => <RiWalletLine {...props} />,
    bullets: ['Plany Free, Pro, Enterprise', 'Stripe — płatność i faktury', 'Customer Portal', 'Limity audytów'],
  },
  {
    slug: 'integracje',
    title: 'Integracje',
    icon: props => <RiPlugLine {...props} />,
    bullets: ['Senuto — konfiguracja API', 'Screaming Frog i Lighthouse (silniki audytu)', 'Stripe i Supabase', 'Co pobieramy i co zapisujemy'],
  },
  {
    slug: 'ai-analiza',
    title: 'AI analiza',
    icon: props => <RiRobotLine {...props} />,
    bullets: ['Co analizuje Gemini', 'Jakie dane wysyłamy do AI', 'Kontekstowe analizy per obszar', 'Prywatność i ograniczenia'],
  },
  {
    slug: 'bezpieczenstwo',
    title: 'Bezpieczeństwo',
    icon: props => <RiLockLine {...props} />,
    bullets: ['Dane w UE (Supabase + VPS Hetzner)', 'RLS (Row Level Security)', 'SSL i szyfrowanie', 'RODO/GDPR'],
  },
];

export default function DocsPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-9 text-center">
                <div className="text-orange mb-3">
                  <RiBookOpenLine size={44} />
                </div>
                <h1 className="display-4 fw-bold text-primary mb-3">
                  Centrum pomocy <span className="text-gradient text-line">SiteSpector</span>
                </h1>
                <p className="lead text-muted mb-0">
                  Wszystko, co musisz wiedzieć, aby skutecznie korzystać z audytów: od pierwszego uruchomienia po zaawansowane funkcje — Execution Plan, PDF,
                  zespoły i integracje.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-11">
                <div className="title-sm">
                  <span>WYBIERZ TEMAT</span>
                </div>
                <div className="main-title mt-3 mb-4">
                  <h2 className="text-primary">
                    Kategorie <span className="text-orange text-line">dokumentacji</span>
                  </h2>
                </div>

                <div className="row g-4">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <div className="col-md-6 col-lg-4" key={cat.slug}>
                        <Link href={`/docs/${cat.slug}`} className="text-decoration-none">
                          <div className="card border-0 shadow-sm rounded-4 h-100 hover-lift transition-all">
                            <div className="card-body p-4">
                              <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 mb-3">
                                <span className="text-orange">{Icon({ size: 26 })}</span>
                              </div>
                              <h3 className="h5 text-primary fw-bold">{cat.title}</h3>
                              <div className="text-muted small mt-2">
                                {cat.bullets.slice(0, 4).map(b => (
                                  <div key={b}>• {b}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="bg-light rounded-4 border p-4">
                    <div className="fw-bold text-primary mb-2">Szybkie linki</div>
                    <div className="d-flex flex-column flex-md-row flex-wrap gap-2">
                      <Link href="/docs/jak-zaczac" className="btn btn-sm btn-outline-primary">
                        Jak dodać pierwszy audyt?
                      </Link>
                      <Link href="/docs/execution-plan" className="btn btn-sm btn-outline-primary">
                        Gdzie znaleźć Execution Plan?
                      </Link>
                      <Link href="/docs/integracje" className="btn btn-sm btn-outline-primary">
                        Jak skonfigurować Senuto?
                      </Link>
                      <Link href="/docs/raporty-pdf" className="btn btn-sm btn-outline-primary">
                        Jak wygenerować raport PDF?
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-4 p-lg-5 bg-light rounded-4 text-center border shadow-sm">
                  <div className="title-sm">
                    <span>POTRZEBUJESZ POMOCY?</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Nie znalazłeś odpowiedzi na swoje pytanie?</h3>
                  <p className="text-muted mb-4">
                    Napisz do nas. Odpowiadamy w 24 godziny w dni robocze. Możesz też wypróbować SiteSpector — wiele rzeczy odkryjesz, eksperymentując z
                    pierwszym audytem.
                  </p>
                  <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
                    <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                      Skontaktuj się z nami
                    </Link>
                    <Link href="/login" className="btn btn-outline-primary px-5 py-3 fw-bold">
                      Rozpocznij darmowy audyt
                    </Link>
                  </div>
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
