'use client';

import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { RiDoubleQuotesL } from 'react-icons/ri';
import Image from 'next/image';

const testimonialsData = [
  {
    id: 1,
    name: 'Marek W.',
    role: 'SEO Manager',
    company: 'Agencja WebPro',
    quote: 'SiteSpector zastąpił nam trzy osobne narzędzia. Audyt techniczny, Lighthouse i rekomendacje AI – wszystko w jednym panelu. Raporty PDF wysyłamy klientom od razu, bez dodatkowego formatowania.',
    avatar: 'https://i.pravatar.cc/150?u=marek'
  },
  {
    id: 2,
    name: 'Anna K.',
    role: 'Właścicielka',
    company: 'Studio Graficzne Pixel',
    quote: 'Jako mała firma nie mogłam sobie pozwolić na drogie narzędzia SEO. Darmowy plan SiteSpector dał mi dokładnie to, czego potrzebowałam – szybki audyt mojej strony z konkretnymi wskazówkami co poprawić.',
    avatar: 'https://i.pravatar.cc/150?u=anna'
  },
  {
    id: 3,
    name: 'Tomek R.',
    role: 'CTO',
    company: 'E-commerce Fashion House',
    quote: 'Core Web Vitals były naszym problemem. SiteSpector pokazał dokładnie gdzie gubimy miliseundy – LCP, TTFB, CLS. Po wdrożeniu rekomendacji nasz Performance Score wzrósł z 45 do 82.',
    avatar: 'https://i.pravatar.cc/150?u=tomek'
  },
  {
    id: 4,
    name: 'Karolina M.',
    role: 'Head of Digital',
    company: 'Agencja SEO Rank+',
    quote: 'Workspace\'y i role w zespole to game-changer. Każdy z naszych 8 specjalistów ma dostęp do własnych projektów, a ja widzę wszystko. Porównanie z konkurencją oszczędza nam godziny ręcznej analizy.',
    avatar: 'https://i.pravatar.cc/150?u=karolina'
  }
];

const Testimonials = () => {
  return (
    <section className="section testimonials-section bg-light" id="testimonials">
      <Container>
        <Row className="justify-content-center text-center mb-5">
          <Col lg={7}>
            <div className="title-sm">
              <span>CO MÓWIĄ O NAS</span>
            </div>
            <h2 className="text-primary mt-3">
              Zaufali nam <span className="text-orange text-line">Profesjonaliści</span>
            </h2>
          </Col>
        </Row>
        <Row className="g-4">
          {testimonialsData.map((t) => (
            <Col md={6} lg={3} key={t.id}>
              <Card className="h-100 border-0 shadow-sm p-4 rounded-4">
                <Card.Body className="p-0 d-flex flex-column">
                  <div className="text-orange mb-3">
                    <RiDoubleQuotesL size={40} />
                  </div>
                  <Card.Text className="text-muted mb-4 flex-grow-1 italic">
                    "{t.quote}"
                  </Card.Text>
                  <div className="d-flex align-items-center mt-auto">
                    <div className="flex-shrink-0">
                      <div className="rounded-circle overflow-hidden" style={{ width: '50px', height: '50px' }}>
                        <img src={t.avatar} alt={t.name} width={50} height={50} />
                      </div>
                    </div>
                    <div className="ms-3">
                      <h6 className="mb-0 fw-bold text-primary">{t.name}</h6>
                      <p className="small text-muted mb-0">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Testimonials;
