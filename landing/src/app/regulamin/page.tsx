import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';

export default function RegulaminPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10}>
                <h1 className="display-4 fw-bold text-primary mb-4">Regulamin serwisu SiteSpector</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h3 className="text-primary mt-4 mb-3">1. POSTANOWIENIA OGÓLNE</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Właściciel serwisu: SiteSpector, Warszawa, Polska.</li>
                    <li>• Serwis dostępny jest pod adresem: sitespector.app.</li>
                    <li>• Przeznaczenie: audyty techniczne SEO, analiza wydajności, raporty AI.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">2. DEFINICJE</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• <strong>Audyt:</strong> automatyczna analiza strony (crawling Screaming Frog + Lighthouse + AI Gemini).</li>
                    <li>• <strong>Workspace:</strong> izolowana przestrzeń robocza użytkownika lub zespołu.</li>
                    <li>• <strong>Raport PDF:</strong> wygenerowany dokument z wynikami audytu (9 sekcji).</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">3. WARUNKI KORZYSTANIA</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Rejestracja: wymagany adres email + hasło lub OAuth (Google, GitHub).</li>
                    <li>• Plan Free: 5 audytów/mc, 1 użytkownik.</li>
                    <li>• Plan Pro: 50 audytów/mc, zespoły, analiza konkurencji, PDF white-label.</li>
                    <li>• Plan Enterprise: bez limitów, dostęp do API, dedykowane wsparcie.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">4. PŁATNOŚCI (Stripe)</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Rozliczenia miesięczne, możliwość zmiany planu w każdej chwili.</li>
                    <li>• Darmowy plan bez zobowiązań, brak ukrytych opłat.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">5. OCHRONA DANYCH</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Dane przechowywane na serwerach w UE (Hetzner, Niemcy).</li>
                    <li>• Izolacja danych: Row Level Security na poziomie Workspace.</li>
                    <li>• Szyfrowanie: SSL/TLS (Let's Encrypt).</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">6. ODPOWIEDZIALNOŚĆ</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• SiteSpector dostarcza rekomendacje, nie gwarancje pozycji w wynikach wyszukiwania.</li>
                    <li>• Audyt oparty o narzędzia: Screaming Frog, Lighthouse, Gemini – wyniki zależą od dostępności strony.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">7. WŁASNOŚĆ INTELEKTUALNA</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Raporty PDF generowane przez użytkownika należą do niego.</li>
                    <li>• Treść i design platformy należą do SiteSpector.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">8. POSTANOWIENIA KOŃCOWE</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Prawo polskie, sąd właściwy w Warszawie.</li>
                    <li>• Kontakt: kontakt@sitespector.pl</li>
                  </ul>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
