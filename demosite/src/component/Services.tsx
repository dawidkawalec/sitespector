'use client';

import Dashboard from '@/assets/images/dashbord-4.png';
import Image from 'next/image';
import { Col, Container, Row } from 'react-bootstrap';
import CountUp from 'react-countup';
import { RiCheckboxBlankCircleFill, RiStarFill, RiStarHalfFill } from 'react-icons/ri';

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
                  Nasze algorytmy analizują setki czynników rankingowych w czasie rzeczywistym. Otrzymujesz priorytetyzowaną listę zadań, które mają największy wpływ na Twoją pozycję w wynikach wyszukiwania.
                </p>
              </div>
              <Row className="mt-4">
                <Col lg={6}>
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      <CountUp end={200} duration={5} suffix="K+" />
                    </h3>
                    <h6 className="text-muted">Przeanalizowanych podstron</h6>
                  </div>
                </Col>
                <Col lg={6}>
                  <div className="counter">
                    <h3 className="text-primary fw-bold">
                      <CountUp end={98} duration={5} suffix="%" />{' '}
                      <span className="fs-6 text-muted">(Zadowolonych Agencji)</span>
                    </h3>
                    <ul className="d-flex text-orange">
                      <li>
                        <RiStarFill />
                      </li>
                      <li>
                        <RiStarFill />
                      </li>
                      <li>
                        <RiStarFill />
                      </li>
                      <li>
                        <RiStarFill />
                      </li>
                      <li>
                        <RiStarFill />
                      </li>
                    </ul>
                  </div>
                </Col>
              </Row>
              <ul className="services-detail mt-4">
                <li>
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Analiza techniczna on-site i off-site</h6>
                </li>
                <li className="my-3">
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Weryfikacja unikalności treści przez AI</h6>
                </li>
                <li>
                  <RiCheckboxBlankCircleFill className="text-orange me-3" />
                  <h6 className="text-dark">Porównanie parametrów z liderami branży</h6>
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
