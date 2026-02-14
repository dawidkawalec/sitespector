import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import type { ComponentType } from 'react';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiFilePdfLine,
  RiNumber1,
  RiNumber2,
  RiNumber3,
  RiNumber4,
  RiNumber5,
  RiNumber6,
  RiRobotLine,
  RiSearchLine,
  RiSettings3Line,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Jak to działa — SiteSpector | 3-fazowy audyt w 3 minuty',
  description:
    'Wpisz URL, skonfiguruj audyt i poczekaj. SiteSpector: faza 1 (techniczna), faza 2 (AI), faza 3 (Execution Plan). Wyniki w 1–3 minuty.',
  keywords: ['jak działa SiteSpector', 'audyt SEO krok po kroku', '3 fazy audytu', 'Execution Plan', 'jak zrobić audyt strony'],
  path: '/jak-to-dziala',
  ogImageType: 'page',
});

type Step = {
  id: string;
  number: string;
  title: string;
  description: string;
  bulletsTitle?: string;
  bullets?: string[];
  timeLabel?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  image: { src: StaticImageData; alt: string } | null;
  bgClass?: string;
};

const steps: Step[] = [
  {
    id: 'krok-1',
    number: '1',
    title: 'Wpisz URL i skonfiguruj audyt',
    description:
      'Podaj adres strony, którą chcesz zaudytować. Opcjonalnie dodaj do 3 konkurentów (plan Pro/Enterprise) — porównamy wyniki. Wybierz kraj analizy Senuto (np. Polska), aby dopasować dane widoczności do rynku.',
    bulletsTitle: 'Co konfigurujesz:',
    bullets: ['URL strony docelowej', 'Konkurenci (opcjonalnie, do 3)', 'Kraj Senuto (Polska, Niemcy, UK, itd.)', 'Opcje zaawansowane (limit stron crawla, jeśli dostępne)'],
    icon: RiSettings3Line,
    image: { src: DashboardHero, alt: 'Formularz nowego audytu (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'krok-2',
    number: '2',
    title: 'Faza 1: Analiza techniczna',
    description:
      'SiteSpector równolegle uruchamia kilka silników. Screaming Frog skanuje stronę i zbiera dane o meta tagach, nagłówkach, linkach i obrazach. Lighthouse mierzy wydajność na desktopie i mobile. Senuto pobiera dane o widoczności, backlinkach i AI Overviews. Konkurenci są analizowani analogicznie.',
    timeLabel: 'Czas: ok. 1–2 minuty (zależnie od wielkości strony i obciążenia)',
    bulletsTitle: 'Co jest zbierane:',
    bullets: ['Dane crawla (SEO, struktura, linki, obrazy)', 'Metryki Lighthouse desktop + mobile', 'Dane Senuto (pozycje, visibility, backlinki, AI Overviews)', 'Dane konkurentów (jeśli dodani)'],
    icon: RiSearchLine,
    image: { src: DashboardWide, alt: 'Audyt w toku / równoległe etapy (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'krok-3',
    number: '3',
    title: 'Faza 2: Analiza AI',
    description:
      'Gdy dane techniczne są gotowe, Google Gemini przetwarza je w tle. AI analizuje treść, interpretuje wydajność, ocenia UX i bezpieczeństwo. Generuje rekomendacje, cross-tool korelacje, executive summary oraz listę quick wins. Wykrywa tech stack i (jeśli dostępne) porównuje wyniki z benchmarkiem.',
    timeLabel: 'Czas: wykonywane w tle; postęp widoczny w dashboardzie',
    bulletsTitle: 'Co generuje AI:',
    bullets: ['Analiza treści (Deep Content)', 'Analiza wydajności (interpretacja Lighthouse)', 'UX Check', 'Security Check', 'Tech Stack Detection', 'Benchmark branżowy', 'Executive summary', 'Quick wins', 'Korelacje cross-tool'],
    icon: RiRobotLine,
    image: { src: DashboardMetrics, alt: 'AI Strategy / quick wins (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'krok-4',
    number: '4',
    title: 'Faza 3: Execution Plan',
    description:
      'Na podstawie wszystkich danych AI generuje konkretny plan wykonania. Nie abstrakcyjne „popraw meta tagi”, ale zadania z priorytetami, tagami (np. quick win) i gotowym kodem do wklejenia. Każde zadanie możesz odznaczyć jako wykonane i dodać notatkę.',
    bulletsTitle: 'Co zawiera Execution Plan:',
    bullets: [
      'Zadania pogrupowane po typie (SEO, Performance, Content, UX, Security)',
      'Priorytety (krytyczne → niskie)',
      'Tag „Quick win” przy prostych zadaniach',
      'Bloki kodu (HTML, CSS, JS, schema.org itp.)',
      'Checkboxy do odznaczania + pole na notatki',
    ],
    icon: RiBarChart2Line,
    image: { src: DashboardWide, alt: 'Execution Plan z zadaniami (placeholder)' },
    bgClass: 'bg-light',
  },
  {
    id: 'krok-5',
    number: '5',
    title: 'Przeglądaj wyniki w dashboardzie',
    description:
      'Wszystkie dane są dostępne w jednym miejscu. Zakładki: SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images, AI Strategy, Quick Wins, Deep Content, UX Check, Security, Competitors, Benchmark, Execution Plan, Per-page Analysis. Możesz też eksportować surowe dane (Raw Data) i przygotować widok dla klienta (Client Report).',
    bulletsTitle: 'Zakładki (skrót):',
    bullets: [
      'SEO, Performance, Visibility, AI Overviews, Backlinks',
      'Links, Images, AI Strategy, Quick Wins',
      'Deep Content, UX Check, Security',
      'Competitors, Benchmark, Execution Plan',
      'Per-page Analysis, Client Report, Raw Data',
    ],
    icon: RiNumber5,
    image: { src: DashboardHero, alt: 'Główny dashboard z zakładkami (placeholder)' },
    bgClass: 'bg-white',
  },
  {
    id: 'krok-6',
    number: '6',
    title: 'Pobierz raport PDF i eksportuj dane',
    description:
      'Wygeneruj profesjonalny raport PDF z 9 sekcjami. W planach Pro i Enterprise — white-label z własnym logo. Dane możesz też eksportować (API w Pro/Enterprise) lub udostępnić klientowi przez widok Client Report.',
    bulletsTitle: 'Opcje:',
    bullets: ['Raport PDF (9 sekcji, white-label w Pro+)', 'Client Report — widok uproszczony dla klienta', 'Raw Data — surowe dane crawla i Lighthouse', 'API — programatyczny dostęp (Pro, Enterprise)'],
    icon: RiFilePdfLine,
    image: { src: DashboardMetrics, alt: 'Raport PDF / eksport danych (placeholder)' },
    bgClass: 'bg-light',
  },
];

const stepNumberIconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  '1': RiNumber1,
  '2': RiNumber2,
  '3': RiNumber3,
  '4': RiNumber4,
  '5': RiNumber5,
  '6': RiNumber6,
};

export default function JakToDzialaPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white" id="top">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>JAK TO DZIAŁA</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Jak działa audyt <span className="text-gradient text-line">SiteSpector</span>?
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Trzy fazy. Jedno narzędzie. Wyniki w 1–3 minuty. Od URL do gotowego planu wykonania z kodem.
                </p>
              </div>
            </div>

            <div className="row justify-content-center mt-5">
              <div className="col-lg-10">
                <div className="p-4 p-lg-5 bg-light rounded-4 border shadow-sm">
                  <div className="row g-3 align-items-center text-center text-lg-start">
                    <div className="col-lg-4">
                      <div className="bg-white rounded-4 p-4 h-100 border">
                        <div className="text-orange mb-2">
                          <RiNumber1 size={36} />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Faza techniczna</h3>
                        <p className="text-muted small mt-2 mb-0">Crawl + Core Web Vitals + Senuto</p>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="bg-white rounded-4 p-4 h-100 border">
                        <div className="text-orange mb-2">
                          <RiNumber2 size={36} />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Analiza AI</h3>
                        <p className="text-muted small mt-2 mb-0">Treść, wydajność, UX, security</p>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="bg-white rounded-4 p-4 h-100 border">
                        <div className="text-orange mb-2">
                          <RiNumber3 size={36} />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Execution Plan</h3>
                        <p className="text-muted small mt-2 mb-0">Zadania z priorytetami i kodem</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          const NumberIcon = stepNumberIconMap[s.number] || RiNumber1;
          const isImageLeft = idx % 2 === 1;
          return (
            <section key={s.id} className={`section py-5 ${s.bgClass || ''}`} id={s.id}>
              <div className="container">
                <div className="row justify-content-center mb-4">
                  <div className="col-lg-10">
                    <div className="title-sm">
                      <span>KROK {s.number}</span>
                    </div>
                    <div className="main-title mt-3">
                      <h2 className="text-primary">
                        {s.title.split(':')[0]}
                        {s.title.includes(':') ? (
                          <>
                            : <span className="text-orange text-line">{s.title.split(':')[1].trim()}</span>
                          </>
                        ) : null}
                      </h2>
                    </div>
                    <p className="text-muted mt-3 mb-0">{s.description}</p>
                    {s.timeLabel ? <p className="text-muted small mt-3 mb-0">{s.timeLabel}</p> : null}
                  </div>
                </div>

                <div className="row align-items-center g-4 justify-content-center">
                  {s.image && (
                    <div className={`col-lg-5 ${isImageLeft ? 'order-lg-2' : 'order-lg-1'}`}>
                      <div className="p-3 bg-white rounded-4 border shadow-sm">
                        <Image src={s.image.src} alt={s.image.alt} className="img-fluid rounded-3" />
                      </div>
                    </div>
                  )}

                  <div className={`col-lg-${s.image ? '5' : '10'} ${isImageLeft ? 'order-lg-1' : 'order-lg-2'}`}>
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                      <div className="card-body p-0">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                              <StepIcon size={28} className="text-orange" />
                            </div>
                            <div className="d-flex align-items-center">
                              <NumberIcon size={26} className="text-primary me-2" />
                              <h3 className="h5 text-primary fw-bold mb-0">{s.title}</h3>
                            </div>
                          </div>
                        </div>

                        {s.bulletsTitle ? <div className="text-primary fw-semibold mb-2">{s.bulletsTitle}</div> : null}
                        {s.bullets?.length ? (
                          <div className="row g-3 mt-1">
                            {s.bullets.map((b, i) => (
                              <div className="col-md-6" key={i}>
                                <div className="d-flex">
                                  <RiArrowRightLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                                  <div className="text-muted small lh-lg">{b}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <section className="section py-5 bg-white" id="timeline">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>TIMELINE</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Podsumowanie — <span className="text-orange text-line">3 fazy</span> w 3 minuty
                  </h2>
                </div>
              </div>
            </div>

            <div className="row justify-content-center mt-4">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
                    <div className="bg-white rounded-4 border p-3 flex-grow-1 text-center">
                      <div className="text-primary fw-bold">[0:00]</div>
                      <div className="text-muted small">Uruchomienie</div>
                    </div>
                    <div className="text-orange d-none d-lg-block">
                      <RiArrowRightLine size={28} />
                    </div>
                    <div className="bg-white rounded-4 border p-3 flex-grow-1 text-center">
                      <div className="text-primary fw-bold">[0:30–1:30]</div>
                      <div className="text-muted small">Faza 1 (techniczna)</div>
                    </div>
                    <div className="text-orange d-none d-lg-block">
                      <RiArrowRightLine size={28} />
                    </div>
                    <div className="bg-white rounded-4 border p-3 flex-grow-1 text-center">
                      <div className="text-primary fw-bold">[1:30–2:30]</div>
                      <div className="text-muted small">Faza 2 (AI) + Faza 3 (Execution Plan)</div>
                    </div>
                    <div className="text-orange d-none d-lg-block">
                      <RiArrowRightLine size={28} />
                    </div>
                    <div className="bg-white rounded-4 border p-3 flex-grow-1 text-center">
                      <div className="text-primary fw-bold">[2:30–3:00]</div>
                      <div className="text-muted small">Gotowe</div>
                    </div>
                  </div>
                  <p className="text-muted small mt-4 mb-0">
                    Czasy są orientacyjne i zależą od wielkości strony oraz obciążenia. Najpierw dostajesz dane techniczne, a AI uzupełnia analizę w tle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="cta">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>CTA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Gotowy na <span className="text-orange text-line">pierwszy audyt</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Załóż konto w 30 sekund. Plan Free — 5 audytów miesięcznie, bez karty kredytowej.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy audyt
                  </Link>
                  <Link href="/funkcje" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Zobacz pełną listę funkcji
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

