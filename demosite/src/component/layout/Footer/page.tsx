'use client';

import { currentYear } from '@/component/CurrentYear';
import Link from 'next/link';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { RiSearchEyeFill, RiSendPlane2Line, RiTwitterFill } from 'react-icons/ri';

interface FooterColumn {
  heading: string;
  links: {
    label: string;
    link: string;
  }[];
}

const footerData: FooterColumn[] = [
  {
    heading: 'Produkt :',
    links: [
      { label: 'Funkcje', link: '#about' },
      { label: 'Wydajność', link: '#services' },
      { label: 'Cennik', link: '#price' },
      { label: 'FAQ', link: '#faq' },
    ],
  },
  {
    heading: 'Firma :',
    links: [
      { label: 'O nas', link: '' },
      { label: 'Kariera', link: '' },
      { label: 'Kontakt', link: '#contacts' },
    ],
  },
  {
    heading: 'Wsparcie :',
    links: [
      { label: 'Zaloguj się / Załóż konto', link: '/login' },
      { label: 'Dokumentacja', link: '' },
    ],
  },
];

const Footer = () => {
  return (
    <>
      <footer className="section footer-part-3 py-5 footer-part">
        <Container>
          <Row className="my-5 justify-content-between">
            <Col lg={4} className="align-self-start">
              <div className="footer-about">
                <div className="logo">
                  <Link className="navbar-caption fs-4 text-light ls-1 fw-bold" href="/">
                    <RiSearchEyeFill size={29} className="text-orange fs-4 mb-1 me-1" />
                    SiteSpector
                  </Link>
                </div>
                <div className="d-flex mt-4">
                  <RiTwitterFill size={28} className="fs-5 me-3 text-orange" />
                  <p className="text-white-50">
                    Profesjonalna platforma do audytów SEO i optymalizacji stron internetowych.
                  </p>
                </div>
                <h5 className="text-white mt-3">Zapisz się do newslettera :</h5>
                <div className="form-button mt-4">
                  <form action="" className="d-flex align-items-center ">
                    <input type="email" className="form-control" placeholder="Twój email" />
                    <Link href="" className="me-2">
                      <RiSendPlane2Line />
                    </Link>
                  </form>
                </div>
                <div className="copy-info text-white-50 mt-4">
                  © {currentYear} SiteSpector
                </div>
              </div>
            </Col>
            {footerData.map((column, index) => (
              <Col lg={2} md={4} xs={12} key={index}>
                <h5 className="text-light fs-5">{column.heading}</h5>
                <ul className="list-unstyled mt-4">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.link} className="text-white-50">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Col>
            ))}
          </Row>
        </Container>
      </footer>
    </>
  );
};

export default Footer;
