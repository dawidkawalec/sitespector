import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiCalendar2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFilePdfLine,
  RiLineChartLine,
  RiRobotLine,
  RiTeamLine,
  RiTimerLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Dla Agencji SEO — Jeden panel dla wszystkich klientów | SiteSpector',
  description:
    'SiteSpector dla agencji: workspace per klient, raporty PDF white-label, harmonogramy audytów, Execution Plan z kodem. Zastąp SF+Ahrefs+PageSpeed za $29/mc zamiast $300+/mc.',
  keywords: [
    'agencja SEO',
    'audyt SEO agencja',
    'narzędzie dla agencji SEO',
    'raport PDF white-label',
    'workspace SEO',
    'SiteSpector agencja',
  ],
  path: '/dla-agencji-seo',
  ogImageType: 'page',
});

const painPoints = [
  { icon: RiErrorWarningLine, title: 'Licencje per użytkownik', desc: 'Oddzielna licencja Screaming Frog na osobę i kolejne koszty per seat.' },
  { icon: RiLineChartLine, title: 'Subskrypcje SEO $$', desc: 'Ahrefs/Senuto to stałe koszty miesięczne, które rosną wraz z portfolio.' },
  { icon: RiTimerLine, title: 'Ręczne raporty PDF', desc: 'Godziny na kopiowanie danych, formatowanie i wysyłkę do klienta.' },
  { icon: RiRobotLine, title: 'Brak konkretów', desc: 'Klient dostaje „popraw meta”, ale bez listy zadań i kodu do wdrożenia.' },
  { icon: RiBarChart2Line, title: 'Brak AI Overviews', desc: 'Monitoring odpowiedzi AI w wyszukiwarce to nowy kanał — większość narzędzi tego nie ma.' },
];

const costRows = [
  { tool: 'Screaming Frog', cost: '259 GBP/rok (~$330)', value: 'Crawling w cenie' },
  { tool: 'Ahrefs / Senuto', cost: '$129/mc', value: 'Senuto w planie Pro' },
  { tool: 'PageSpeed / Lighthouse', cost: 'Ręcznie / osobne', value: 'Desktop + Mobile w audycie' },
  { tool: 'ChatGPT / AI', cost: 'Osobna subskrypcja', value: 'Gemini AI w cenie' },
  { tool: 'Raporty PDF', cost: 'Godziny pracy', value: 'Generacja 1 klik' },
];

const workspaceBullets = [
  'Izolacja — Row Level Security, każdy workspace oddzielony',
  'Role — Właściciel, Admin, Członek (per workspace)',
  'Zaproszenia — e-mail i link z zaproszeniem',
  'Audyty per workspace — historia audytów tylko dla danego klienta',
];

const pdfSections = [
  'SEO (meta, nagłówki, linki)',
  'Wydajność (Core Web Vitals)',
  'Widoczność (Senuto)',
  'AI Overviews',
  'Backlinki',
  'Linki i obrazy',
  'AI Strategy (roadmapa, executive summary)',
  'Execution Plan (skrócony)',
];

const scheduleBullets = [
  'Codziennie — np. dla sklepów z szybko zmieniającą się ofertą',
  'Co tydzień — standardowy monitoring',
  'Co miesiąc — raporty miesięczne dla klienta',
];

const executionPlanBullets = [
  'Zadania z gotowym kodem (HTML, Schema.org, meta)',
  'Priorytety (krytyczne, wysokie, średnie)',
  'Tag „quick win” — najszybsze do wdrożenia',
  'Checkboxy — odznacz wykonane, dodaj notatki',
];

const aiStrategyBullets = [
  'Cross-tool — korelacje między SEO, performance i visibility',
  'Roadmapa — priorytetyzowana lista działań',
  'Executive summary — jedna strona, zero żargonu (idealne na prezentację)',
];

const quickWinsExamples = [
  'Dodaj 5 brakujących ALT na stronach produktowych (15 minut pracy)',
  'Popraw duplikujące się tytuły kategorii (szybki wzrost CTR)',
  'Usuń ciężki skrypt blokujący renderowanie (lepsze LCP i konwersje)',
];

