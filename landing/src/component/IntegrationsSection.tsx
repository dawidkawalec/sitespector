'use client';

import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import {
  RiSearchEyeLine,
  RiFlashlightLine,
  RiRobotLine,
  RiBankCardLine,
  RiShieldUserLine,
  RiTerminalBoxLine,
  RiLineChartLine,
} from 'react-icons/ri';

const integrationsData = [
  {
    id: 1,
    icon: RiSearchEyeLine,
    title: 'Screaming Frog',
    description: 'Branżowy standard crawlingu SEO. Analiza meta tagów, nagłówków, linków, obrazów i struktury strony.',
    color: 'success'
  },
  {
    id: 2,
    icon: RiFlashlightLine,
    title: 'Google Lighthouse',
    description: 'Oficjalne narzędzie Google. Core Web Vitals, Performance Score, Accessibility – desktop i mobile.',
    color: 'warning'
  },
  {
    id: 7,
    icon: RiLineChartLine,
    title: 'Senuto',
    description: 'Widoczność, pozycje i trendy oraz backlinki. Dodatkowo monitoring AI Overviews na polskim rynku.',
    color: 'orange'
  },
  {
    id: 3,
    icon: RiRobotLine,
    title: 'Google Gemini AI',
    description: 'Najnowsza generacja AI od Google. Analiza treści, rekomendacje strategiczne, ocena jakości i czytelności.',
    color: 'primary'
  },
  {
    id: 4,
    icon: RiBankCardLine,
    title: 'Stripe Payments',
    description: 'Bezpieczne płatności z certyfikacją PCI DSS. Karty, subskrypcje, automatyczne faktury.',
    color: 'info'
  },
  {
    id: 5,
    icon: RiShieldUserLine,
    title: 'Supabase Auth',
    description: 'Uwierzytelnianie: email/hasło, Google, GitHub. Row Level Security dla pełnej izolacji danych.',
    color: 'success'
  },
  {
    id: 6,
    icon: RiTerminalBoxLine,
    title: 'REST API',
    description: 'Pełny dostęp programistyczny do audytów i wyników. Integruj SiteSpector ze swoimi narzędziami.',
    color: 'secondary',
    badge: 'Wkrótce'
  }
];

const IntegrationsSection = () => {
  return (
    <section className="section integrations-section py-5 bg-light" id="integrations">
      <Container>
        <Row className="justify-content-center text-center mb-5">
          <Col lg={8}>
            <div className="title-sm">
              <span>EKOSYSTEM</span>
            </div>
            <h2 className="text-primary mt-3">
              Zbudowany na <span className="text-orange text-line">Sprawdzonych narzędziach</span>
            </h2>
            <p className="text-muted mt-4">
              SiteSpector łączy najlepsze rozwiązania branżowe w jedną platformę. Nie wymyślamy koła na nowo – korzystamy ze standardów, którym ufasz.
            </p>
          </Col>
        </Row>
        <Row className="g-4">
          {integrationsData.map((item) => (
            <Col md={6} lg={4} key={item.id}>
              <Card className="h-100 border-0 shadow-sm p-4 rounded-4 hover-lift transition-all">
                <Card.Body className="p-0">
                  <div className={`d-inline-block p-3 bg-${item.color}-subtle rounded-3 text-${item.color} mb-4`}>
                    <item.icon size={32} />
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <h5 className="fw-bold text-primary mb-0">{item.title}</h5>
                    {item.badge && (
                      <Badge bg="secondary" className="ms-2 small">{item.badge}</Badge>
                    )}
                  </div>
                  <p className="text-muted small mb-0">{item.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default IntegrationsSection;
