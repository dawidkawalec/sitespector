'use client';

import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiCheckLine } from 'react-icons/ri';
import Link from 'next/link';

const caseStudies = [
  {
    id: 1,
    title: 'Agencja WebPro: audyty dla 15 klientów w jednym panelu',
    category: 'Agencja SEO',
    challenge: 'Agencja SEO z 15 klientami używała osobno Screaming Frog (licencja), PageSpeed Insights (ręcznie) i ChatGPT (do rekomendacji). Każdy audyt zajmował 2-3 godziny, wliczając formatowanie raportu.',
    solution: 'SiteSpector Plan Pro – jeden audyt zamiast trzech narzędzi. Workspace per klient, automatyczne raporty PDF.',
    results: [
      'Czas audytu: z 2-3h do 3 minut (na stronę)',
      'Koszt narzędzi: z ~800 PLN/mc do 29 USD/mc',
      'Raporty: automatyczne PDF gotowe do wysłania – zero formatowania',
      'Zespół: 3 specjalistów pracujących w jednym workspace'
    ]
  },
  {
    id: 2,
    title: 'E-commerce FashionHouse: poprawa Core Web Vitals',
    category: 'E-commerce',
    challenge: 'Sklep online z Performance Score 45/100. Problemy: LCP > 5s (duże obrazy), CLS > 0.3 (dynamiczne bannery), TTFB > 1s (wolny hosting).',
    solution: 'Audyt SiteSpector z analizą konkurencji (3 główne sklepy z branży). Raport PDF z Action Plan identyfikującym krytyczne problemy.',
    results: [
      'Performance Score: z 45 na 82 (+37 punktów)',
      'LCP: z 5.2s na 1.8s (optymalizacja obrazów, lazy loading)',
      'CLS: z 0.3 na 0.05 (stałe wymiary elementów)',
      'Pozycja w Google: wzrost o 12 pozycji na główne frazy w 2 miesiące'
    ]
  }
];

export default function CaseStudyPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Historie sukcesu</h1>
                <p className="lead text-muted">Zobacz, jak SiteSpector pomaga agencjom i firmom osiągać lepsze wyniki w wyszukiwarkach.</p>
              </Col>
            </Row>

            <Row className="g-5">
              {caseStudies.map((cs) => (
                <Col lg={12} key={cs.id}>
                  <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <Row className="g-0">
                      <Col lg={4} className="bg-orange p-5 d-flex flex-column justify-content-center text-white">
                        <Badge bg="white" text="orange" className="align-self-start mb-3 px-3 py-2">
                          {cs.category}
                        </Badge>
                        <h2 className="fw-bold mb-0">{cs.title}</h2>
                      </Col>
                      <Col lg={8}>
                        <Card.Body className="p-5">
                          <Row className="g-4">
                            <Col md={6}>
                              <h5 className="fw-bold text-primary mb-3">WYZWANIE</h5>
                              <p className="text-muted small lh-lg">{cs.challenge}</p>
                              
                              <h5 className="fw-bold text-primary mt-4 mb-3">ROZWIĄZANIE</h5>
                              <p className="text-muted small lh-lg">{cs.solution}</p>
                            </Col>
                            <Col md={6}>
                              <div className="bg-light p-4 rounded-4 h-100">
                                <h5 className="fw-bold text-primary mb-4">WYNIKI</h5>
                                <ul className="list-unstyled mb-0">
                                  {cs.results.map((res, idx) => (
                                    <li key={idx} className="d-flex mb-3 small">
                                      <RiCheckLine size={20} className="text-orange flex-shrink-0 me-2" />
                                      <span className="text-dark fw-medium">{res}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="mt-5 text-center py-5">
              <h3 className="text-primary mb-4">Chcesz dołączyć do grona zadowolonych klientów?</h3>
              <Link href="/login" className="btn btn-orange px-5 py-3 fw-bold text-white">
                Rozpocznij darmowy audyt teraz
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
