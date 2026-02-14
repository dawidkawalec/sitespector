import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import {
  RiBankCardLine,
  RiCheckboxCircleLine,
  RiFilePdfLine,
  RiFlashlightLine,
  RiLineChartLine,
  RiRobotLine,
  RiSearchEyeLine,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiTeamLine,
  RiTerminalBoxLine,
} from 'react-icons/ri';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'O nas — SiteSpector | Audyty SEO z AI i planem wykonania',
  description:
    'Poznaj zespół SiteSpector. Stworzyliśmy narzędzie łączące Screaming Frog, Lighthouse, Senuto i Gemini AI. Jedna platforma zamiast pięciu. Dane w UE.',
  keywords: ['SiteSpector o nas', 'audyt SEO', 'narzędzie SEO', 'Senuto partner', 'Execution Plan', 'AI analiza'],
  path: '/o-nas',
  ogImageType: 'page',
});

export default function ONasPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/o-nas',
            title: 'O nas — SiteSpector | Audyty SEO z AI i planem wykonania',
            description:
              'Poznaj zespół SiteSpector. Stworzyliśmy narzędzie łączące Screaming Frog, Lighthouse, Senuto i Gemini AI. Jedna platforma zamiast pięciu. Dane w UE.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'O nas', path: '/o-nas' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-light">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-10">
                <h1 className="display-4 fw-bold text-primary mb-3">
                  Zespół, który <span className="text-gradient text-line">uprościł audyt SEO</span>
                </h1>
                <p className="text-muted lead mb-0">
                  Stworzyliśmy SiteSpector, bo zmęczyliśmy się przełączaniem między pięcioma narzędziami. Teraz wszystko jest w jednym miejscu — z planem
                  wykonania generowanym przez AI.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="historia">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="title-sm">
                  <span>NASZA HISTORIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Z frustracji narodził się <span className="text-orange text-line">SiteSpector</span>
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Audyt profesjonalny wymagał Screaming Frog do crawlowania, Lighthouse do wydajności, Senuto do widoczności i backlinków, osobnego narzędzia
                  do raportów — plus godziny na ręczne łączenie wyników. Żadne z tych rozwiązań nie mówiło wprost: „oto konkretne kroki z gotowym kodem”.
                </p>
                <p className="text-muted mb-0">
                  Stworzyliśmy SiteSpector, aby połączyć wszystko w jednym narzędziu i dodać trzecią fazę — <span className="text-primary fw-semibold">Execution Plan</span> —
                  gdzie AI generuje zadania z priorytetami, tagami quick win i gotowym kodem do wdrożenia. Wystarczy 3 minuty, aby dostać pełny audyt
                  techniczny, analizę AI i plan wykonania.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="misja">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-2 text-center">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-4">
                        <RiTeamLine size={34} className="text-orange" />
                      </div>
                    </div>
                    <div className="col-lg-10">
                      <div className="title-sm">
                        <span>MISJA</span>
                      </div>
                      <h3 className="text-primary fw-bold mt-2 mb-2">Demokratyzujemy profesjonalną analitykę SEO</h3>
                      <p className="text-muted mb-0">
                        Chcemy, aby każda agencja, freelancer i właściciel sklepu mógł przeprowadzać audyty na poziomie enterprise — bez budżetów na dziesiątki narzędzi.
                        SiteSpector oferuje plan Free ($0), Pro ($29) i Enterprise ($99), z pełną funkcjonalnością od planu Pro: Senuto, konkurenci, harmonogramy,
                        white-label PDF i Execution Plan z kodem.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="wyroznia">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>CO NAS WYRÓŻNIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    SiteSpector — nie tylko kolejne <span className="text-orange text-line">narzędzie SEO</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: RiCheckboxCircleLine,
                  title: 'Jedno narzędzie zamiast pięciu',
                  desc: 'Screaming Frog + Lighthouse + Senuto + AI + raporty w jednej platformie. Koniec przełączania między zakładkami i eksportami.',
                },
                {
                  icon: RiTerminalBoxLine,
                  title: 'Execution Plan z kodem',
                  desc: 'AI nie tylko mówi „co poprawić”, ale generuje konkretne zadania z gotowym kodem. Odznaczasz wykonane, dodajesz notatki.',
                },
                {
                  icon: RiFilePdfLine,
                  title: 'Raporty PDF gotowe dla klienta',
                  desc: '9 sekcji, white-label w Pro i Enterprise. Wysyłasz jeden plik zamiast prezentacji.',
                },
                {
                  icon: RiTeamLine,
                  title: 'Zespoły i Workspace’y',
                  desc: 'Role (Właściciel, Admin, Członek), zaproszenia, współdzielone audyty. Idealne dla agencji.',
                },
                {
                  icon: RiShieldCheckLine,
                  title: 'Dane w Unii Europejskiej',
                  desc: 'Supabase i VPS na Hetzner DE. Pełna zgodność z RODO. Dane pozostają w UE.',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hover-lift transition-all">
                      <div className="card-body p-0">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 mb-3">
                          <Icon size={28} className="text-orange" />
                        </div>
                        <h3 className="h5 text-primary fw-bold">{item.title}</h3>
                        <p className="text-muted mb-0">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="technologia">
          <div className="container">
            <div className="row justify-content-center text-center mb-5">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>NASZA TECHNOLOGIA</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Zbudowany na <span className="text-orange text-line">sprawdzonych silnikach</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Nie wymyślamy koła na nowo. Korzystamy ze standardów: Screaming Frog (crawl), Lighthouse (CWV), Senuto (widoczność + AI Overviews) i Gemini (AI analiza i Execution Plan).
                  Trzy fazy audytu: techniczna → AI → plan wykonania.
                </p>
              </div>
            </div>

            <div className="row g-4 justify-content-center text-center">
              {[
                { icon: RiSearchEyeLine, title: 'Screaming Frog', desc: 'Crawling, meta tagi, nagłówki, linki' },
                { icon: RiFlashlightLine, title: 'Lighthouse', desc: 'Performance, Accessibility, mobile' },
                { icon: RiLineChartLine, title: 'Senuto', desc: 'Widoczność, pozycje, backlinki, AI Overviews' },
                { icon: RiRobotLine, title: 'Gemini', desc: 'Analiza treści/UX/security + Execution Plan' },
                { icon: RiBankCardLine, title: 'Stripe', desc: 'Płatności i subskrypcje' },
                { icon: RiShieldUserLine, title: 'Supabase', desc: 'Auth, zespoły, RLS' },
              ].map((t, idx) => {
                const Icon = t.icon;
                return (
                  <div className="col-6 col-md-4" key={idx}>
                    <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                      <div className="text-orange mb-2">
                        <Icon size={34} />
                      </div>
                      <div className="text-primary fw-bold">{t.title}</div>
                      <div className="text-muted small mt-2">{t.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="senuto">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm">
                  <div className="title-sm">
                    <span>PARTNERSTWO</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Oficjalna integracja z Senuto</h3>
                  <p className="text-muted mb-0">
                    SiteSpector korzysta z API Senuto do pobierania widoczności, pozycji, backlinków i danych AI Overviews. Wysyłamy do Senuto wyłącznie adres URL analizowanej domeny.
                    Dzięki tej integracji masz pełny obraz widoczności strony w Google i konkurencji — w jednym audycie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section py-5 bg-white" id="zespol">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>ZESPÓŁ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Ludzie za <span className="text-orange text-line">SiteSpector</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">Zespół inżynierów i specjalistów SEO z Polski. Wkrótce przedstawimy naszą kadrę.</p>
              </div>
            </div>

            <div className="row justify-content-center mt-5 g-4">
              {['Wkrótce', 'Wkrótce', 'Wkrótce'].map((label, idx) => (
                <div className="col-md-4" key={idx}>
                  <div className="bg-light rounded-4 border p-4 text-center h-100">
                    <div className="bg-white rounded-circle d-inline-flex p-4 shadow-sm mb-3">
                      <RiTeamLine size={28} className="text-orange" />
                    </div>
                    <div className="text-primary fw-bold">Osoba #{idx + 1}</div>
                    <div className="text-muted small mt-2">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section py-5 bg-light" id="cta">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-lg-9">
                <div className="title-sm">
                  <span>GOTOWY NA AUDYT?</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Dołącz do setek agencji używających <span className="text-orange text-line">SiteSpector</span>
                  </h2>
                </div>
                <p className="text-muted mt-3">
                  Plan Free — 5 audytów miesięcznie, bez karty kredytowej. Zobacz, jak 3-fazowy audyt zmienia Twoją pracę.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij Darmowy Audyt
                  </Link>
                  <Link href="/#price" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Zobacz cennik
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
