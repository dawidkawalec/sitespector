import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiCalendar2Line,
  RiCheckboxCircleLine,
  RiFilePdfLine,
  RiLineChartLine,
  RiLockPasswordLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiShieldCheckLine,
  RiTeamLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Dla Managerów — Monitoruj SEO swojej firmy bez wiedzy technicznej | SiteSpector',
  description:
    'Executive Summary, benchmark branżowy, raporty miesięczne. SiteSpector daje jasność: jeden zdrowy wynik, lista problemów, PDF na prezentację. $29/mc zamiast setek za agencję.',
  keywords: [
    'audyt SEO dla firmy',
    'monitorowanie SEO',
    'executive summary SEO',
    'raport SEO dla managera',
    'sprawdź agencję SEO',
    'SiteSpector manager',
    'kondycja strony',
  ],
  path: '/dla-managerow',
  ogImageType: 'page',
});

const painCards = [
  { icon: RiFilePdfLine, title: 'Raporty agencji = żargon', desc: 'Wykresy, skróty i „branżowe” sformułowania bez jasnej odpowiedzi: czy jest dobrze?' },
  { icon: RiBarChart2Line, title: 'Brak jednego wyniku zdrowia', desc: 'Trzeba czytać dziesiątki stron, żeby zrozumieć ryzyko i priorytety.' },
  { icon: RiSearchEyeLine, title: 'Trudno zweryfikować efekty', desc: 'Nie wiesz, czy wyniki są realne, czy to tylko „ładny raport” co miesiąc.' },
  { icon: RiLineChartLine, title: 'Brak benchmarku', desc: 'Nie wiesz, jak wypadasz na tle rynku i czy problem jest „u Ciebie”, czy wszędzie.' },
  { icon: RiFilePdfLine, title: 'Prezentacja dla zarządu', desc: 'Brakuje prostego, profesjonalnego materiału: executive summary + PDF do pokazania.' },
];

const execStrengths = ['Dobra widoczność w Google (trend rosnący)', 'Bezpieczne HTTPS bez krytycznych błędów', 'Stabilna struktura strony (brak masowych 404)'];
const execCritical = ['12 stron bez meta description', 'Wolne LCP na stronie głównej', 'Duplikaty tytułów w kluczowych kategoriach'];

const quickWins = ['Dodaj 5 brakujących ALT na kluczowych stronach (15–30 min)', 'Skróć zbyt długie meta descriptions na top stronach', 'Napraw 3 broken linki w menu/kategoriach'];

