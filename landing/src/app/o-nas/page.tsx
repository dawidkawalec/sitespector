import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiCheckLine } from 'react-icons/ri';

export default function ONasPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={10} className="text-center">
                <h1 className="display-3 fw-bold text-primary mb-4">O SiteSpector</h1>
                <h2 className="h3 text-orange mb-5">Budujemy narzędzia, które pomagają firmom rosnąć w internecie</h2>
              </Col>
            </Row>

            <Row className="justify-content-center g-5 align-items-center mb-5">
              <Col lg={6}>
                <div className="pe-lg-5">
                  <p className="lead text-dark mb-4">
                    SiteSpector powstał z frustracji. Jako specjaliści SEO codziennie używaliśmy kilku drogich narzędzi: jednego do crawlingu, drugiego do testów wydajności, trzeciego do analizy treści.
                  </p>
                  <p className="text-muted mb-4">
                    Każde z nich z osobna kosztowało setki złotych miesięcznie, wymagało osobnej konfiguracji i eksportowania danych do wspólnych raportów. Postanowiliśmy to zmienić i stworzyć jedną, zintegrowaną platformę, która robi to wszystko automatycznie.
                  </p>
                  <p className="text-muted">
                    Naszą misją jest demokratyzacja profesjonalnej analityki SEO. Chcemy, aby zaawansowane audyty techniczne, które dotąd były zarezerwowane dla największych agencji, były dostępne dla każdego właściciela strony i mniejszego zespołu.
                  </p>
                </div>
              </Col>
              <Col lg={6}>
                <div className="bg-light p-5 rounded-4 border shadow-sm">
                  <h3 className="text-primary mb-4">Co nas wyróżnia?</h3>
                  
                  <div className="d-flex mb-3">
                    <RiCheckLine size={24} className="text-orange flex-shrink-0 mt-1" />
                    <div className="ms-3">
                      <h5 className="mb-1">Jedno narzędzie zamiast trzech</h5>
                      <p className="text-muted small">SiteSpector łączy Screaming Frog, Google Lighthouse i Gemini AI w jednej platformie.</p>
                    </div>
                  </div>

                  <div className="d-flex mb-3">
                    <RiCheckLine size={24} className="text-orange flex-shrink-0 mt-1" />
                    <div className="ms-3">
                      <h5 className="mb-1">Raporty gotowe dla klienta</h5>
                      <p className="text-muted small">Generujesz profesjonalny PDF z 9 sekcjami, gotowy do wysłania bez dodatkowej edycji.</p>
                    </div>
                  </div>

                  <div className="d-flex mb-3">
                    <RiCheckLine size={24} className="text-orange flex-shrink-0 mt-1" />
                    <div className="ms-3">
                      <h5 className="mb-1">Dla agencji i zespołów</h5>
                      <p className="text-muted small">Workspace'y z rolami i izolacją danych zapewniają bezpieczeństwo i porządek w pracy.</p>
                    </div>
                  </div>

                  <div className="d-flex">
                    <RiCheckLine size={24} className="text-orange flex-shrink-0 mt-1" />
                    <div className="ms-3">
                      <h5 className="mb-1">Dane w Unii Europejskiej</h5>
                      <p className="text-muted small">Infrastruktura na serwerach Hetzner w Niemczech zapewnia pełną zgodność z RODO.</p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="py-5">
              <Col lg={12} className="text-center mb-5">
                <h3 className="text-primary">Nasza technologia</h3>
                <p className="text-muted">SiteSpector opiera się na sprawdzonych standardach branżowych</p>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="p-4">
                  <h5 className="text-primary">Screaming Frog</h5>
                  <p className="small text-muted">Standard w crawlingu SEO do analizy struktury i meta tagów.</p>
                </div>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="p-4">
                  <h5 className="text-primary">Google Lighthouse</h5>
                  <p className="small text-muted">Oficjalne narzędzie Google do mierzenia Core Web Vitals i wydajności.</p>
                </div>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="p-4">
                  <h5 className="text-primary">Google Gemini</h5>
                  <p className="small text-muted">Najnowsza generacja AI do inteligentnej analizy treści i rekomendacji.</p>
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
