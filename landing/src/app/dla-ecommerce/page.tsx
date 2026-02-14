import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFlashlightLine,
  RiLineChartLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiShieldCheckLine,
  RiSpeedLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Audyt SEO dla sklepów internetowych | SiteSpector',
  description:
    'Audyt SEO Twojego sklepu w 3 minuty. Wolne strony produktowe, brakujące meta, duplikaty, CLS z bannerów — SiteSpector to sprawdza. Dane z Senuto, Execution Plan z kodem.',
  keywords: ['audyt SEO e-commerce', 'SEO sklep internetowy', 'optymalizacja sklepu', 'Core Web Vitals sklep', 'audyt sklepu online'],
  path: '/dla-ecommerce',
  ogImageType: 'page',
});

const problems = [
  {
    icon: RiSpeedLine,
    title: 'Wolne strony produktowe',
    desc: 'Obrazy bez optymalizacji, ciężkie skrypty. LCP powyżej 4 sekund — Google obniża pozycje, użytkownicy odchodzą.',
  },
  {
    icon: RiErrorWarningLine,
    title: 'Brakujące meta na kategoriach',
    desc: 'Kategorie mają domyślne tytuły albo duplikaty. Setki stron z identycznymi meta — kanibalizacja i marnowany potencjał.',
  },
  {
    icon: RiErrorWarningLine,
    title: 'Zduplikowane tytuły',
    desc: 'Produkty w wielu wariantach (rozmiar, kolor) — ta sama strona, ten sam tytuł. Google nie wie, którą indeksować.',
  },
  {
    icon: RiErrorWarningLine,
    title: 'Obrazy bez ALT',
    desc: 'Galerie produktowe bez opisów alternatywnych. Brak wsparcia dla accessibility i dla Google Images.',
  },
  {
    icon: RiErrorWarningLine,
    title: 'CLS z bannerów i reklam',
    desc: 'Banery ładują się asynchronicznie — strony „skaczą”. Cumulative Layout Shift psuje UX i Core Web Vitals.',
  },
  {
    icon: RiLineChartLine,
    title: 'Kanibalizacja słów kluczowych',
    desc: 'Kilka kategorii lub produktów konkuruje o tę samą frazę. Wzajemnie się osłabiają w rankingu.',
  },
];

const auditBlocks = [
  {
    icon: RiSearchEyeLine,
    title: 'Screaming Frog — struktura i SEO',
    bullets: [
      'Meta tagi na wszystkich stronach (produkty, kategorie, landing pages)',
      'Nagłówki H1 i hierarchia',
      'Linki wewnętrzne + broken links',
      'Obrazy — ALT, rozmiary',
      'Duplikaty tytułów i opisów',
      'Redirecty i canonical',
    ],
  },
  {
    icon: RiFlashlightLine,
    title: 'Lighthouse — wydajność',
    bullets: [
      'Core Web Vitals desktop + mobile',
      'LCP, INP, CLS',
      'Performance Score',
      'Diagnostyka: co blokuje renderowanie i co opóźnia LCP',
    ],
  },
  {
    icon: RiLineChartLine,
    title: 'Senuto — widoczność',
    bullets: [
      'Pozycje słów kluczowych (produkty, kategorie)',
      'Trendy — czy frazy rosną czy spadają',
      'Kanibalizacja — które strony konkurują',
      'Backlinki — skąd linki do sklepu',
    ],
  },
  {
    icon: RiRobotLine,
    title: 'Gemini AI — rekomendacje + Execution Plan',
    bullets: [
      'Analiza treści (thin content na produktach)',
      'UX (nawigacja, filtry)',
      'Bezpieczeństwo',
      'Konkretny plan zadań z gotowym kodem',
    ],
  },
];

const cwvStats = [
  { value: '2,5 s', label: 'Cel LCP', note: 'Im niżej, tym lepiej' },
  { value: '0,1', label: 'Cel CLS', note: 'Stabilny layout = lepsza konwersja' },
  { value: 'Mobile-first', label: 'Priorytet Google', note: 'Liczy się głównie wersja mobilna' },
];

const visibilityBullets = [
  'Ranking słów kluczowych (nazwy produktów, kategorie, frazy długiego ogona)',
  'Trendy — wzrost/spadek w czasie',
  'Wins i losses — które frazy zyskały, które straciły',
  'Kanibalizacja — strony konkurujące o tę samą frazę',
];

