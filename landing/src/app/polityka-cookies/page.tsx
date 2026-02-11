import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';

export default function PolitykaCookiesPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10}>
                <h1 className="display-4 fw-bold text-primary mb-4">Polityka cookies</h1>
                <p className="text-muted mb-5">Ostatnia aktualizacja: 11 lutego 2026</p>

                <div className="content-text">
                  <h3 className="text-primary mt-4 mb-3">1. CZYM SĄ PLIKI COOKIES</h3>
                  <p>Pliki cookies (tzw. „ciasteczka”) stanowią dane informatyczne, w szczególności pliki tekstowe, które przechowywane są w urządzeniu końcowym Użytkownika Serwisu i przeznaczone są do korzystania ze stron internetowych Serwisu.</p>

                  <h3 className="text-primary mt-4 mb-3">2. COOKIES UŻYWANE PRZEZ SITESPECTOR</h3>
                  <Table responsive striped bordered hover className="mt-4">
                    <thead>
                      <tr>
                        <th>Nazwa</th>
                        <th>Cel</th>
                        <th>Typ</th>
                        <th>Ważność</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>sb-*</td>
                        <td>Sesja Supabase Auth</td>
                        <td>Niezbędne</td>
                        <td>Sesja</td>
                      </tr>
                      <tr>
                        <td>_stripe_mid</td>
                        <td>Płatności Stripe</td>
                        <td>Niezbędne</td>
                        <td>1 rok</td>
                      </tr>
                      <tr>
                        <td>next-auth.session</td>
                        <td>Sesja Next.js</td>
                        <td>Niezbędne</td>
                        <td>7 dni</td>
                      </tr>
                    </tbody>
                  </Table>

                  <h3 className="text-primary mt-4 mb-3">3. COOKIES STRON TRZECICH</h3>
                  <ul className="list-unstyled ms-3">
                    <li>• <strong>Stripe:</strong> obsługa płatności i zapobieganie oszustwom.</li>
                    <li>• <strong>Brak:</strong> nie używamy Google Analytics, Facebook Pixel ani żadnych innych narzędzi śledzących lub marketingowych.</li>
                  </ul>

                  <h3 className="text-primary mt-4 mb-3">4. ZARZĄDZANIE PLIKAMI COOKIES</h3>
                  <p>Użytkownik może w każdej chwili dokonać zmiany ustawień dotyczących plików cookies w swojej przeglądarce:</p>
                  <ul className="list-unstyled ms-3">
                    <li>• Chrome: Ustawienia &gt; Prywatność i bezpieczeństwo</li>
                    <li>• Firefox: Ustawienia &gt; Prywatność i bezpieczeństwo</li>
                    <li>• Safari: Preferencje &gt; Prywatność</li>
                    <li>• Edge: Ustawienia &gt; Uprawnienia witryny</li>
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
