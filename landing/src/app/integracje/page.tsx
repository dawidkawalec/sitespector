import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiBankCardLine,
  RiCheckboxCircleLine,
  RiFlashlightLine,
  RiLineChartLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiShieldUserLine,
  RiTerminalBoxLine,
} from 'react-icons/ri';
import DashboardHero from '@/assets/images/Dashboard.png';
import DashboardWide from '@/assets/images/dashbord-3.png';
import DashboardMetrics from '@/assets/images/dashbord-4.png';

export const metadata: Metadata = {
  title: 'Integracje — Screaming Frog, Lighthouse, Senuto, Gemini AI | SiteSpector',
  description:
    'Pełny opis integracji SiteSpector: Screaming Frog (crawling), Google Lighthouse (Core Web Vitals), Senuto (widoczność, AI Overviews), Gemini AI (analiza), Stripe, Supabase. REST API w przygotowaniu.',
  keywords: [
    'SiteSpector integracje',
    'Screaming Frog API',
    'Senuto API',
    'Lighthouse Docker',
    'Gemini AI audyt SEO',
    'technologia SiteSpector',
  ],
};

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="row g-2">
      {items.map((t, i) => (
        <div className="col-md-6" key={i}>
          <div className="d-flex">
            <RiCheckboxCircleLine className="text-orange flex-shrink-0 me-2 mt-1" size={18} />
            <div className="text-muted small lh-lg">{t}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IntegracjePage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white" id="top">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>TECHNOLOGIA</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Zbudowany na <span className="text-gradient text-line">sprawdzonych narzędziach</span>
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  SiteSpector nie wymyśla koła na nowo. Łączymy branżowe standardy: Screaming Frog, Google Lighthouse, Senuto i Google Gemini.
                  Każda integracja działa w Twoim imieniu — bez instalacji, bez konfiguracji.
                </p>
              </div>
            </div>

            <div className="row justify-content-center mt-5">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-3 justify-content-center text-center">
                    <div className="col-md-3">
                      <div className="bg-white rounded-4 border p-4 h-100">
                        <div className="text-orange mb-2">
                          <RiSearchEyeLine size={34} />
                        </div>
                        <div className="text-primary fw-bold">Screaming Frog</div>
                        <div className="text-muted small mt-1">Crawling SEO</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white rounded-4 border p-4 h-100">
                        <div className="text-orange mb-2">
                          <RiFlashlightLine size={34} />
                        </div>
                        <div className="text-primary fw-bold">Lighthouse</div>
                        <div className="text-muted small mt-1">Core Web Vitals</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white rounded-4 border p-4 h-100">
                        <div className="text-orange mb-2">
                          <RiLineChartLine size={34} />
                        </div>
                        <div className="text-primary fw-bold">Senuto</div>
                        <div className="text-muted small mt-1">Widoczność + AIO</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white rounded-4 border p-4 h-100">
                        <div className="text-orange mb-2">
                          <RiRobotLine size={34} />
                        </div>
                        <div className="text-primary fw-bold">Gemini AI</div>
                        <div className="text-muted small mt-1">Analiza + Plan</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="screaming-frog">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CRAWLING SEO</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Screaming Frog — <span className="text-orange text-line">silnik crawlingu</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Branżowy standard do analizy struktury strony. Crawler skanuje Twoją stronę jak Googlebot i zbiera dane o każdej podstronie.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="Zakładka SEO (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="text-primary fw-bold mb-2">Co crawlujemy:</div>
                    <BulletList
                      items={[
                        'Meta tagi — title, description, robots, canonical (brakujące, zduplikowane, za długie)',
                        'Nagłówki H1–H6 — hierarchia, brakujące H1, duplikaty',
                        'Obrazy — brakujące ALT, rozmiary, formaty',
                        'Linki — wewnętrzne, zewnętrzne, broken, nofollow',
                        'Canonicals — kanoniczne URL-e i duplikaty',
                        'Dyrektywy — noindex/nofollow, hreflang',
                        'Mapy witryn — wykrywanie sitemap XML',
                      ]}
                    />

                    <div className="text-primary fw-bold mt-4 mb-2">Jak działa w SiteSpector:</div>
                    <BulletList
                      items={[
                        'Uruchamiany w kontenerze Docker — headless na serwerze',
                        'Nie potrzebujesz licencji desktopowej — wszystko w chmurze',
                        'Bez ręcznej konfiguracji — wystarczy URL',
                      ]}
                    />

                    <div className="text-primary fw-bold mt-4 mb-2">Czego nie musisz robić:</div>
                    <BulletList
                      items={[
                        'Instalować Screaming Frog na swoim komputerze',
                        'Płacić za osobną licencję',
                        'Ręcznie eksportować danych — SiteSpector pobiera je automatycznie',
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="lighthouse">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>WYDAJNOŚĆ I DOSTĘPNOŚĆ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Google Lighthouse — <span className="text-orange text-line">desktop + mobile</span> naraz
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Oficjalne narzędzie Google do audytu wydajności, dostępności i Best Practices. SiteSpector uruchamia Lighthouse dla desktop i mobile
                  równolegle, a metryki trafiają do jednego dashboardu.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardMetrics} alt="Zakładka Performance (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="text-primary fw-bold mb-2">Core Web Vitals i metryki:</div>
                    <BulletList
                      items={[
                        'LCP, FCP, CLS, TTFB, TBT, Speed Index',
                        'Desktop + mobile w jednym audycie',
                        'Opportunity + diagnostics (co poprawić i dlaczego)',
                      ]}
                    />

                    <div className="text-primary fw-bold mt-4 mb-2">4 wyniki (0–100):</div>
                    <BulletList items={['Performance', 'Accessibility', 'Best Practices', 'SEO']} />

                    <details className="mt-4">
                      <summary className="text-primary fw-semibold">Szczegóły audytów (opportunity/diagnostics)</summary>
                      <p className="text-muted small mt-2 mb-0">
                        Lighthouse zwraca dziesiątki kategorii audytów. W SiteSpector agregujemy je w czytelne wnioski i priorytety, a Execution Plan
                        przekłada je na zadania do wdrożenia.
                      </p>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="senuto">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>WIDOCZNOŚĆ I AI OVERVIEWS</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Senuto — widoczność, backlinki, <span className="text-orange text-line">AI Overviews</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Integracja z Senuto API (PL rynek): pozycje słów kluczowych, trendy, wins/losses, kanibalizacja, backlinki i monitoring AI Overviews.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-white rounded-4 border shadow-sm">
                  <Image src={DashboardHero} alt="Visibility / AI Overviews (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="text-primary fw-bold mb-2">Widoczność:</div>
                    <BulletList
                      items={[
                        'Pozycje, trendy, wins/losses',
                        'Kanibalizacja (strony konkurujące o frazy)',
                        'Rozkład SERP (organiczne, featured snippets, PAA)',
                      ]}
                    />
                    <div className="text-primary fw-bold mt-4 mb-2">AI Overviews:</div>
                    <BulletList
                      items={[
                        'Ile fraz ma AI Overview i jak często Twoja domena się pojawia',
                        'Keyword explorer fraz z AI Overviews',
                        'Porównanie z konkurencją w AI Overviews',
                      ]}
                    />
                    <div className="text-primary fw-bold mt-4 mb-2">Backlinki:</div>
                    <BulletList items={['Liczba linków i referring domains', 'Anchory (branded/exact/generic)', 'Dofollow/nofollow']} />

                    <details className="mt-4">
                      <summary className="text-primary fw-semibold">Konfiguracja (kraj/limit danych)</summary>
                      <p className="text-muted small mt-2 mb-0">
                        W audycie wybierasz kraj analizy. W zależności od konfiguracji integracji Senuto, platforma może pobierać dane w trybie pełnym lub
                        częściowym (limity słów/zakresu).
                      </p>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="gemini">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ANALIZA AI</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Google Gemini — wielowarstwowa <span className="text-orange text-line">analiza</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Gemini przetwarza dane z crawla, Lighthouse i Senuto. Generuje kontekstowe rekomendacje w wielu obszarach oraz strategiczne podsumowania.
                </p>
              </div>
            </div>

            <div className="row align-items-center justify-content-center g-4">
              <div className="col-lg-5">
                <div className="p-3 bg-light rounded-4 border shadow-sm">
                  <Image src={DashboardWide} alt="AI Strategy / Execution Plan (placeholder)" className="img-fluid rounded-3" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="card-body p-0">
                    <div className="text-primary fw-bold mb-2">Obszary analizy:</div>
                    <BulletList
                      items={[
                        'Treść — thin content, duplikaty, jakość, słowa kluczowe',
                        'Wydajność — interpretacja Lighthouse, co blokuje LCP',
                        'UX — dostępność, użyteczność, nawigacja',
                        'Bezpieczeństwo — HTTPS, nagłówki, mixed content',
                        'Local SEO — NAP, schema, Google Business (gdy dotyczy)',
                        'Tech stack — wykrywanie CMS i frameworków',
                        'Benchmark — porównanie z branżą (gdy dostępne)',
                      ]}
                    />

                    <div className="text-primary fw-bold mt-4 mb-2">Analiza strategiczna:</div>
                    <BulletList items={['Cross-tool korelacje', 'Roadmapa działań', 'Executive summary', 'Quick Wins']} />

                    <div className="text-primary fw-bold mt-4 mb-2">Execution Plan:</div>
                    <BulletList items={['Zadania z kodem', 'Priorytety', 'Tag quick win', 'Status + notatki']} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="stripe">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>PŁATNOŚCI</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Stripe — subskrypcje i <span className="text-orange text-line">płatności</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Bezpieczne płatności przez Stripe: subskrypcje (Free/Pro/Enterprise), faktury, Customer Portal. PCI DSS — nie przechowujemy danych kart.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                      <RiBankCardLine size={26} className="text-orange" />
                    </div>
                    <h3 className="h5 text-primary fw-bold mb-0">Co zapewnia Stripe</h3>
                  </div>
                  <BulletList
                    items={[
                      'Płatności kartą i innymi metodami',
                      'Automatyczne odnawianie subskrypcji',
                      'Customer Portal — zmiana planu, anulowanie, historia faktur',
                      'Webhooks — synchronizacja statusu płatności z platformą',
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="supabase">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>AUTH I BAZA DANYCH</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Supabase — auth, RLS, <span className="text-orange text-line">zespoły</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Autentykacja, PostgreSQL i Row Level Security. Zespoły, workspace’y i role — izolacja danych per workspace. Każdy użytkownik widzi tylko
                  swoje projekty.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-white rounded-circle d-inline-flex p-3 me-3 shadow-sm">
                      <RiShieldUserLine size={26} className="text-orange" />
                    </div>
                    <h3 className="h5 text-primary fw-bold mb-0">Supabase w SiteSpector</h3>
                  </div>
                  <BulletList
                    items={[
                      'Auth — e-mail/hasło + OAuth (Google/GitHub jeśli włączone)',
                      'RLS — polityki bezpieczeństwa na poziomie wiersza',
                      'Workspace’y — osobna przestrzeń per klient/projekt',
                      'Role — Właściciel, Admin, Członek (per workspace)',
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="api">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>API</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    REST API — <span className="text-orange text-line">w przygotowaniu</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Docelowo: REST API do integracji z własnymi systemami (uruchamianie audytów, pobieranie wyników, eksport danych). Dostępne w planie Pro
                  i Enterprise.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3">
                      <RiTerminalBoxLine size={26} className="text-orange" />
                    </div>
                    <h3 className="h5 text-primary fw-bold mb-0">Planowany zakres</h3>
                  </div>
                  <BulletList
                    items={[
                      'Uruchamianie audytów z poziomu API',
                      'Pobieranie wyników i raportów',
                      'Eksport danych do własnych dashboardów',
                      'Automatyzacje (np. webhooki po zakończeniu audytu)',
                    ]}
                  />
                  <div className="mt-4">
                    <Link href="/docs" className="btn btn-outline-primary">
                      Zobacz dokumentację
                    </Link>
                  </div>
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
                    Chcesz zobaczyć, jak to <span className="text-orange text-line">działa w praktyce</span>?
                  </h2>
                </div>
                <p className="text-muted mt-3">Rozpocznij darmowy audyt — 5 audytów miesięcznie, bez karty kredytowej.</p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij darmowy audyt
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

