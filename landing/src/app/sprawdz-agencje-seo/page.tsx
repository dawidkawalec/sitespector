import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiFileChartLine,
  RiFilePdfLine,
  RiLineChartLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiTimerLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Sprawdź agencję SEO — Czy Twoja agencja naprawdę działa? | SiteSpector',
  description:
    'Płacisz agencji SEO tysiące miesięcznie, a wyniki stoją w miejscu? Uruchom darmowy audyt SiteSpector i porównaj z raportem agencji. Zobacz, co jest nie tak.',
  keywords: ['sprawdzenie agencji SEO', 'weryfikacja agencji', 'audyt SEO agencji', 'czy agencja SEO działa', 'zweryfikuj agencję'],
  path: '/sprawdz-agencje-seo',
  ogImageType: 'page',
});

const painCards = [
  {
    icon: RiFileChartLine,
    title: 'Płacisz tysiące, widzisz mgliste raporty',
    desc: 'Agencja wysyła raporty pełne wykresów i słów. „Wzrost widoczności o 3%.” Co to oznacza? Które strony? Co konkretnie zostało zrobione?',
  },
  {
    icon: RiLineChartLine,
    title: 'Pozycje stoją w miejscu — lub spadają',
    desc: 'Minęły miesiące, a Twoja strona nadal na 5. stronie Google. Agencja obiecuje „długoterminowe efekty”. Tymczasem konkurencja rośnie.',
  },
  {
    icon: RiSearchEyeLine,
    title: 'Nie wiesz, co agencja faktycznie robi',
    desc: 'Czy poprawiają meta tagi? Budują linki? Optymalizują szybkość? Raporty mówią „wykonaliśmy audyt” — ale co z niego wynika?',
  },
  {
    icon: RiErrorWarningLine,
    title: 'Brak konkretów',
    desc: '„Poprawimy widoczność.” „Zoptymalizujemy treści.” Ale jak? Które strony? Jaki kod? Bez szczegółów nie możesz zweryfikować.',
  },
];

const verifySteps = [
  {
    icon: RiTimerLine,
    title: 'Załóż darmowe konto SiteSpector',
    desc: 'Plan Free — 5 audytów miesięcznie, bez karty kredytowej. 30 sekund rejestracji.',
  },
  {
    icon: RiSearchEyeLine,
    title: 'Uruchom audyt swojej strony',
    desc: 'Wpisz URL, poczekaj 1–3 minuty. SiteSpector przeanalizuje technikę, wydajność, widoczność, AI Overviews i wygeneruje Execution Plan.',
  },
  {
    icon: RiFileChartLine,
    title: 'Porównaj z raportem agencji',
    desc: 'Sprawdź: czy agencja mówi o tych samych problemach? Czy coś przeoczyła? Czy Execution Plan zawiera zadania, które agencja mogła zrobić, a nie zrobiła?',
  },
];

const checklist = [
  {
    title: 'Brakujące meta tagi',
    desc: 'Czy strony produktowe mają tytuły i opisy? Są duplikaty? Są za długie?',
  },
  {
    title: 'Wolna strona',
    desc: 'Core Web Vitals (LCP, CLS). Google karze wolne strony. Czy agencja w ogóle to mierzy?',
  },
  {
    title: 'Spadająca widoczność',
    desc: 'Senuto pokaże trendy. Czy Twoje słowa kluczowe tracą pozycje? Agencja o tym wspomina?',
  },
  {
    title: 'Brak backlinków',
    desc: 'Masz 5 referring domains od 2 lat? Agencja „buduje linki” — gdzie efekty?',
  },
  {
    title: 'AI Overviews',
    desc: 'Czy Twoje frazy pojawiają się w odpowiedziach AI Google? Nowa era wyszukiwania — agencja o tym wie?',
  },
  {
    title: 'Błędy techniczne',
    desc: 'Zduplikowane nagłówki H1, broken links, obrazy bez ALT. Czy to jest w raporcie agencji?',
  },
];

const redFlags = [
  'Raport agencji nie wspomina o problemach, które SiteSpector znalazł (puste meta tagi, wolna strona, błędy techniczne).',
  'Agencja nie mierzy Core Web Vitals (LCP/INP/CLS) — to podstawowa metryka od lat.',
  'Brak konkretnego planu: „będziemy optymalizować” bez listy zadań, stron i terminów.',
  'Widoczność spada, a agencja milczy — brak rozmowy o trendach i wins/losses.',
  'Nie ma danych o backlinkach — brak monitoringu linków = brak strategii link buildingu.',
  'Raport wygląda jak szablon — te same wykresy, brak spersonalizowanych rekomendacji.',
];

