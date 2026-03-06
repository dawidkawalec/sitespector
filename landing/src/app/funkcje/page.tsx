import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import type { ComponentType } from 'react';
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiFilePdfLine,
  RiFlashlightLine,
  RiLineChartLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiTeamLine,
  RiTerminalBoxLine,
  RiTimeLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Funkcje — SiteSpector | Audyt SEO, wydajność, widoczność, AI',
  description:
    'Pełna lista funkcji SiteSpector: crawling SEO (Screaming Frog), Lighthouse, Senuto, AI Overviews, backlinki, analiza AI, Execution Plan, raporty PDF, zespoły, harmonogramy.',
  keywords: [
    'funkcje SiteSpector',
    'crawling SEO',
    'Core Web Vitals',
    'Senuto',
    'AI Overviews',
    'Execution Plan',
    'raport PDF',
    'audyt SEO',
  ],
  path: '/funkcje',
  ogImageType: 'page',
});

type Module = {
  id: string;
  label: string;
  title: string;
  description: string;
  tool: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  features: string[];
  image: { src: StaticImageData; alt: string } | null;
  bgClass?: string;
};

const modules: Module[] = [
  {
    id: 'crawling',
    label: 'MODUŁ 1',
    title: 'Crawling SEO',
    description:
      'Silnik Screaming Frog SEO Spider — branżowy standard do analizy struktury strony. Crawler skanuje Twoją stronę dokładnie tak jak Googlebot i zbiera dane o każdej podstronie.',
    tool: 'Screaming Frog SEO Spider (Docker container)',
    icon: RiSearchEyeLine,
    features: [
      'Struktura strony — mapa URL-i, głębokość, status kody (200, 301, 404)',
      'Meta tagi — title, description, robots, canonical (braki, duplikaty, długość)',
      'Nagłówki H1–H6 — hierarchia, brakujące, duplikaty H1',
      'Linki — wewnętrzne, zewnętrzne, broken links, nofollow',
      'Obrazy — brakujące ALT, rozmiary, formaty',
      'Redirecty — 301/302, łańcuchy przekierowań',
      'Duplikaty — duplicate titles, duplicate meta descriptions',
      'Crawl budget — które strony są indeksowane, które zablokowane',
    ],
    image: { src: DashboardWide, alt: 'Podgląd modułu SEO (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'performance',
    label: 'MODUŁ 2',
    title: 'Wydajność i Core Web Vitals',
    description:
      'Oficjalne narzędzie Google — Lighthouse. Analiza desktop i mobile. Core Web Vitals: LCP, INP, CLS. Performance Score, Accessibility i Best Practices.',
    tool: 'Google Lighthouse (Chrome DevTools protocol, Docker)',
    icon: RiFlashlightLine,
    features: [
      'Core Web Vitals — LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift)',
      'Performance Score — 0–100 z breakdown (Speed Index, TBT, TTI)',
      'Mobile-first — osobna analiza dla urządzeń mobilnych',
      'Diagnostyka — opportunities i diagnostics (co blokuje renderowanie, co opóźnia)',
      'Accessibility — kontrast, aria, nazwy elementów',
      'Best Practices — HTTPS, mixed content, podstawy bezpieczeństwa',
    ],
    image: { src: DashboardMetrics, alt: 'Podgląd metryk wydajności (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'visibility',
    label: 'MODUŁ 3',
    title: 'Widoczność w Google',
    description:
      'Integracja z Senuto — dane z polskiego rynku. Pozycje słów kluczowych, trendy, wins/losses i kanibalizacja. Widzisz, jak Twoja strona wypada w wynikach wyszukiwania.',
    tool: 'Senuto API',
    icon: RiLineChartLine,
    features: [
      'Pozycje — ranking dla wybranych słów kluczowych (kraj z konfiguracji)',
      'Trendy — wzrost/spadek pozycji w czasie',
      'Wins i losses — które frazy zyskały, które straciły',
      'Kanibalizacja — nakładające się strony na te same słowa',
      'Visibility score — syntetyczny wskaźnik widoczności',
      'Keyword Explorer — powiązane frazy, volume, trudność',
    ],
    image: { src: DashboardWide, alt: 'Podgląd modułu Visibility (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'ai-overviews',
    label: 'MODUŁ 4',
    title: 'AI Overviews — monitoring odpowiedzi AI',
    description:
      'SiteSpector monitoruje, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google (AI Overviews). Sprawdzasz, czy jesteś widoczny w nowej erze wyszukiwania.',
    tool: 'Senuto (AI Overviews data) + analiza AI (Gemini)',
    icon: RiRobotLine,
    features: [
      'AI Overviews statystyki — ile fraz ma AI Overview i jak często Twoja domena się pojawia',
      'Keyword explorer — które słowa kluczowe generują AI Overviews',
      'Konkurenci — porównanie z konkurencją w AI Overviews',
      'Rekomendacje — jak zwiększyć szansę na pojawienie się w AI',
    ],
    image: { src: DashboardMetrics, alt: 'Podgląd modułu AI Overviews (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'backlinks',
    label: 'MODUŁ 5',
    title: 'Analiza backlinków',
    description:
      'Dane o linkach przychodzących z Senuto. Widzisz, skąd prowadzą linki do Twojej strony, jakie anchory są używane i ile masz referring domains.',
    tool: 'Senuto API',
    icon: RiLineChartLine,
    features: [
      'Referring domains — liczba unikalnych domen linkujących',
      'Backlinks count — łączna liczba linków',
      'Anchory — rozkład tekstów kotwic (branded, exact match, generic)',
      'Top linking pages — strony, które linkują do Ciebie',
      'Toksyczność — wskaźnik ryzyka (jeśli dostępny w Senuto)',
    ],
    image: { src: DashboardWide, alt: 'Podgląd modułu Backlinks (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'ai-analysis',
    label: 'MODUŁ 6',
    title: 'Analiza AI — treść, wydajność, UX, bezpieczeństwo',
    description:
      'Google Gemini przetwarza dane z crawla, Lighthouse i Senuto. Generuje kontekstowe rekomendacje: co poprawić w treści, wydajności, UX i bezpieczeństwie. Dostajesz roadmapę, executive summary i listę quick wins.',
    tool: 'Google Gemini 3.0 Flash (multi-key fallback)',
    icon: RiRobotLine,
    features: [
      'Analiza treści — thin content, duplikaty, jakość, słowa kluczowe',
      'Analiza wydajności — interpretacja metryk Lighthouse, co blokuje LCP',
      'UX Check — dostępność, użyteczność, nawigacja',
      'Security — HTTPS, nagłówki bezpieczeństwa, mixed content',
      'Tech Stack Detection — wykrywanie CMS i frameworków',
      'Per-page analysis — głęboka analiza pojedynczych stron',
      'Cross-tool — korelacje między SEO, performance i visibility',
      'Executive summary i quick wins — podsumowanie i priorytetyzacja',
    ],
    image: { src: DashboardHero, alt: 'Podgląd modułu AI Strategy (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'execution-plan',
    label: 'MODUŁ 7',
    title: 'Execution Plan — zadania z gotowym kodem',
    description:
      'Killer feature SiteSpector. AI nie mówi tylko „popraw meta tagi” — generuje konkretne zadania z priorytetami, tagami (np. quick win) i gotowym kodem do wklejenia. Odznaczasz wykonane i dodajesz notatki.',
    tool: 'Google Gemini (generacja na podstawie analizy)',
    icon: RiTerminalBoxLine,
    features: [
      'Zadania z kodem — np. „Dodaj meta description” + gotowy HTML',
      'Priorytety — krytyczne, wysokie, średnie, niskie',
      'Quick win — tag dla zadań szybkich do wdrożenia',
      'Status — do zrobienia, w toku, gotowe (checkbox)',
      'Notatki — własne uwagi do zadania',
      'Grupowanie — po typie (SEO, Performance, Content) lub priorytecie',
    ],
    image: { src: DashboardWide, alt: 'Podgląd modułu Execution Plan (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'pdf',
    label: 'MODUŁ 8',
    title: 'Raporty PDF',
    description:
      'Profesjonalny raport PDF z 9 sekcjami. Gotowy do wysłania klientowi. White-label z własnym logo i brandingiem.',
    tool: 'Własna generacja (backend)',
    icon: RiFilePdfLine,
    features: [
      '9 sekcji — SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images, AI Strategy, Execution Plan (skrócony)',
      'White-label — własne logo i kolory',
      'Custom branding',
      'Export — jeden plik PDF pobierany z dashboardu',
    ],
    image: { src: DashboardMetrics, alt: 'Podgląd raportu PDF (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'teams',
    label: 'MODUŁ 9',
    title: 'Zespoły i Workspaces',
    description:
      'Wiele projektów i klientów — każdy w osobnym Workspace. Zapraszasz członków zespołu i przydzielasz role. Izolacja danych realizowana jest przez Row Level Security.',
    tool: 'Supabase (auth, RLS)',
    icon: RiTeamLine,
    features: [
      'Workspaces — osobna przestrzeń na projekt/klienta',
      'Role — Właściciel, Admin, Członek',
      'Zaproszenia — e-mail, link',
      'Izolacja — użytkownik widzi tylko swoje workspace’y',
      'Audyty per workspace — lista audytów w danym projekcie',
    ],
    image: { src: DashboardHero, alt: 'Podgląd workspace’ów (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'schedules',
    label: 'MODUŁ 10',
    title: 'Harmonogramy audytów',
    description:
      'Automatyczne uruchamianie audytów w wybranych odstępach. Monitorujesz zmiany w czasie (np. co tydzień lub co miesiąc) i porównujesz wyniki z poprzednimi audytami.',
    tool: 'Własna implementacja (cron, worker)',
    icon: RiTimeLine,
    features: [
      'Planowanie — dziennie, tygodniowo, miesięcznie',
      'Powiadomienia — e-mail po zakończeniu audytu',
      'Historia — porównanie z poprzednimi audytami',
      'Limit — zależny od wybranego pakietu',
    ],
    image: { src: DashboardWide, alt: 'Podgląd harmonogramów (placeholder)' },
    bgClass: 'bg-light',
  },
];

export default function FunkcjePage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/funkcje',
            title: 'Funkcje — SiteSpector | Audyt SEO, wydajność, widoczność, AI',
            description:
              'Pełna lista funkcji SiteSpector: crawling SEO (Screaming Frog), Lighthouse, Senuto, AI Overviews, backlinki, analiza AI, Execution Plan, raporty PDF, zespoły, harmonogramy.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Funkcje', path: '/funkcje' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5" id="top">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>FUNKCJE</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Pełna lista funkcji <span className="text-gradient text-line">SiteSpector</span>
                  </h1>
                </div>
                <p className="text-muted mt-4">
                  Wszystko w jednym miejscu: crawling (Screaming Frog), Core Web Vitals (Lighthouse), widoczność i backlinki (Senuto),
                  AI Overviews oraz Execution Plan z gotowym kodem. Wybierasz URL — reszta dzieje się automatycznie.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary me-2 my-2">
                    Rozpocznij darmowy audyt
                  </Link>
                  <Link href="/jak-to-dziala" className="btn btn-outline-primary my-2">
                    Zobacz jak to działa
                  </Link>
                </div>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <Image src={DashboardHero} alt="Podgląd dashboardu SiteSpector (placeholder)" className="img-fluid rounded-4 shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {modules.map((m, idx) => {
          const Icon = m.icon || RiSearchEyeLine;
          const isImageLeft = idx % 2 === 1;
          return (
            <section key={m.id} className={`section py-5 ${m.bgClass || ''}`} id={m.id}>
              <div className="container">
                <div className="row justify-content-center mb-4">
                  <div className="col-lg-10">
                    <div className="title-sm">
                      <span>{m.label}</span>
                    </div>
                    <div className="main-title mt-3">
                      <h2 className="text-primary">
                        {m.title.split(' — ')[0]}{' '}
                        {m.title.includes(' — ') ? (
                          <span className="text-orange text-line">{m.title.split(' — ')[1]}</span>
                        ) : null}
                      </h2>
                    </div>
                    <p className="text-muted mt-3 mb-0">{m.description}</p>
                  </div>
                </div>

                <div className="row align-items-center g-4 justify-content-center">
                  {m.image && (
                    <div className={`col-lg-5 ${isImageLeft ? 'order-lg-2' : 'order-lg-1'}`}>
                      <div className="p-3 bg-white rounded-4 border shadow-sm">
                        <Image src={m.image.src} alt={m.image.alt} className="img-fluid rounded-3" />
                      </div>
                    </div>
                  )}

                  <div className={`col-lg-${m.image ? '5' : '10'} ${isImageLeft ? 'order-lg-1' : 'order-lg-2'}`}>
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                      <div className="card-body p-0">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                              <Icon size={28} className="text-orange" />
                            </div>
                            <h3 className="h5 text-primary fw-bold mb-0">{m.title}</h3>
                          </div>
                          <span className="badge bg-light text-primary border text-wrap">
                            {m.tool}
                          </span>
                        </div>

                        <div className="row g-3 mt-1">
                          {m.features.map((f, i) => (
                            <div className="col-md-6" key={i}>
                              <div className="d-flex">
                                <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                                <div className="text-muted small lh-lg">{f}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <section className="section py-5 bg-white" id="cta">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>CTA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Gotowy na <span className="text-orange text-line">pełen audyt</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Oferta i szczegóły pakietów są w przygotowaniu. Skontaktuj się z nami, aby dobrać zakres do potrzeb Twojego zespołu.
                </p>
                <div className="mt-4">
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Skontaktuj się z nami
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                  <Link href="/jak-to-dziala" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Zobacz jak to działa
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