const competitorsBullets = [
  'Meta tagi — czy konkurenci mają lepsze opisy?',
  'Core Web Vitals — kto ma szybsze strony?',
  'Visibility — kto rankuje wyżej na kluczowych frazach?',
  'AI Overviews — czy konkurenci pojawiają się w AI, a Ty nie?',
];

const executionExamples = [
  'Meta title i description dla konkretnej strony produktowej',
  'Schema.org Product do wstrzyknięcia',
  'Optymalizacja obrazu (rozmiar, format, lazy load)',
  'Poprawka CLS — konkretna zmiana CSS dla bannera',
];

export default function DlaEcommercePage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white" id="top">
          <div className="container">
            <div className="row align-items-center justify-content-center g-5">
              <div className="col-lg-6">
                <div className="title-sm">
                  <span>E-COMMERCE</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Audyt SEO Twojego sklepu w <span className="text-gradient text-line">3 minuty</span>
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Wolne strony produktowe, brakujące meta tagi, duplikaty, obrazy bez ALT — SiteSpector sprawdza wszystko. Otrzymuj konkretny plan
                  naprawy z gotowym kodem. Dane widoczności z Senuto. Bez skomplikowanych narzędzi.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary me-2 my-2">
                    Audytuj mój sklep za darmo
                  </Link>
                  <Link href="#co-sprawdzamy" className="btn btn-outline-primary my-2">
                    Zobacz co sprawdzamy
                  </Link>
                </div>
                <div className="mt-3 text-muted small">
                  Plan Free: 5 audytów miesięcznie. Wyniki w 1–3 minuty. Bez karty kredytowej.
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Dashboard audytu e-commerce (placeholder)" className="img-fluid rounded-3" />
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">SEO</span>
                    <span className="badge bg-white text-primary border">Performance</span>
                    <span className="badge bg-white text-primary border">Visibility</span>
                    <span className="badge bg-white text-primary border">Execution Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="problemy">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>ZNAJOMY PROBLEM?</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Typowe problemy SEO <span className="text-orange text-line">sklepów online</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Sklepy mają specyficzne wyzwania: setki stron produktowych, kategorie, filtry, dynamiczne treści. Oto, co najczęściej psuje
                  widoczność.
                </p>
              </div>
            </div>

            <div className="row g-4">
              {problems.map((p, i) => {
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

        <section className="section py-5 bg-white" id="co-sprawdzamy">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CO SPRAWDZAMY</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Pełny audyt — technika, wydajność, widoczność, <span className="text-orange text-line">AI</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  SiteSpector łączy Screaming Frog, Lighthouse, Senuto i Google Gemini. Jedno narzędzie zamiast pięciu. Wyniki pogrupowane w logiczne
                  moduły.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Zakładki audytu (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="row g-4">
                  {auditBlocks.map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <div className="col-12" key={i}>
                        <div className="bg-white border rounded-4 p-4 shadow-sm">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-orange-subtle rounded-3 d-inline-flex p-3 me-3">
                              <Icon size={26} className="text-orange" />
                            </div>
                            <div className="text-primary fw-bold">{b.title}</div>
                          </div>
                          <div className="row g-2">
                            {b.bullets.map((t, j) => (
                              <div className="col-md-6" key={j}>
                                <div className="d-flex">
                                  <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                                  <div className="text-muted small lh-lg">{t}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="cwv">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>WYDAJNOŚĆ = KONWERSJE</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Core Web Vitals <span className="text-orange text-line">wpływają</span> na sprzedaż
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Wolna strona to mniej konwersji. SiteSpector mierzy LCP, INP i CLS na desktopie i mobile — dokładnie te metryki, które liczy Google.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Core Web Vitals (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="row g-4">
                  {cwvStats.map((s, i) => (
                    <div className="col-md-4" key={i}>
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm text-center">
                        <div className="text-orange mb-2">
                          <RiFlashlightLine size={26} />
                        </div>
                        <div className="h4 text-primary fw-bold mb-1">{s.value}</div>
                        <div className="text-muted small">{s.label}</div>
                        <div className="text-muted small mt-2">{s.note}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary">
                    Sprawdź swoje Core Web Vitals
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                </div>
                <p className="text-muted small mt-3 mb-0">
                  Uwaga: wartości i wpływ na konwersję zależą od branży i ruchu. Najważniejsze: zmierz, priorytetyzuj i wdrażaj poprawki.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="widocznosc">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>WIDOCZNOŚĆ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Czy Twoje produkty i kategorie są <span className="text-orange text-line">widoczne</span> w Google?
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Senuto pokazuje pozycje dla słów kluczowych z Twojego rynku. Widzisz, które produkty i kategorie rankują, które tracą, które zyskują.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Visibility / Senuto (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiLineChartLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Co zobaczysz w module Visibility</h3>
                    </div>
                    {visibilityBullets.map((t, i) => (
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

        <section className="section py-5 bg-light" id="ai-overviews">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>AI OVERVIEWS</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Czy Google AI pokazuje Twój sklep w <span className="text-orange text-line">odpowiedziach</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  AI Overviews to nowa rzeczywistość wyszukiwania. SiteSpector monitoruje, czy Twoje słowa kluczowe generują AI Overviews i czy Twoja
                  strona się w nich pojawia.
                </p>
              </div>
            </div>

            <div className="row justify-content-center g-4">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                          <RiRobotLine size={26} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Dlaczego to ważne</h3>
                      </div>
                      {[
                        'Coraz więcej zapytań ma odpowiedzi AI',
                        'Brak w AI Overviews = stracone szanse na ruch',
                        'Senuto + SiteSpector — jedyna platforma audytowa z tym modułem',
                      ].map((t, i) => (
                        <div className="d-flex mb-2" key={i}>
                          <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                          <div className="text-muted">{t}</div>
                        </div>
                      ))}
                    </div>
                    <div className="col-lg-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <Image src={DashboardHero} alt="AI Overviews mockup (placeholder)" className="img-fluid rounded-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="konkurencja">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>KONKURENCJA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Benchmark z <span className="text-orange text-line">innymi sklepami</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Dodaj do audytu do 3 konkurentów (plan Pro). SiteSpector porówna Twoją stronę z ich stronami — meta tagi, wydajność, widoczność i AI
                  Overviews.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Competitors view (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiBarChart2Line size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Co porównujesz</h3>
                    </div>
                    {competitorsBullets.map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                    <div className="mt-4 text-muted small">
                      Pro tip: jeśli konkurenci mają lepsze meta opisy i lepsze CWV, masz konkretne hipotezy do wdrożenia, nie „ogólne SEO”.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="weryfikacja-agencji">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                      <RiShieldCheckLine size={26} className="text-orange" />
                    </div>
                    <div>
                      <div className="title-sm">
                        <span>PŁACISZ ZA SEO?</span>
                      </div>
                      <h3 className="text-primary fw-bold mt-2 mb-2">Sprawdź, czy agencja naprawdę pracuje</h3>
                      <p className="text-muted mb-0">
                        Uruchom audyt SiteSpector i porównaj z raportem agencji. Execution Plan z konkretnymi zadaniami i kodem pozwala zapytać:
                        „Dlaczego tego nie zrobiliście?”
                      </p>
                    </div>
                  </div>
                  <Link href="/sprawdz-agencje-seo" className="btn btn-outline-primary px-4 py-3 fw-bold">
                    Sprawdź agencję
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="execution-plan">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>EXECUTION PLAN</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Nie „popraw meta” — ale <span className="text-orange text-line">gotowy kod</span> do wklejenia
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  AI generuje konkretne zadania dla sklepu. Zamiast „dodaj meta description” — dostajesz gotową propozycję dla konkretnego URL-a.
                  Zamiast „optymalizuj obrazy” — dostajesz format, wymiary i wskazówki wdrożenia.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Execution Plan dla e-commerce (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiRobotLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Przykłady zadań dla e-commerce</h3>
                    </div>
                    {executionExamples.map((t, i) => (
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
                    <p className="text-muted small mt-3 mb-0">
                      Idealne do przekazania developerowi lub agencji: priorytety, quick wins, kod i checklista wdrożenia.
                    </p>
                  </div>
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
                    Audytuj swój sklep <span className="text-orange text-line">za darmo</span>
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Plan Free: 5 audytów miesięcznie. Wystarczy, żeby sprawdzić główne strony sklepu. Bez karty kredytowej. Wyniki w 1–3 minuty.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy audyt
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                  <Link href="/jak-to-dziala" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Jak to działa?
                  </Link>
                </div>
                <div className="mt-3">
                  <Link href="/funkcje" className="text-orange text-decoration-none">
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

