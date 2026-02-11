'use client';

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { RiShieldCheckLine, RiEarthLine, RiLockPasswordLine, RiBankCardLine } from 'react-icons/ri';

const trustData = [
  {
    id: 1,
    icon: RiShieldCheckLine,
    title: 'Szyfrowanie SSL',
    description: 'Cała komunikacja chroniona certyfikatem Let\'s Encrypt. Protokoły TLS 1.2 i 1.3.'
  },
  {
    id: 2,
    icon: RiEarthLine,
    title: 'Dane w Unii Europejskiej',
    description: 'Serwery w Niemczech (Hetzner). Pełna zgodność z RODO. Dane nie opuszczają UE.'
  },
  {
    id: 3,
    icon: RiLockPasswordLine,
    title: 'Izolacja danych',
    description: 'Row Level Security – każdy workspace jest całkowicie oddzielony. Nikt inny nie ma dostępu.'
  },
  {
    id: 4,
    icon: RiBankCardLine,
    title: 'Bezpieczne płatności',
    description: 'Płatności przez Stripe z certyfikacją PCI DSS Level 1. Nie przechowujemy danych kart.'
  }
];

const TrustBadges = () => {
  return (
    <section className="section trust-section py-5">
      <Container>
        <Row className="justify-content-center text-center mb-5">
          <Col lg={7}>
            <div className="title-sm">
              <span>BEZPIECZEŃSTWO</span>
            </div>
            <h2 className="text-primary mt-3">
              Twoje dane są <span className="text-orange text-line">Bezpieczne</span>
            </h2>
          </Col>
        </Row>
        <Row className="g-4">
          {trustData.map((item) => (
            <Col md={6} lg={3} key={item.id}>
              <div className="text-center p-4 h-100">
                <div className="mb-4 d-inline-block p-3 bg-orange-subtle rounded-circle text-orange">
                  <item.icon size={40} />
                </div>
                <h5 className="fw-bold text-primary mb-3">{item.title}</h5>
                <p className="text-muted small mb-0">{item.description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TrustBadges;