const reportSections = [
  { title: 'SEO', desc: 'Meta tagi, nagłówki, linki, obrazy, błędy crawla' },
  { title: 'Performance', desc: 'Core Web Vitals, LCP, INP, CLS, Performance Score' },
  { title: 'Visibility', desc: 'Pozycje, trendy, wins/losses (Senuto)' },
  { title: 'AI Overviews', desc: 'Czy Twoje frazy pojawiają się w AI' },
  { title: 'Backlinks', desc: 'Referring domains, anchory (Senuto)' },
  { title: 'Links', desc: 'Wewnętrzne, zewnętrzne, broken links' },
  { title: 'Images', desc: 'ALT, rozmiary, optymalizacja' },
  { title: 'AI Strategy', desc: 'Executive summary, quick wins, roadmapa' },
  { title: 'Execution Plan', desc: 'Konkretne zadania z gotowym kodem' },
];

export default function SprawdzAgencjeSeoPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/sprawdz-agencje-seo',
            title: 'Sprawdź agencję SEO — Czy Twoja agencja naprawdę działa? | SiteSpector',
            description:
              'Płacisz agencji SEO tysiące miesięcznie, a wyniki stoją w miejscu? Uruchom darmowy audyt SiteSpector i porównaj z raportem agencji. Zobacz, co jest nie tak.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Sprawdź agencję SEO', path: '/sprawdz-agencje-seo' },
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
                  <span>WERYFIKACJA SEO</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Płacisz agencji SEO. <span className="text-gradient text-line">Czy na pewno</span> dostajesz wyniki?
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Tysiące złotych miesięcznie za raporty, które niewiele mówią. Pozycje stoją w miejscu. Nie wiesz, co agencja właściwie robi.
                  SiteSpector pozwala Ci to zweryfikować — w 3 minuty, za darmo.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary me-2 my-2">
                    Zweryfikuj za darmo
                  </Link>
                  <Link href="#przyklad-raportu" className="btn btn-outline-primary my-2">
                    Zobacz przykład raportu
                  </Link>
                </div>
                <p className="text-muted small mt-3 mb-0">
                  Tip: porównaj Execution Plan z SiteSpector z listą działań z raportu agencji. Jeśli brakuje podstaw — masz twarde dane do rozmowy.
                </p>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image
                    src={DashboardHero}
                    alt="Podgląd raportu i dashboardu (placeholder)"
                    className="img-fluid rounded-3"
                  />
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="text-primary fw-semibold">Raport agencji</div>
                    <div className="text-orange fw-semibold">Dostajesz konkrety?</div>
                  </div>
                  <div className="mt-2 d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">Meta tagi</span>
                    <span className="badge bg-white text-primary border">Core Web Vitals</span>
                    <span className="badge bg-white text-primary border">Widoczność</span>
                    <span className="badge bg-white text-primary border">Execution Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="problem">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>ZNASZ TO?</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Typowe problemy z <span className="text-orange text-line">agencjami SEO</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {painCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div className="col-md-6" key={i}>
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

        <section className="section py-5 bg-white" id="jak-zweryfikowac">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>JAK ZWERYFIKOWAĆ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Sprawdź agencję w <span className="text-orange text-line">3 prostych krokach</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row g-4 justify-content-center">
              {verifySteps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={i}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                      <div className="card-body p-0">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="bg-orange-subtle rounded-3 d-inline-flex p-3">
                            <Icon size={28} className="text-orange" />
                          </div>
                          <span className="badge bg-light text-primary border">Krok {i + 1}</span>
                        </div>
                        <h3 className="h5 text-primary fw-bold">{s.title}</h3>
                        <p className="text-muted mb-0">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="row justify-content-center text-center mt-5">
              <div className="col-lg-8">
                <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                  Rozpocznij darmowy audyt
                  <RiArrowRightLine className="ms-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="na-co-zwrocic-uwage">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>NA CO ZWRÓCIĆ UWAGĘ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Co SiteSpector sprawdza — i czego <span className="text-orange text-line">szukać</span> w raporcie agencji
                  </h2>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {checklist.map((item, i) => (
                <div className="col-md-6 col-lg-4" key={i}>
                  <div className="bg-white border rounded-4 p-4 h-100 shadow-sm">
                    <div className="d-flex align-items-start">
                      <div className="bg-success-subtle rounded-circle d-inline-flex p-2 me-3">
                        <RiCheckboxCircleLine size={22} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-primary fw-bold">{item.title}</div>
                        <div className="text-muted small mt-1">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="czerwone-flagi">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>CZERWONE FLAGI</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Kiedy warto rozważyć <span className="text-orange text-line">zmianę agencji</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  {redFlags.map((flag, i) => (
                    <div className="d-flex align-items-start mb-3" key={i}>
                      <RiErrorWarningLine size={22} className="text-orange flex-shrink-0 mt-1 me-3" />
                      <div className="text-muted lh-lg">{flag}</div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-white rounded-4 border">
                    <div className="d-flex align-items-start">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-2 me-3">
                        <RiCloseLine size={22} className="text-orange" />
                      </div>
                      <div>
                        <div className="text-primary fw-bold">Prosty test</div>
                        <div className="text-muted small mt-1">
                          Jeśli SiteSpector pokazuje krytyczne błędy (meta tagi, broken links, Core Web Vitals), a raport agencji o tym milczy — to nie jest „opinia”.
                          To dane.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="przyklad-raportu">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>PRZYKŁAD RAPORTU</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    9 sekcji, które dostajesz w <span className="text-orange text-line">każdym audycie</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  SiteSpector nie zostawia miejsca na domysły. Oto, co zobaczysz w dashboardzie i w raporcie PDF.
                </p>
              </div>
            </div>

            <div className="row align-items-center g-4 justify-content-center">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Dashboard z zakładkami (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="row g-3">
                  {reportSections.map((s, i) => (
                    <div className="col-md-6" key={i}>
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">{s.title}</div>
                        <div className="text-muted small mt-2">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-light text-primary border">
                    <RiFilePdfLine className="me-1" /> PDF
                  </span>
                  <span className="badge bg-light text-primary border">Dashboard</span>
                  <span className="badge bg-light text-primary border">Raw Data</span>
                  <span className="badge bg-light text-primary border">Client Report</span>
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
                    Najważniejsza różnica: zadania z <span className="text-orange text-line">gotowym kodem</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Większość raportów mówi: „Popraw meta tagi na stronach produktowych.” SiteSpector mówi: „Oto gotowy meta description do wklejenia
                  na stronę /produkt/...”. Możesz zapytać agencję: „Dlaczego tego nie zrobiliście? Mam gotowy kod.”
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Execution Plan (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiRobotLine size={28} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Co zawiera Execution Plan</h3>
                    </div>
                    {[
                      'Zadania z priorytetami (krytyczne → niskie)',
                      'Tag „Quick win” przy prostych zadaniach',
                      'Gotowy kod (HTML, schema.org, CSS)',
                      'Możliwość odznaczania i notatek',
                    ].map((t, i) => (
                      <div className="d-flex mb-2" key={i}>
                        <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                        <div className="text-muted">{t}</div>
                      </div>
                    ))}
                    <div className="mt-4 d-flex gap-2 flex-wrap">
                      <Link href="/login" className="btn btn-primary">
                        Zobacz Execution Plan w akcji
                        <RiArrowRightLine className="ms-2" />
                      </Link>
                      <Link href="/jak-to-dziala" className="btn btn-outline-primary">
                        Jak to działa (krok po kroku)
                      </Link>
                    </div>
                    <p className="text-muted small mt-3 mb-0">
                      Jeśli agencja nie potrafi przełożyć „audytu” na listę konkretnych zadań — płacisz za storytelling, nie za efekt.
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
                    Zweryfikuj za darmo. <span className="text-orange text-line">Bez karty kredytowej</span>.
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Plan Free: 5 audytów miesięcznie. Wystarczy, żeby sprawdzić swoją stronę i porównać z raportem agencji. Załóż konto w 30 sekund.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy audyt
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                  <Link href="/dla-ecommerce" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Masz sklep? Zobacz dla e-commerce
                  </Link>
                </div>
                <div className="mt-4 text-muted small">
                  Jeśli chcesz, możesz też porównać wyniki z konkurencją (do 3 URL) w planie Pro/Enterprise.
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

