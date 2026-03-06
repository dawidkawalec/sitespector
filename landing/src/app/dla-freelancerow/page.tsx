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
    'Oferta SiteSpector dla freelancerów jest aktualizowana. Skontaktuj się z nami, aby poznać aktualne możliwości i zakres współpracy.',
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

const freePlanBullets = [
  'Szczegóły pakietów opublikujemy wkrótce',
  'Zakres funkcji będzie dostępny po publikacji oferty',
  'Skontaktuj się z nami, aby poznać aktualne możliwości',
  'Oferta będzie dopasowana do potrzeb freelancerów',
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
              'Oferta SiteSpector dla freelancerów jest aktualizowana. Skontaktuj się z nami, aby poznać aktualne możliwości i zakres współpracy.',
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
                  Oferta dla freelancerów jest obecnie aktualizowana. Szczegóły pakietów opublikujemy wkrótce.
                </p>
                <div className="mt-4">
                  <Link href="/kontakt" className="btn btn-primary me-2 my-2">
                    Skontaktuj się z nami
                  </Link>
                  <Link href="#plan-free" className="btn btn-outline-primary my-2">
                    Sprawdź szczegóły
                  </Link>
                </div>
                <div className="mt-3 text-muted small">
                  Wkrótce opublikujemy finalne warianty współpracy dla freelancerów.
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Audyt gotowy + PDF (placeholder)" className="img-fluid rounded-3" />
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
                  <span>OFERTA WKRÓTCE</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Szczegóły pakietów dla freelancerów <span className="text-orange text-line">wkrótce</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Finalizujemy zakres oferty i warunki współpracy. Po aktualne informacje zapraszamy do kontaktu.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiGiftLine size={28} className="text-orange" />
                    </div>
                    <h3 className="h5 text-primary fw-bold mb-0">Co będzie dostępne</h3>
                  </div>
                  <div className="row g-2">
                    {freePlanBullets.map((t, i) => (
                      <div className="col-md-6" key={i}>
                        <div className="d-flex">
                          <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
                          <div className="text-muted small lh-lg">{t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link href="/kontakt" className="btn btn-primary px-4 py-3 fw-bold">
                      Skontaktuj się z nami
                      <RiArrowRightLine className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Podgląd audytu (placeholder)" className="img-fluid rounded-3" />
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
                  <Image src={DashboardMetrics} alt="Miniatury PDF (placeholder)" className="img-fluid rounded-3" />
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
                      Klient widzi dane i rekomendacje, a Ty skupiasz się na konsultingu. Szczegóły pakietów i dodatków opublikujemy wkrótce.
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
                  <Image src={DashboardHero} alt="Quick Wins / AI Strategy (placeholder)" className="img-fluid rounded-3" />
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
                        <Image src={DashboardWide} alt="Execution Plan (placeholder)" className="img-fluid rounded-3" />
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
                    Oferta dla rosnących biznesów <span className="text-orange text-line">wkrótce</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Przygotowujemy finalne pakiety pod skalowanie pracy z klientami. Skontaktuj się z nami, aby omówić bieżące możliwości.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">Pakiet startowy</div>
                        <div className="text-muted small mt-2">W przygotowaniu</div>
                        <div className="text-orange fw-bold mt-3">Wkrótce</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                        <div className="text-primary fw-bold">Pakiet rozwojowy</div>
                        <div className="text-muted small mt-2">W przygotowaniu</div>
                        <div className="text-orange fw-bold mt-3">Wkrótce</div>
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
                    Szczegóły oferty <span className="text-orange text-line">wkrótce</span>
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
                          <th className="p-4 border-0 text-center">Pakiet A</th>
                          <th className="p-4 border-0 text-center text-orange">Pakiet B</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Dostępność pakietu</td>
                          <td className="p-4 border-top text-center text-muted">Wkrótce</td>
                          <td className="p-4 border-top text-center text-muted">Wkrótce</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Crawling + Lighthouse + AI</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Raport PDF</td>
                          <td className="p-4 border-top text-center text-muted">Szczegóły wkrótce</td>
                          <td className="p-4 border-top text-center text-muted">Szczegóły wkrótce</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Rozszerzenia</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Dodatkowe opcje</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Workspace’y</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">Harmonogramy</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                        <tr>
                          <td className="p-4 border-top fw-semibold text-primary">API</td>
                          <td className="p-4 border-top text-center text-muted">✗</td>
                          <td className="p-4 border-top text-center text-muted">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                    Skontaktuj się z nami
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
                  Pakiety i zakres współpracy są obecnie aktualizowane. Skontaktuj się z nami, aby poznać aktualne możliwości.
                </p>
                <div className="mt-4">
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Skontaktuj się z nami
                    <RiArrowRightLine className="ms-2" />
                  </Link>
                  <Link href="/porownanie" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                                Zobacz szczegóły oferty
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