export default function DlaManagerowPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/dla-managerow',
            title: 'Dla Managerów — Monitoruj SEO swojej firmy bez wiedzy technicznej | SiteSpector',
            description:
              'Executive Summary, benchmark branżowy, raporty miesięczne. SiteSpector daje jasność: jeden zdrowy wynik, lista problemów, PDF na prezentację. $29/mc zamiast setek za agencję.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Dla managerów', path: '/dla-managerow' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white" id="top">
          <div className="container">
            <div className="row align-items-center justify-content-center g-5">
              <div className="col-lg-6">
                <div className="title-sm">
                  <span>DLA MENEDŻERÓW I CEO</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Monitoruj kondycję <span className="text-gradient text-line">SEO swojej firmy</span> bez wiedzy technicznej
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Wiesz, że SEO ma znaczenie. Ale raporty agencji są pełne żargonu. Nie wiesz, czy strona jest zdrowa i czy płacisz za efekty.
                  SiteSpector daje jeden wynik: co działa, co wymaga pilnej uwagi i jak wypadasz na tle branży.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary me-2 my-2">
                    Sprawdź kondycję za darmo
                  </Link>
                  <Link href="#executive-summary" className="btn btn-outline-primary my-2">
                    Zobacz Executive Summary
                  </Link>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Executive Summary (placeholder)" className="img-fluid rounded-3" />
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">Health score</span>
                    <span className="badge bg-white text-primary border">Mocne strony</span>
                    <span className="badge bg-white text-primary border">Krytyczne problemy</span>
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
                  <span>TWOJA SYTUACJA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    SEO ma znaczenie — ale <span className="text-orange text-line">nie wiesz</span>, jak wygląda Twoja strona
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Płacisz agencji miesięcznie. Dostajesz raporty pełne skrótów (LCP, CLS, crawl budget). Nie masz czasu na studia techniczne.
                  Chcesz wiedzieć: czy strona jest zdrowa, czy agencja robi dobrą robotę i czy warto inwestować dalej.
                </p>
              </div>
            </div>

            <div className="row g-4">
              {painCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={i}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hover-lift transition-all">
                      <div className="card-body p-0">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 mb-3">
                          <Icon size={28} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold">{c.title}</h3>
                        <p className="text-muted mb-0">{c.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="executive-summary">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>JEDNA STRONA, ZERO ŻARGONU</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Executive Summary — zdrowie, mocne strony, <span className="text-orange text-line">krytyczne problemy</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Jedna strona. Wynik zdrowia (np. 78/100). Lista mocnych stron i krytycznych problemów z priorytetem. Czytelne dla CEO i zarządu.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm text-center">
                  <div className="text-muted small">Health score</div>
                  <div className="display-4 fw-bold text-primary mb-2">78/100</div>
                  <div className="text-orange fw-semibold">Stabilnie, ale są szybkie poprawki</div>
                  <div className="mt-4 d-flex justify-content-center gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">SEO</span>
                    <span className="badge bg-white text-primary border">Wydajność</span>
                    <span className="badge bg-white text-primary border">Widoczność</span>
                    <span className="badge bg-white text-primary border">Bezpieczeństwo</span>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="text-primary fw-bold mb-2">Mocne strony</div>
                        {execStrengths.map((t, i) => (
                          <div className="d-flex mb-2" key={i}>
                            <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                            <div className="text-muted small lh-lg">{t}</div>
                          </div>
                        ))}
                      </div>
                      <div className="col-md-6">
                        <div className="text-primary fw-bold mb-2">Krytyczne problemy</div>
                        {execCritical.map((t, i) => (
                          <div className="d-flex mb-2" key={i}>
                            <RiShieldCheckLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                            <div className="text-muted small lh-lg">{t}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 bg-light rounded-4 border p-3">
                      <div className="text-primary fw-bold">Rekomendacja</div>
                      <div className="text-muted small mt-1">Zrób quick wins w tym tygodniu, a potem uruchom harmonogram miesięczny, żeby mierzyć trend.</div>
                    </div>
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
                    Benchmark branżowy — jak wypadasz na tle <span className="text-orange text-line">konkurencji</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Jedna liczba: np. 78% vs średnia branży. Wiesz, czy jest dobrze, czy trzeba działać.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                      <div className="text-primary fw-bold mb-2">Benchmark</div>
                      <div className="display-5 fw-bold text-primary">78%</div>
                      <div className="text-muted">vs średnia branży: 64%</div>
                      <div className="mt-3 text-orange fw-semibold">Powyżej standardu, ale masz szybkie ROI w Quick Wins</div>
                    </div>
                    <div className="col-lg-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <Image src={DashboardMetrics} alt="Benchmark (placeholder)" className="img-fluid rounded-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="harmonogramy">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>AUTOMATYCZNE RAPORTY</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Harmonogramy — miesięczne raporty <span className="text-orange text-line">bez ręcznej pracy</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Ustaw audyt raz (np. co miesiąc). SiteSpector uruchomi go automatycznie, powiadomi e-mailem i przygotuje raport PDF — gotowy do pobrania.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-start">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiCalendar2Line size={26} className="text-orange" />
                    </div>
                    <div>
                      <div className="text-primary fw-bold">Miesięczny rytm</div>
                      <div className="text-muted mt-1">
                        Idealne do monitorowania trendu i prezentacji dla zarządu: co się poprawia, co się pogarsza i co robimy w kolejnym miesiącu.
                      </div>
                      <div className="mt-3">
                        <Link href="/login" className="btn btn-primary">
                          Ustaw pierwszy audyt
                          <RiArrowRightLine className="ms-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="pdf">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>RAPORT DLA ZARZĄDU</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    9 sekcji — profesjonalny PDF na <span className="text-orange text-line">spotkanie</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Raport PDF wygląda profesjonalnie i nadaje się do prezentacji. Jedno kliknięcie i masz materiał dla zespołu marketingu lub zarządu.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="PDF report cover (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiFilePdfLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Co zawiera PDF</h3>
                    </div>
                    {['SEO', 'Wydajność', 'Widoczność', 'AI Overviews', 'Backlinki', 'Linki/obrazy', 'AI Strategy', 'Execution Plan'].map((t, i) => (
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

        <section className="section py-5 bg-white" id="verify-agency">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm d-flex flex-column flex-lg-row justify-content-between gap-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiSearchEyeLine size={26} className="text-orange" />
                    </div>
                    <div>
                      <div className="title-sm">
                        <span>SPÓJRZ POD MASKĘ</span>
                      </div>
                      <h3 className="text-primary fw-bold mt-2 mb-2">Zweryfikuj agencję — uruchom audyt sam i porównaj</h3>
                      <p className="text-muted mb-0">
                        Uruchom audyt SiteSpector samodzielnie i porównaj z raportem agencji. Zobaczysz pełny obraz: SEO, wydajność, widoczność i błędy
                        techniczne — nie tylko to, co agencja chce pokazać.
                      </p>
                    </div>
                  </div>
                  <div className="align-self-start align-self-lg-center">
                    <Link href="/login" className="btn btn-primary px-4 py-3 fw-bold">
                      Sprawdź stronę za darmo
                      <RiArrowRightLine className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="trends">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>WIDOCZNOŚĆ W CZASIE</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Trendy widoczności — czy idzie w górę czy <span className="text-orange text-line">w dół</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Jednym rzutem oka widzisz, czy widoczność rośnie, czy tracisz grunt. Dane w jednym panelu.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Trendy widoczności (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="ai-overviews">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>NOWA ERA WYSZUKIWANIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    AI Overviews — czy Twoja firma pojawia się w odpowiedziach <span className="text-orange text-line">AI</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  SiteSpector monitoruje, które Twoje słowa kluczowe mają AI Overview i czy Twoja strona się tam pojawia. To realny kanał ruchu, który
                  szybko rośnie.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-start">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiRobotLine size={26} className="text-orange" />
                    </div>
                    <div>
                      <div className="text-primary fw-bold">Jednym rzutem oka</div>
                      <div className="text-muted mt-1">
                        Widzisz, czy Twoje frazy pojawiają się w AI Overviews oraz czy konkurencja ma przewagę. Bez dodatkowych narzędzi — wszystko w jednym
                        dashboardzie.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="quick-wins">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CO ZROBIĆ NAJPIERW</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Quick Wins — priorytetyzowana lista dla Twojego <span className="text-orange text-line">zespołu</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">AI wyciąga zadania o najwyższym ROI przy najmniejszym wysiłku. Idealne do delegowania.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4">
                    {quickWins.map((t, i) => (
                      <div className="col-md-4" key={i}>
                        <div className="bg-light rounded-4 border p-4 h-100">
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

        <section className="section py-5 bg-white" id="execution-plan">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ZADANIA Z KODEM</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Execution Plan — przekaż developerom gotowe zadania z <span className="text-orange text-line">kodem</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Nie tylko „popraw meta tagi” — konkretne zadania z gotowym kodem HTML/Schema. Delegujesz i zespół wie, co zrobić bez zgadywania.
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
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiCheckboxCircleLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Co dostaje zespół</h3>
                    </div>
                    {['Priorytety i quick wins', 'Konkretne URL-e i zadania', 'Bloki kodu do wklejenia', 'Status + notatki'].map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                    <div className="mt-4">
                      <Link href="/login" className="btn btn-primary">
                        Zobacz Execution Plan
                        <RiArrowRightLine className="ms-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="security">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>BEZPIECZEŃSTWO STRONY</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Sprawdź bezpieczeństwo — SSL, nagłówki, <span className="text-orange text-line">mixed content</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Jedna zakładka — jasna odpowiedź: wszystko OK lub lista do naprawy.</p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="d-flex">
                        <RiShieldCheckLine className="text-orange flex-shrink-0 me-2 mt-1" size={20} />
                        <div className="text-muted">SSL/TLS i certyfikat</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex">
                        <RiLockPasswordLine className="text-orange flex-shrink-0 me-2 mt-1" size={20} />
                        <div className="text-muted">Nagłówki bezpieczeństwa</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex">
                        <RiShieldCheckLine className="text-orange flex-shrink-0 me-2 mt-1" size={20} />
                        <div className="text-muted">Mixed content (http/https)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="team">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ZAPROŚ ZESPÓŁ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Workspace’y i role — zaproś zespół <span className="text-orange text-line">marketingu</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Zaproś szefa marketingu, specjalistę SEO lub asystenta. Każdy widzi ten sam audyt i raport — bez rozsyłania plików.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-start">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiTeamLine size={26} className="text-orange" />
                    </div>
                    <div>
                      <div className="text-primary fw-bold">Dostęp per rola</div>
                      <div className="text-muted mt-1">Właściciel / Admin / Członek — proste zarządzanie dostępami w ramach workspace.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="koszt">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>UŁAMEK KOSZTÓW AGENCJI</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    $29/mc — ułamek tego, co płacisz <span className="text-orange text-line">agencji</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Plan Pro: $29 miesięcznie. Pełna analiza, 50 audytów, Senuto, benchmark, Executive Summary, PDF i harmonogramy. Transparentność za ułamek
                  kosztu agencji.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4">
                  <div>
                    <div className="text-primary fw-bold">Pro $29/mc</div>
                    <div className="text-muted mt-1">Wystarczy, żeby mieć stały monitoring i niezależną weryfikację pracy agencji.</div>
                  </div>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Zacznij od Free — 5 audytów za $0
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="cta">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>CTA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Sprawdź kondycję swojej strony — <span className="text-orange text-line">za darmo</span>
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Plan Free: 5 audytów miesięcznie. Bez karty kredytowej. Executive Summary, benchmark i PDF. Zobacz, jak wygląda Twoja strona w 3 minuty.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy audyt
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

