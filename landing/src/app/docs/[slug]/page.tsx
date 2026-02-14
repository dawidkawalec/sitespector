import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiArrowLeftLine, RiBookOpenLine } from 'react-icons/ri';

type DocPage = {
  slug: string;
  title: string;
  description: string;
  bullets: string[];
};

const DOC_PAGES: DocPage[] = [
  {
    slug: 'jak-zaczac',
    title: 'Jak zacząć',
    description: 'Pierwszy audyt krok po kroku, konfiguracja Senuto i różnice między planami.',
    bullets: ['Rejestracja i pierwsze logowanie', 'Uruchomienie pierwszego audytu', 'Konfiguracja Senuto (kraj analizy)', 'Plan Free vs Pro — limity i funkcje'],
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
    description: 'Generowanie raportu, 9 sekcji i white-label w planach Pro/Enterprise.',
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
    description: 'Plany, Stripe, faktury oraz zmiana/anulowanie subskrypcji.',
    bullets: ['Free, Pro, Enterprise', 'Stripe — płatność i faktury', 'Customer Portal', 'Limity audytów'],
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

function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find(p => p.slug === slug);
}

export function generateStaticParams() {
  return DOC_PAGES.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return { title: 'Dokumentacja — SiteSpector' };

  return {
    title: `${page.title} — Dokumentacja | SiteSpector`,
    description: page.description,
  };
}

export default async function DocsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <Link href="/docs" className="btn btn-sm btn-outline-primary mb-4">
                  <RiArrowLeftLine className="me-1" />
                  Wróć do kategorii
                </Link>

                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-orange-subtle rounded-circle d-inline-flex p-3">
                    <RiBookOpenLine size={22} className="text-orange" />
                  </div>
                  <h1 className="h2 text-primary fw-bold mb-0">{page.title}</h1>
                </div>

                <p className="text-muted lead">{page.description}</p>

                <div className="bg-light rounded-4 border p-4 mt-4">
                  <div className="text-primary fw-bold mb-2">Tematy w tej sekcji</div>
                  <div className="text-muted">
                    {page.bullets.map(b => (
                      <div key={b}>• {b}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-4 border p-4 mt-4 shadow-sm">
                  <div className="text-primary fw-bold mb-2">W przygotowaniu</div>
                  <div className="text-muted">
                    Ta dokumentacja jest rozwijana iteracyjnie. Jeśli potrzebujesz pomocy już teraz, napisz do nas lub uruchom pierwszy audyt i zobacz wyniki w panelu.
                  </div>
                  <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                    <Link href="/kontakt" className="btn btn-primary px-4 py-3 fw-bold">
                      Skontaktuj się z nami
                    </Link>
                    <Link href="/login" className="btn btn-outline-primary px-4 py-3 fw-bold">
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

