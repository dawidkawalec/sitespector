import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiFilePdfLine,
  RiGiftLine,
  RiRobotLine,
  RiTeamLine,
  RiTimerLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Dla Freelancerów SEO — Profesjonalne audyty bez drogich narzędzi | SiteSpector',
  description:
    'SiteSpector dla freelancerów: plan Solo od $9.99/msc (100 crawli), Agency od $29.99/msc (400 crawli). Audyt SEO, PDF, AI Strategy i Execution Plan.',
  keywords: ['freelancer SEO', 'audyt SEO freelancer', 'narzędzie SEO za darmo', 'audyt strony darmowy', 'SiteSpector free', 'konsultant SEO'],
  path: '/dla-freelancerow',
  ogImageType: 'page',
});

const challengeCards = [
  { icon: RiTimerLine, title: 'Narzędzia zjadają marże', desc: 'Koszty narzędzi szybko rosną, gdy masz 1–2 klientów.' },
  { icon: RiFilePdfLine, title: 'Raporty zabierają godziny', desc: 'Ręczne raporty to 2–4 godziny na klienta: kopiuj/wklej, formatowanie, poprawki.' },
  { icon: RiRobotLine, title: 'Brak jednego stacku', desc: 'SF + coś do wydajności + coś do treści + AI osobno. Dużo narzędzi, mało spójności.' },
  { icon: RiCheckboxCircleLine, title: 'Klient chce konkretów', desc: 'Nie „lista błędów”, tylko plan działania: co zrobić, w jakiej kolejności i jak.' },
];

const soloPlanBullets = [
  '100 crawli miesięcznie',
  'Pełny audyt SEO + Lighthouse',
  'Raport PDF (9 sekcji)',
  'AI Strategy + Execution Plan',
  'Quick Wins — lista zadań o najwyższym ROI',
  '1 workspace',
];

const agencyPlanBullets = [
  '400 crawli miesięcznie',
  'Wszystko z Solo +',
  'White-label PDF (własne logo)',
  'Harmonogramy audytów',
  'Wiele workspace\'ów',
  'Zapraszanie członków zespołu',
];

const aiAssistantBullets = [
  'Quick Wins — lista zadań o najwyższym ROI',
  'Roadmapa — priorytetyzacja (co robić po kolei)',
  'Analiza treści — thin content, duplikaty, słowa kluczowe',
  'Executive summary — jedna strona do prezentacji',
];

const executionExamples = [
  'Dodaj meta description — gotowy fragment HTML',
  'Dodaj Schema.org — gotowy JSON-LD do wklejenia',
  'Popraw CLS — konkretna zmiana CSS dla bannera',
];

