import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Polityka cookies — SiteSpector | Pliki cookies',
  description:
    'Jak SiteSpector używa plików cookies. Lista cookies: Supabase (sesja), Stripe, next-auth. Brak cookies śledzących. Instrukcje zarządzania.',
  keywords: ['polityka cookies SiteSpector', 'cookies', 'pliki cookies', 'RODO'],
  path: '/polityka-cookies',
  ogImageType: 'page',
});

export default function PolitykaCookiesPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/polityka-cookies',
            title: 'Polityka cookies — SiteSpector | Pliki cookies',
            description:
              'Jak SiteSpector używa plików cookies. Lista cookies: Supabase (sesja), Stripe, next-auth. Brak cookies śledzących. Instrukcje zarządzania.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Polityka cookies', path: '/polityka-cookies' },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <h1 className="display-4 fw-bold text-primary mb-2">Polityka cookies</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h2 className="h4 text-primary mt-4 mb-3">1. Czym są cookies</h2>
                  <p className="text-muted">
                    Pliki cookies to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu podczas odwiedzania stron internetowych. Służą m.in. do utrzymania
                    sesji, zapamiętania preferencji i obsługi płatności. Serwis SiteSpector korzysta wyłącznie z cookies niezbędnych do działania platformy i nie
                    stosuje cookies śledzących w celach reklamowych.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">2. Tabela cookies</h2>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle bg-white">
                      <thead className="bg-light">
                        <tr>
                          <th>Nazwa / prefiks</th>
                          <th>Dostawca</th>
                          <th>Cel</th>
                          <th>Czas przechowywania</th>
                          <th>Wymagane</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>sb-*</td>
                          <td>Supabase</td>
                          <td>Sesja użytkownika, autentykacja</td>
                          <td>Sesja / do 7 dni</td>
                          <td>Tak</td>
                        </tr>
                        <tr>
                          <td>_stripe_mid</td>
                          <td>Stripe</td>
                          <td>Identyfikacja użytkownika przy płatnościach (anty-fraud)</td>
                          <td>1 rok</td>
                          <td>Tak (przy płatnościach)</td>
                        </tr>
                        <tr>
                          <td>next-auth.session-token</td>
                          <td>NextAuth</td>
                          <td>Sesja logowania</td>
                          <td>Sesja</td>
                          <td>Tak</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted small mb-0">
                    `sb-*` oznacza prefiks plików cookies Supabase (np. `sb-xxxxx-auth-token`). Konkretne nazwy mogą się różnić w zależności od konfiguracji.
                  </p>
                  <p className="text-muted mt-3">
                    <strong>Brak cookies śledzących:</strong> nie używamy Google Analytics, Facebook Pixel ani innych narzędzi śledzenia w celach reklamowych.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">3. Zarządzanie cookies</h2>
                  <p className="text-muted mb-2">Możesz zarządzać cookies w ustawieniach przeglądarki:</p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• Chrome: Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn</li>
                    <li>• Firefox: Ustawienia → Prywatność i bezpieczeństwo → Ciasteczka i dane stron</li>
                    <li>• Safari: Preferencje → Prywatność → Zarządzaj danymi witryn</li>
                    <li>• Edge: Ustawienia → Pliki cookie i uprawnienia witryny</li>
                  </ul>
                  <p className="text-muted">
                    Ograniczenie lub zablokowanie cookies niezbędnych może skutkować brakiem możliwości logowania lub korzystania z pełnej funkcjonalności serwisu
                    (np. płatności przez Stripe).
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">4. Aktualizacje</h2>
                  <p className="text-muted">
                    Polityka cookies może być aktualizowana w miarę zmian w Serwisie lub przepisach. O istotnych zmianach poinformujemy na stronie.
                  </p>
                  <p className="text-muted mb-0">
                    Więcej informacji o przetwarzaniu danych znajdziesz w{' '}
                    <Link href="/polityka-prywatnosci">Polityce prywatności</Link>.
                  </p>
                </div>

                <div className="bg-light rounded-4 border p-4 p-lg-5 mt-5 text-center shadow-sm">
                  <div className="title-sm">
                    <span>GOTOWY NA AUDYT?</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Sprawdź SiteSpector na własnej stronie</h3>
                  <p className="text-muted mb-4">Oferta i szczegóły pakietów są w przygotowaniu.</p>
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                    Skontaktuj się z nami
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
