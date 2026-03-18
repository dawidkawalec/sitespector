'use client';

import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { RiToolsLine, RiSpeedLine, RiSearchEyeLine, RiRobot2Line } from 'react-icons/ri';

const integrations = [
  {
    id: 1,
    name: 'Screaming Frog',
    role: 'Crawl techniczny',
    description: 'Profesjonalny crawler SEO — meta tagi, linki, przekierowania, kody HTTP, sitemapy. Ten sam silnik co używają największe agencje.',
    icon: RiToolsLine,
  },
  {
    id: 2,
    name: 'Google Lighthouse',
    role: 'Core Web Vitals',
    description: 'Oficjalne narzędzie Google — LCP, CLS, TBT, TTFB, FCP. Audyt desktop i mobile. Wyniki wpływają na ranking.',
    icon: RiSpeedLine,
  },
  {
    id: 3,
    name: 'Senuto',
    role: 'Widoczność w Polsce',
    description: 'Polskie dane widoczności, pozycje fraz, backlinki, AI Overviews. Jedyne narzędzie z natywną bazą polskiego rynku.',
    icon: RiSearchEyeLine,
  },
  {
    id: 4,
    name: 'Google Gemini AI',
    role: 'Analiza i Execution Plan',
    description: 'AI analizuje 9 obszarów strony i generuje Execution Plan z gotowym kodem do wdrożenia. Nie tylko "co poprawić" — ale "jak".',
    icon: RiRobot2Line,
  },
];

const Testimonials = () => {
  return (
    <section className="section testimonials-section bg-light" id="integrations">
      <Container>
        <Row className="justify-content-center text-center mb-5">
          <Col lg={7}>
            <div className="title-sm">
              <span>4 NARZĘDZIA W JEDNYM</span>
            </div>
            <h2 className="text-primary mt-3">
              Łączymy <span className="text-orange text-line">najlepsze narzędzia</span> branży
            </h2>
            <p className="text-muted mt-2">
              Żadne inne narzędzie nie integruje tych czterech technologii w jednej platformie.
            </p>
          </Col>
        </Row>
        <Row className="g-4">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <Col md={6} lg={3} key={item.id}>
                <Card className="h-100 border-0 shadow-sm p-4 rounded-4">
                  <Card.Body className="p-0 d-flex flex-column">
                    <div className="text-orange mb-3">
                      <Icon size={40} />
                    </div>
                    <h5 className="fw-bold text-primary mb-1">{item.name}</h5>
                    <p className="small text-orange fw-semibold mb-2">{item.role}</p>
                    <Card.Text className="text-muted small flex-grow-1">{item.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
};

export default Testimonials;
