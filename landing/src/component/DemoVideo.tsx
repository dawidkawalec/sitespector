'use client';

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { RiSearchLine, RiTimerLine, RiFilePaper2Line } from 'react-icons/ri';

const DemoVideo = () => {
  // Placeholder URL - to be replaced with actual video URL
  const VIDEO_URL = ""; 

  return (
    <section className="section demo-section py-5 bg-white" id="demo">
      <Container>
        <Row className="justify-content-center text-center mb-5">
          <Col lg={8}>
            <div className="title-sm">
              <span>ZOBACZ JAK TO DZIAŁA</span>
            </div>
            <h2 className="text-primary mt-3">
              Od URL do raportu w <span className="text-orange text-line">3 minuty</span>
            </h2>
            <p className="text-muted mt-4">
              Wpisz adres strony, dodaj konkurentów i poczekaj na wyniki. SiteSpector przeanalizuje techniczne SEO (Screaming Frog), wydajność (Lighthouse) i treść (AI Gemini), a następnie wygeneruje profesjonalny raport PDF.
            </p>
          </Col>
        </Row>

        <Row className="justify-content-center mb-5">
          <Col lg={10}>
            <div className="ratio ratio-16x9 shadow-lg rounded-4 overflow-hidden bg-light border">
              {VIDEO_URL ? (
                <iframe
                  src={VIDEO_URL}
                  title="SiteSpector Demo"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted p-5">
                  <div className="bg-white p-4 rounded-circle shadow-sm mb-4">
                    <RiFilePaper2Line size={60} className="text-orange" />
                  </div>
                  <h4>Wideo w przygotowaniu</h4>
                  <p>Już wkrótce zobaczysz tutaj pełną prezentację możliwości SiteSpector.</p>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Row className="g-4 mt-4">
          <Col md={4}>
            <div className="text-center p-4">
              <div className="mb-3 text-orange">
                <RiSearchLine size={40} />
              </div>
              <h5 className="fw-bold text-primary">1. Wpisz URL strony</h5>
              <p className="text-muted small">Dodaj adres i opcjonalnie do 3 konkurentów.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-4">
              <div className="mb-3 text-orange">
                <RiTimerLine size={40} />
              </div>
              <h5 className="fw-bold text-primary">2. Poczekaj 1-3 minuty</h5>
              <p className="text-muted small">Screaming Frog crawluje stronę, Lighthouse mierzy wydajność, AI analizuje treść.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-4">
              <div className="mb-3 text-orange">
                <RiFilePaper2Line size={40} />
              </div>
              <h5 className="fw-bold text-primary">3. Pobierz raport PDF</h5>
              <p className="text-muted small">Otrzymujesz profesjonalny raport z rekomendacjami – gotowy do wysłania klientowi.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default DemoVideo;
