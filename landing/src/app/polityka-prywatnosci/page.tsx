import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';

export default function PolitykaPrywatnosciPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10}>
                <h1 className="display-4 fw-bold text-primary mb-4">Polityka prywatności</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h3 className="text-primary mt-4 mb-3">1. ADMINISTRATOR DANYCH</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• SiteSpector, Warszawa, Polska.</li>
                    <li>• Kontakt: kontakt@sitespector.pl</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">2. JAKIE DANE ZBIERAMY</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• <strong>Dane rejestracyjne:</strong> email, hasło (hashowane), metoda logowania (OAuth/email).</li>
                    <li>• <strong>Dane audytów:</strong> URL audytowanej strony, wyniki analizy, wygenerowane raporty.</li>
                    <li>• <strong>Dane techniczne:</strong> adres IP, typ przeglądarki (logi serwera).</li>
                    <li>• <strong>Dane rozliczeniowe:</strong> obsługiwane przez Stripe (nie przechowujemy danych kart płatniczych).</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">3. CEL PRZETWARZANIA</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Świadczenie usługi (audyty, raporty PDF).</li>
                    <li>• Obsługa konta i rozliczeń.</li>
                    <li>• Komunikacja (wsparcie techniczne, powiadomienia o systemie).</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">4. GDZIE PRZECHOWUJEMY DANE</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Baza Supabase: użytkownicy, zespoły, subskrypcje (infrastruktura AWS EU).</li>
                    <li>• Baza VPS: audyty, wyniki techniczne (Hetzner, Niemcy – UE).</li>
                    <li>• Płatności: Stripe (certyfikacja PCI DSS).</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">5. UDOSTĘPNIANIE DANYCH</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Stripe – obsługa płatności.</li>
                    <li>• Google (Gemini API) – analiza treści (przesyłamy techniczne dane strony: tytuł, opis, nagłówki).</li>
                    <li>• Nie sprzedajemy danych osobom trzecim.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">6. OKRES PRZECHOWYWANIA</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Dane konta: do momentu usunięcia konta przez użytkownika.</li>
                    <li>• Wyniki audytów: do momentu usunięcia przez użytkownika.</li>
                    <li>• Logi serwera: 30 dni.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">7. PRAWA UŻYTKOWNIKA (RODO)</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Masz prawo do: dostępu, sprostowania, usunięcia, przenoszenia danych oraz sprzeciwu.</li>
                    <li>• Kontakt: kontakt@sitespector.pl</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">8. PLIKI COOKIES</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• Sesja uwierzytelniania (Supabase) – niezbędne do działania.</li>
                    <li>• Brak cookies reklamowych i śledzących.</li>
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
