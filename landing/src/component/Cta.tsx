'use client';

import { Player, Player as PlayerType } from '@lordicon/react';
import { useEffect, useRef } from 'react';

import addressIcon from '@/assets/icons/address.json';
import mailIcon from '@/assets/icons/mail.json';
import phoneIcon from '@/assets/icons/phone.json';
import { OFFER_PLACEHOLDER_COPY } from '@/lib/offerPlaceholder';
import { Col, Container, Row } from 'react-bootstrap';
import Link from 'next/link';

export interface CtaItem {
  icon: object;
  title: string;
  description: string;
  colors: string;
}

export const ctaData: CtaItem[] = [
  {
    icon: addressIcon,
    title: 'Biuro Główne',
    description: 'Warszawa, Polska',
    colors: 'primary:#121331,secondary:#ee8f66',
  },
  {
    icon: phoneIcon,
    title: 'Infolinia',
    description: '+48 123 456 789',
    colors: 'primary:#121331,secondary:#ee8f66,tertiary:#ebe6ef',
  },
  {
    icon: mailIcon,
    title: 'Wsparcie',
    description: 'kontakt@sitespector.pl',
    colors: 'primary:#121331,secondary:#ebe6ef,tertiary:#ee8f66,quaternary:#3a3347',
  },
];

const Cta = () => {
  const refs = useRef<(PlayerType | null)[]>([]);

  useEffect(() => {
    refs.current.forEach(ref => {
      ref?.playFromBeginning();
    });
  }, []);

  return (
    <section className="section cta-section bg-light" id="contacts">
      <Container>
        <Row className="align-items-center justify-content-center">
          {ctaData.map((item, index) => (
            <Col lg={4} key={index}>
              <div className="d-flex bg-white p-3 shadow-sm">
                <Player
                  ref={el => {
                    refs.current[index] = el;
                  }}
                  icon={item.icon}
                  size={80}
                  colors={item.colors}
                  onComplete={() => refs.current[index]?.playFromBeginning()}
                />
                <div className="d-block align-self-center ms-4">
                  <h4 className="fw-semibold text-primary">{item.title}</h4>
                  <span>{item.description}</span>
                </div>
              </div>
            </Col>
          ))}
        </Row>
        <Row className="justify-content-center text-center mt-5">
          <Col lg={8}>
            <h3 className="text-primary fw-bold mb-3">{OFFER_PLACEHOLDER_COPY.title}</h3>
            <p className="text-muted mb-4">
              Wkrótce opublikujemy finalne pakiety. Jeśli chcesz poznać aktualne możliwości SiteSpector, skontaktuj się z nami.
            </p>
            <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
              {OFFER_PLACEHOLDER_COPY.cta}
            </Link>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Cta;