export default function DlaAgencjiSeoPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white" id="top">
          <div className="container">
            <div className="row align-items-center justify-content-center g-5">
              <div className="col-lg-6">
                <div className="title-sm">
                  <span>DLA AGENCJI SEO</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Jeden panel dla <span className="text-gradient text-line">wszystkich klientów</span>
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Przestań płacić za pięć narzędzi i tracić godziny na raporty. SiteSpector łączy Screaming Frog, Lighthouse, Senuto i AI — jeden
                  dashboard, 50 audytów miesięcznie, raporty PDF gotowe do wysłania.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary me-2 my-2">
                    Rozpocznij darmowy trial
                  </Link>
                  <Link href="#koszty" className="btn btn-outline-primary my-2">
                    Zobacz porównanie kosztów
                  </Link>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Lista workspace'ów klientów (placeholder)" className="img-fluid rounded-3" />
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">Workspace: Klient A</span>
                    <span className="badge bg-white text-primary border">Klient B</span>
                    <span className="badge bg-white text-primary border">Klient C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="problem">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CODZIENNOŚĆ AGENCJI</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Znasz to: <span className="text-orange text-line">3–5 narzędzi</span> i godziny pracy nad raportem
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Większość agencji łączy Screaming Frog, Senuto/Ahrefs, PageSpeed (ręcznie) i AI osobno. Każdy klient to inna konfiguracja. Raporty
                  PDF robisz ręcznie — kopiujesz dane, formatujesz, wysyłasz. To kosztuje czas i pieniądze.
                </p>
              </div>
            </div>

            <div className="row g-4">
              {painPoints.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={i}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hover-lift transition-all">
                      <div className="card-body p-0">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 mb-3">
                          <Icon size={28} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold">{p.title}</h3>
                        <p className="text-muted mb-0">{p.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="koszty">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ILE NAPRAWDĘ PŁACISZ?</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    $300–500+/mc vs SiteSpector <span className="text-orange text-line">$29/mc</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Zsumuj swoje narzędzia. SiteSpector zastępuje je jednym panelem.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-11">
                <div className="bg-light border rounded-4 overflow-hidden shadow-sm">
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                      <thead className="bg-white">
                        <tr>
                          <th className="p-4 border-0">Narzędzie</th>
                          <th className="p-4 border-0">Typowy koszt</th>
                          <th className="p-4 border-0 text-orange">Co daje SiteSpector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costRows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-4 border-top fw-semibold text-primary">{r.tool}</td>
                            <td className="p-4 border-top text-muted">{r.cost}</td>
                            <td className="p-4 border-top text-muted">{r.value}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="p-4 border-top fw-bold text-primary">Podsumowanie</td>
                          <td className="p-4 border-top fw-bold text-muted">$300–500+/mc</td>
                          <td className="p-4 border-top fw-bold text-orange">$29/mc (Pro)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Przetestuj Free — 5 audytów za $0
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                </div>
                <p className="text-muted small text-center mt-3 mb-0">
                  Pro: 50 audytów/mc, Senuto, 3 konkurentów, harmonogramy, white-label PDF, Execution Plan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="workspace">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>IZOLACJA DANYCH</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Workspace na <span className="text-orange text-line">każdego klienta</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Każdy klient w osobnej przestrzeni. Zapraszaj członków zespołu, przydzielaj role. Dane jednego klienta nigdy nie mieszają się z
                  drugim.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Workspace i role (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiTeamLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Funkcje Workspace</h3>
                    </div>
                    {workspaceBullets.map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="pdf">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>RAPORTY GOTOWE DO WYSŁANIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    9 sekcji, white-label — wyślij w <span className="text-orange text-line">1 klik</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Profesjonalny raport PDF z SEO, Performance, Visibility, AI Overviews, Backlinks, Links, Images, AI Strategy i Execution Plan. W planie
                  Pro i Enterprise — własne logo i branding.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Podgląd PDF (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiFilePdfLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Sekcje raportu</h3>
                    </div>
                    <div className="row g-2">
                      {pdfSections.map((t, i) => (
                        <div className="col-md-6" key={i}>
                          <div className="d-flex">
                            <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                            <div className="text-muted small lh-lg">{t}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted small mt-3 mb-0">CTA do demo PDF podmienimy, gdy bedzie gotowy screenshot/plik.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="harmonogramy">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>AUTOMATYZACJA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Harmonogramy — audyty codziennie, co tydzień lub <span className="text-orange text-line">co miesiąc</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Ustaw harmonogram per klient. SiteSpector uruchomi audyt automatycznie i powiadomi Cię e-mailem. Monitoruj zmiany w czasie bez ręcznego
                  uruchamiania.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Konfiguracja harmonogramu (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiCalendar2Line size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Opcje harmonogramu</h3>
                    </div>
                    {scheduleBullets.map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="execution-plan">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>NIE TYLKO „POPRAW SEO”</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Execution Plan — daj klientowi konkretne zadania z <span className="text-orange text-line">kodem</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Klienci nie wiedzą, jak „poprawić meta tagi”. Execution Plan generuje gotowe zadania i fragmenty kodu do wdrożenia. Priorytety, quick
                  wins i status do odznaczania.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Execution Plan (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    {executionPlanBullets.map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                    <div className="mt-4 d-flex gap-2 flex-wrap">
                      <Link href="/login" className="btn btn-primary">
                        Zobacz Execution Plan
                        <RiArrowRightLine className="ms-2" />
                      </Link>
                      <Link href="/jak-to-dziala" className="btn btn-outline-primary">
                        Zobacz jak to działa
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="ai-strategy">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ANALIZA STRATEGICZNA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    AI Strategy — cross-tool, roadmapa, <span className="text-orange text-line">executive summary</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Jedna zakładka — pełny obraz. Idealne do raportów i prezentacji dla klienta.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                          <RiRobotLine size={26} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Co dostajesz</h3>
                      </div>
                      {aiStrategyBullets.map((t, i) => (
                        <div className="d-flex mb-2" key={i}>
                          <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                          <div className="text-muted">{t}</div>
                        </div>
                      ))}
                    </div>
                    <div className="col-lg-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <Image src={DashboardMetrics} alt="AI Strategy (placeholder)" className="img-fluid rounded-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="quick-wins">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>SZYBKIE ZWROTY</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Quick Wins — pokaż klientowi, co naprawić <span className="text-orange text-line">najpierw</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">AI identyfikuje zadania z najwyższym ROI przy najmniejszym wysiłku.</p>
              </div>
            </div>

            <div className="row justify-content-center g-4">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4">
                    {quickWinsExamples.map((t, i) => (
                      <div className="col-md-4" key={i}>
                        <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                          <div className="text-orange mb-2">
                            <RiCheckboxCircleLine size={24} />
                          </div>
                          <div className="text-primary fw-bold">Quick win #{i + 1}</div>
                          <div className="text-muted small mt-2">{t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="benchmark">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>PORÓWNANIE Z RYNKIEM</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Benchmark — porównaj klienta ze <span className="text-orange text-line">standardami branży</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Performance, SEO, widoczność — czytelny kontekst do raportu i prezentacji.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Benchmark view (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="case-study">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CASE STUDY</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Jak Agencja WebPro zredukowała koszty narzędzi o <span className="text-orange text-line">80%</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  „SiteSpector zastąpił nam trzy narzędzia. Execution Plan z kodem to killer feature — klienci dostają nie tylko raport, ale gotowe zadania
                  do wdrożenia. Oszczędzamy kilkadziesiąt godzin miesięcznie.”
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <Link href="/case-study" className="btn btn-outline-primary px-5 py-3 fw-bold">
                  Zobacz case studies
                  <RiArrowRightLine className="ms-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="cta">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>CTA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Gotowy na jeden panel zamiast <span className="text-orange text-line">pięciu narzędzi</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Zacznij od planu Free — 5 audytów miesięcznie, bez karty kredytowej. Przejdź na Pro, gdy będziesz gotowy.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy trial
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

