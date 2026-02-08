import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import Dashboard from '@/assets/images/Dashboard.png';

const Hero = () => {
  return (
    <>
      <section className="hero-section bg-img-1 bg-home-1  pb-0" id="home">
        <Container>
          <Row className="align-items-center justify-content-center text-center">
            <Col lg={10}>
              <h1 className="display-3 fw-semibold lh-base text-primary">
                Zdominuj wyniki wyszukiwania z{' '}
                <span className="text-orange text-line">SiteSpector</span>
              </h1>
              <p className="mt-4">
                Kompleksowa platforma do audytów SEO, analizy wydajności i monitorowania konkurencji. Wykrywaj błędy, optymalizuj treści z pomocą AI i generuj profesjonalne raporty PDF w kilka minut.
              </p>
              <div className="main-btn my-5">
                <Link href="/login" className="btn btn-primary my-2">
                  Rozpocznij Darmowy Audyt
                </Link>
                <Link href="#about" className="btn btn-outline-primary ms-2">
                  Zobacz Demo
                </Link>
              </div>
              <Image src={Dashboard} alt="Dashboard" className="img-fluid mt-5 rounded-4" />
            </Col>
          </Row>
        </Container>
      </section>
      <div className="position-relative">
        <div className="shape">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width={1440}
            height={150}
            preserveAspectRatio="none"
            viewBox="0 0 1440 150"
          >
            <g mask='url("#SvgjsMask1022")' fill="none">
              <path
                d="M 0,58 C 144,73 432,131.8 720,133 C 1008,134.2 1296,77.8 1440,64L1440 250L0 250z"
                fill="rgba(255, 255, 255, 1)"
              />
            </g>
            <defs>
              <mask id="SvgjsMask1022">
                <rect width={1440} height={250} fill="#ffffff" />
              </mask>
            </defs>
          </svg>
        </div>
      </div>
    </>
  );
};

export default Hero;