export default function DlaFreelancerowPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/dla-freelancerow',
            title: 'Dla Freelancerów SEO — Profesjonalne audyty bez drogich narzędzi | SiteSpector',
            description:
              'SiteSpector dla freelancerów: plan Solo od $9.99/msc (100 crawli), Agency od $29.99/msc (400 crawli). Audyt SEO, PDF, AI Strategy i Execution Plan.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Dla freelancerów', path: '/dla-freelancerow' },
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
                  <span>DLA FREELANCERÓW SEO</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Profesjonalne audyty <span className="text-gradient text-line">bez drogich narzędzi</span>
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Pełny audyt SEO z AI, raportem PDF i Execution Plan — od $9.99/msc. Bez zbędnych narzędzi, bez ukrytych kosztów.
                </p>
                <div className="mt-4">
                  <Link href="/register" className="btn btn-primary me-2 my-2">
                    Zacznij za darmo
                  </Link>
                  <Link href="#plan-free" className="btn btn-outline-primary my-2">
                    Porównaj plany
                  </Link>
                </div>
                <div className="mt-3 text-muted small">
                  Solo $9.99/msc (100 crawli) | Agency $29.99/msc (400 crawli) — bez lock-in, zmień plan kiedy chcesz.
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Dashboard SiteSpector — audyt gotowy z raportem PDF" className="img-fluid rounded-3" />
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary border">Audyt gotowy</span>
                    <span className="badge bg-white text-primary border">Pobierz PDF</span>
                    <span className="badge bg-white text-primary border">Execution Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="wyzwania">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CODZIENNOŚĆ FREELANCERA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Narzędzia zjadają <span className="text-orange text-line">marże</span>, raporty — godziny
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Jako freelancer płacisz za narzędzia z własnej kieszeni. Klient oczekuje profesjonalnego raportu, ale nie zawsze masz budżet na full
                  stack. Albo nie masz czasu.
                </p>
              </div>
            </div>

            <div className="row g-4">
              {challengeCards.map((c, i) => {
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

        <section className="section py-5 bg-white" id="plan-free">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CENNIK</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Wybierz plan dopasowany do <span className="text-orange text-line">Twojego biznesu</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Bez lock-in, bez ukrytych opłat. Zmień plan lub zrezygnuj w dowolnym momencie.
                </p>
              </div>
            </div>

            <div className="row justify-content-center g-4">
              <div className="col-lg-5">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm h-100">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiGiftLine size={28} className="text-orange" />
                    </div>
                    <div>
                      <h3 className="h5 text-primary fw-bold mb-0">Solo</h3>
                      <div className="text-orange fw-bold fs-4">$9.99<span className="text-muted fw-normal fs-6">/msc</span></div>
                    </div>
                  </div>
                  <div className="row g-2">
                    {soloPlanBullets.map((t, i) => (
                      <div className="col-12" key={i}>
                        <div className="d-flex">
                          <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                          <div className="text-muted small lh-lg">{t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/register" className="btn btn-primary px-4 py-3 fw-bold w-100">
                      Zacznij za darmo
                      <RiArrowRightLine className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="bg-light rounded-4 border border-orange p-4 p-lg-5 shadow-sm h-100 position-relative">
                  <span className="badge bg-orange text-white position-absolute top-0 start-50 translate-middle px-3 py-2">Najpopularniejszy</span>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiTeamLine size={28} className="text-orange" />
                    </div>
                    <div>
                      <h3 className="h5 text-primary fw-bold mb-0">Agency</h3>
                      <div className="text-orange fw-bold fs-4">$29.99<span className="text-muted fw-normal fs-6">/msc</span></div>
                    </div>
                  </div>
                  <div className="row g-2">
                    {agencyPlanBullets.map((t, i) => (
                      <div className="col-12" key={i}>
                        <div className="d-flex">
                          <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                          <div className="text-muted small lh-lg">{t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/register" className="btn btn-primary px-4 py-3 fw-bold w-100">
                      Zacznij za darmo
                      <RiArrowRightLine className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="raporty">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>RAPORT, KTÓRY IMPONUJE</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    9 sekcji — udowodnij klientowi swoją <span className="text-orange text-line">wartość</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Raport PDF z SiteSpector wygląda jak od dużej agencji. Jeden klik, plik gotowy do wysłania — bez ręcznej edycji.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Raport PDF SiteSpector — 9 sekcji audytu" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiFilePdfLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Raport gotowy do wysyłki</h3>
                    </div>
                    <p className="text-muted mb-0">
                      Klient widzi dane i rekomendacje, a Ty skupiasz się na konsultingu. Raport PDF dostępny w każdym planie — od Solo ($9.99/msc).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="ai">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>AI ROBI ANALIZĘ, TY DOSTARCZASZ WARTOŚĆ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    AI jako asystent — Quick Wins, roadmapa, <span className="text-orange text-line">analiza treści</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  AI analizuje setki czynników. Ty nie siedzisz godzinami w danych — dostajesz priorytety i argumenty do rozmowy z klientem.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="AI Strategy — Quick Wins i roadmapa" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                        <RiRobotLine size={26} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold mb-0">Elementy analizy AI</h3>
                    </div>
                    {aiAssistantBullets.map((t, i) => (
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

        <section className="section py-5 bg-light" id="execution-plan">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>KONKRETNE ZADANIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Execution Plan — nie „popraw meta”, ale <span className="text-orange text-line">oto kod</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Klient chce wiedzieć, co zrobić. Execution Plan daje gotowe zadania i kod. Ty przekazujesz to developerowi lub wdrażasz sam — bez
                  zgadywania.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                          <RiCheckboxCircleLine size={26} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold mb-0">Przykłady zadań</h3>
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
                    </div>
                    <div className="col-lg-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <Image src={DashboardWide} alt="Execution Plan — konkretne zadania z kodem" className="img-fluid rounded-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="growth">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ROŚNIJ BEZ OGRANICZEŃ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Zacznij od Solo, przejdź na Agency <span className="text-orange text-line">kiedy chcesz</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Bez lock-in — zmień plan w dowolnym momencie. Rośnij razem z portfolio klientów.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">Solo</div>
                        <div className="text-muted small mt-2">100 crawli/msc, 1 workspace</div>
                        <div className="text-orange fw-bold mt-3">$9.99/msc</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">Agency</div>
                        <div className="text-muted small mt-2">400 crawli/msc, wiele workspace&apos;ów</div>
                        <div className="text-orange fw-bold mt-3">$29.99/msc</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">Bez lock-in</div>
                        <div className="text-muted small mt-2">Upgrade w dowolnym momencie</div>
                        <div className="text-orange fw-bold mt-3">Kiedy chcesz</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="porownanie-planow">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>PORÓWNANIE PLANÓW</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Solo vs Agency — wybierz <span className="text-orange text-line">swój plan</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-11">
                <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th className="p-4 border-0">Funkcja</th>
                          <th className="p-4 border-0 text-center">Solo — $9.99/msc</th>
                          <th className="p-4 border-0 text-center text-orange">Agency — $29.99/msc</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Crawle miesięcznie</td>
                          <td className="p-4 border-top text-center text-muted">100</td>
                          <td className="p-4 border-top text-center text-orange fw-bold">400</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Crawling + Lighthouse + AI</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Raport PDF (9 sekcji)</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">AI Strategy + Execution Plan</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">White-label PDF</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Wiele workspace&apos;ów</td>
                          <td className="p-4 border-top text-center text-muted">1</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Harmonogramy audytów</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Zapraszanie członków zespołu</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/register" className="btn btn-primary px-5 py-3 fw-bold">
                    Zacznij za darmo
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
                    Zacznij profesjonalnie — <span className="text-orange text-line">bez wydawania setek</span> na narzędzia
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Solo od $9.99/msc (100 crawli) — pełny audyt SEO z AI, raportem PDF i Execution Plan. Bez karty kredytowej na start.
                </p>
                <div className="mt-4">
                  <Link href="/register" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Zacznij za darmo
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                  <Link href="/cennik" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Porównaj wszystkie plany
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

