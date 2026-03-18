'use client';

import Dashboard from '@/assets/images/dashbord-4.png';
import Image from 'next/image';
import { Col, Container, Row } from 'react-bootstrap';
import CountUp from 'react-countup';
import { RiCheckboxBlankCircleFill, RiStarFill } from 'react-icons/ri';

const Services = () => {
  return (
    <>
      <section className="section services-section" id="services">
        <Container>
          <Row className="align-items-center justify-content-between">
            <Col lg={6}>
              <Image src={Dashboard} alt="" className="img-fluid" />
            </Col>
            <Col lg={5}>
              <div className="title-sm">
                <span>METRYKI WYDAJNOŚCI</span>
              </div>
              <div className="feature-title main-title mt-3">
                <h2 className="text-primary">
                  Zwiększ widoczność w Google w
                  <span className="text-orange text-line">Kilka Minut</span>
                </h2>
                <p className="my-3">
                  Screaming Frog, Lighthouse, Senuto i Gemini AI analizują Twoją stronę. Otrzymujesz priorytetyzowaną listę zadań w Execution
                  Plan — nie tylko „co poprawić”, ale konkretne kroki z gotowym kodem. 3 fazy audytu: technika → AI → plan
                  wykonania.
                </p>
              </div>
              <Row className="mt-4">
                <Col lg={6}>
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      <CountUp end={4} duration={3} />
                    </h3>
                    <h6 className="text-muted">Narzędzia w jednym</h6>
                  </div>
                </Col>
                <Col lg={6}>
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      $<CountUp end={9} duration={3} suffix=".99" />
                    </h3>
                    <h6 className="text-muted">Najtańszy plan / msc</h6>
                  </div>
                </Col>
                <Col lg={6} className="mt-4 mt-lg-0">
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      <CountUp end={30} duration={3} suffix=" min" />
                    </h3>
                    <h6 className="text-muted">Czas pełnego audytu</h6>
                  </div>
                </Col>
                <Col lg={6} className="mt-4 mt-lg-0">
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      <CountUp end={200} duration={3} />
                    </h3>
                    <h6 className="text-muted">Zadań w Execution Plan</h6>
                  </div>
                </Col>
              </Row>
              <ul className="services-detail mt-4">
                <li>
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Analiza techniczna on-site i off-site (Senuto backlinks)</h6>
                </li>
                <li className="my-3">
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Analiza treści, UX i bezpieczeństwa przez AI</h6>
                </li>
                <li className="my-3">
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Porównanie z konkurencją i benchmarki branżowe</h6>
                </li>
                <li>
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Execution Plan z zadaniami do odznaczania i notatkami</h6>
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Services;
