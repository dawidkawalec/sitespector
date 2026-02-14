import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Polityka prywatności — SiteSpector | Ochrona danych',
  description:
    'Polityka prywatności SiteSpector. Jak zbieramy, przetwarzamy i przechowujemy dane. Supabase, Hetzner, Stripe, Gemini, Senuto. Zgodność z RODO.',
  keywords: ['polityka prywatności SiteSpector', 'RODO', 'ochrona danych', 'dane osobowe'],
  path: '/polityka-prywatnosci',
  ogImageType: 'page',
});

export default function PolitykaPrywatnosciPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/polityka-prywatnosci',
            title: 'Polityka prywatności — SiteSpector | Ochrona danych',
            description:
              'Polityka prywatności SiteSpector. Jak zbieramy, przetwarzamy i przechowujemy dane. Supabase, Hetzner, Stripe, Gemini, Senuto. Zgodność z RODO.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Polityka prywatności', path: '/polityka-prywatnosci' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <h1 className="display-4 fw-bold text-primary mb-2">Polityka prywatności</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h2 className="h4 text-primary mt-4 mb-3">1. Administrator</h2>
                  <p className="text-muted mb-0">
                    Administratorem danych osobowych w ramach Serwisu SiteSpector jest SiteSpector. W sprawach związanych z ochroną danych skontaktujesz się z
                    nami przez: kontakt@sitespector.pl.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">2. Zbierane dane</h2>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• <strong>Dane rejestracyjne:</strong> e-mail, hasło (hash), imię/nazwa użytkownika — do utworzenia konta.</li>
                    <li>
                      • <strong>Dane audytów:</strong> URL-e analizowanych stron, wyniki crawlowania (meta, nagłówki, linki, obrazy), wyniki Lighthouse (wydajność),
                      dane Senuto (widoczność, pozycje, backlinki, AI Overviews) — do przeprowadzenia audytu i generowania raportów.
                    </li>
                    <li>
                      • <strong>Dane Execution Plan:</strong> zadania AI, priorytety, statusy, notatki użytkownika — do śledzenia postępów wdrożeń.
                    </li>
                    <li>• <strong>Dane płatności:</strong> przetwarzane wyłącznie przez Stripe (nie przechowujemy numerów kart).</li>
                    <li>• <strong>Dane techniczne:</strong> IP, typ przeglądarki, cookies — w celach technicznych i bezpieczeństwa.</li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">3. Cel przetwarzania</h2>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• świadczenie usług audytowych (rejestracja, logowanie, zarządzanie kontem),</li>
                    <li>• przeprowadzanie audytów w 3 fazach (technika → analiza AI → Execution Plan),</li>
                    <li>• generowanie raportów PDF,</li>
                    <li>• obsługa płatności (Stripe),</li>
                    <li>• wsparcie techniczne i bezpieczeństwo Platformy.</li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">4. Przechowywanie</h2>
                  <p className="text-muted mb-2">Dane przechowywane są w infrastrukturze w Unii Europejskiej:</p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• <strong>Supabase</strong> — auth, użytkownicy, workspace&apos;y, metadane audytów (AWS EU).</li>
                    <li>• <strong>VPS (Hetzner DE)</strong> — przetwarzanie audytów (silniki analiz) i elementy aplikacji (UE).</li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">5. Udostępnianie danych</h2>
                  <p className="text-muted mb-2">Udostępniamy dane wyłącznie w następujących przypadkach:</p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• <strong>Stripe</strong> — dane niezbędne do realizacji płatności.</li>
                    <li>
                      • <strong>Google Gemini</strong> — fragmenty wyników audytu (np. treść, metryki, statystyki SEO) do analizy AI.
                    </li>
                    <li>
                      • <strong>Senuto</strong> — przekazujemy wyłącznie adres URL analizowanej domeny w celu pobrania danych widoczności/backlinków/AI Overviews.
                    </li>
                  </ul>
                  <p className="text-muted">Nie sprzedajemy danych osobowych podmiotom trzecim w celach marketingowych.</p>

                  <h2 className="h4 text-primary mt-4 mb-3">6. Okres przechowywania</h2>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• Dane konta: do momentu usunięcia konta przez użytkownika (lub 2 lata od ostatniego logowania dla kont nieaktywnych).</li>
                    <li>• Dane audytów i Execution Plan: do momentu usunięcia przez użytkownika.</li>
                    <li>• Logi techniczne: do 90 dni.</li>
                    <li>
                      • Cookies: zgodnie z <Link href="/polityka-cookies">Polityką cookies</Link>.
                    </li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">7. Prawa RODO</h2>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• prawo dostępu do danych,</li>
                    <li>• prawo do sprostowania,</li>
                    <li>• prawo do usunięcia („prawo do bycia zapomnianym”),</li>
                    <li>• prawo do ograniczenia przetwarzania,</li>
                    <li>• prawo do przenoszenia danych,</li>
                    <li>• prawo do sprzeciwu,</li>
                    <li>• prawo do skargi do PUODO.</li>
                  </ul>
                  <p className="text-muted mb-0">Aby skorzystać z praw, napisz: kontakt@sitespector.pl.</p>

                  <h2 className="h4 text-primary mt-4 mb-3">8. Cookies</h2>
                  <p className="text-muted">
                    Serwis korzysta z cookies niezbędnych do działania (sesja/logowanie) oraz cookies Stripe w celu realizacji płatności. Nie wykorzystujemy cookies
                    śledzących w celach reklamowych.
                  </p>
                </div>

                <div className="bg-light rounded-4 border p-4 p-lg-5 mt-5 text-center shadow-sm">
                  <div className="title-sm">
                    <span>POTRZEBUJESZ POMOCY?</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Masz pytania o dane i prywatność?</h3>
                  <p className="text-muted mb-4">Napisz do nas lub uruchom pierwszy audyt i zobacz, jakie informacje są zapisywane w Twoim workspace.</p>
                  <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
                    <Link href="/kontakt" className="btn btn-outline-primary px-5 py-3 fw-bold">
                      Skontaktuj się z nami
                    </Link>
                    <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                      Rozpocznij darmowy audyt
                    </Link>
                  </div>
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
