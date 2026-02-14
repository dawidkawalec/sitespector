import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Regulamin — SiteSpector | Warunki korzystania z serwisu',
  description: 'Regulamin świadczenia usług SiteSpector. Plany, płatności, ochrona danych, odpowiedzialność. Pro $29, Enterprise $99.',
  keywords: ['regulamin SiteSpector', 'warunki korzystania', 'terms of service'],
  path: '/regulamin',
  ogImageType: 'page',
});

export default function RegulaminPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <h1 className="display-4 fw-bold text-primary mb-2">Regulamin świadczenia usług</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h2 className="h4 text-primary mt-4 mb-3">1. Postanowienia ogólne</h2>
                  <p className="text-muted">
                    Niniejszy regulamin (dalej: „Regulamin”) określa warunki świadczenia usług przez SiteSpector (dalej: „Usługodawca”) za pośrednictwem
                    serwisu i platformy audytów SEO (dalej: „Platforma”).
                  </p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• Akceptacja Regulaminu następuje w momencie rejestracji konta lub pierwszego korzystania z Platformy.</li>
                    <li>• Kontynuowanie użytkowania oznacza wyrażenie zgody na jego warunki.</li>
                    <li>• Platforma służy do audytów SEO i widoczności oraz generowania planu wdrożeń (Execution Plan).</li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">2. Definicje</h2>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>
                      • <strong>Audyt</strong> — analiza strony internetowej obejmująca 3 fazy: (1) techniczną (Screaming Frog, Lighthouse, Senuto), (2)
                      analizę AI (Google Gemini), (3) Execution Plan (zadania z priorytetami i kodem).
                    </li>
                    <li>
                      • <strong>Workspace</strong> — przestrzeń robocza przechowująca audyty i dane. W planach Pro/Enterprise można tworzyć wiele workspace&apos;ów i
                      zapraszać zespół.
                    </li>
                    <li>
                      • <strong>Execution Plan</strong> — lista zadań wygenerowanych przez AI (priorytety, quick wins, kod, statusy, notatki).
                    </li>
                    <li>
                      • <strong>Raport</strong> — dokument PDF z wynikami audytu; w Pro/Enterprise dostępny white-label (bez brandingu SiteSpector).
                    </li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">3. Warunki korzystania (plany)</h2>
                  <p className="text-muted">Platforma oferuje trzy plany subskrypcyjne:</p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>
                      • <strong>Free</strong> — 5 audytów miesięcznie, 1 użytkownik, podstawowy raport PDF. Brak dostępu do Senuto/konkurentów/harmonogramów i
                      Execution Plan w pełnej wersji.
                    </li>
                    <li>
                      • <strong>Pro</strong> — <strong>29 USD/mies.</strong>, 50 audytów/mies., zespoły (workspace&apos;y), do 3 konkurentów na audyt, integracja Senuto,
                      zaplanowane audyty, PDF white-label, dostęp do API.
                    </li>
                    <li>
                      • <strong>Enterprise</strong> — <strong>99 USD/mies.</strong>, nielimitowane audyty i użytkownicy, dedykowane wsparcie, SLA, możliwość
                      indywidualnych ustaleń.
                    </li>
                  </ul>
                  <p className="text-muted">
                    Usługodawca zastrzega sobie prawo do zmiany cen z zachowaniem 30-dniowego wyprzedzenia dla Użytkowników z aktywną subskrypcją.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">4. Płatności</h2>
                  <p className="text-muted">
                    Płatności realizowane są przez Stripe. Użytkownik podaje dane karty w Stripe Customer Portal. Usługodawca nie przechowuje numerów kart —
                    przetwarzanie odbywa się wyłącznie przez Stripe (PCI DSS).
                  </p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>• Subskrypcja odnawia się automatycznie co miesiąc.</li>
                    <li>• Anulowanie możliwe w dowolnym momencie; dostęp pozostaje aktywny do końca okresu rozliczeniowego.</li>
                    <li>• Faktury są dostępne w Customer Portal.</li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">5. Ochrona danych</h2>
                  <p className="text-muted">
                    Przetwarzanie danych osobowych podlega Polityce prywatności oraz przepisom RODO. Dane audytów (URL-e, wyniki crawlowania, raporty) są
                    przechowywane w infrastrukturze w UE.
                  </p>
                  <ul className="list-unstyled ms-3 text-muted">
                    <li>
                      • Więcej informacji: <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
                    </li>
                  </ul>

                  <h2 className="h4 text-primary mt-4 mb-3">6. Odpowiedzialność</h2>
                  <p className="text-muted">
                    Usługodawca świadczy usługi „as is” i nie gwarantuje konkretnych wyników audytu ani wzrostu pozycji. Odpowiedzialność Usługodawcy
                    ograniczona jest do wysokości opłat zapłaconych w ostatnich 12 miesiącach.
                  </p>
                  <p className="text-muted">
                    Integracje z usługami zewnętrznymi (Senuto, Stripe, Google) podlegają ich własnym regulaminom i politykom.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">7. Własność intelektualna</h2>
                  <p className="text-muted">
                    Platforma, jej kod, design i znaki towarowe należą do Usługodawcy. Raporty PDF wygenerowane przez Użytkownika są jego własnością i mogą być
                    wykorzystywane także w formie white-label.
                  </p>

                  <h2 className="h4 text-primary mt-4 mb-3">8. Postanowienia końcowe</h2>
                  <p className="text-muted">
                    Regulamin podlega prawu polskiemu. Spory rozstrzygane są przez sądy właściwe dla siedziby Usługodawcy. Zmiany Regulaminu publikowane są na
                    stronie serwisu; o istotnych zmianach poinformujemy z 14-dniowym wyprzedzeniem.
                  </p>
                  <p className="text-muted mb-0">Kontakt: kontakt@sitespector.pl</p>
                </div>

                <div className="bg-light rounded-4 border p-4 p-lg-5 mt-5 text-center shadow-sm">
                  <div className="title-sm">
                    <span>GOTOWY NA AUDYT?</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Sprawdź SiteSpector w praktyce</h3>
                  <p className="text-muted mb-4">Załóż konto i uruchom pierwszy audyt. Plan Free nie wymaga karty.</p>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Rozpocznij darmowy audyt
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
