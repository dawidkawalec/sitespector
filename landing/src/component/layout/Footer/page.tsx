'use client';

import { currentYear } from '@/component/CurrentYear';
import Link from 'next/link';
import React, { useState } from 'react';
import { Col, Container, Row, Form, Spinner } from 'react-bootstrap';
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
      { label: 'Funkcje', link: '/funkcje' },
      { label: 'Jak to działa', link: '/jak-to-dziala' },
      { label: 'Integracje', link: '/integracje' },
      { label: 'Porównanie', link: '/porownanie' },
      { label: 'Cennik', link: '/cennik' },
    ],
  },
  {
    heading: 'Dla kogo :',
    links: [
      { label: 'Dla e-commerce', link: '/dla-ecommerce' },
      { label: 'Dla agencji SEO', link: '/dla-agencji-seo' },
      { label: 'Dla freelancerów', link: '/dla-freelancerow' },
      { label: 'Dla menedżerów', link: '/dla-managerow' },
      { label: 'Sprawdź agencję SEO', link: '/sprawdz-agencje-seo' },
    ],
  },
  {
    heading: 'Zasoby :',
    links: [
      { label: 'Blog', link: '/blog' },
      { label: 'Case studies', link: '/case-study' },
      { label: 'Centrum pomocy', link: '/docs' },
      { label: 'Changelog', link: '/changelog' },
    ],
  },
  {
    heading: 'Firma :',
    links: [
      { label: 'O nas', link: '/o-nas' },
      { label: 'Kontakt', link: '/kontakt' },
      { label: 'Regulamin', link: '/regulamin' },
      { label: 'Polityka prywatności', link: '/polityka-prywatnosci' },
      { label: 'Polityka cookies', link: '/polityka-cookies' },
      { label: 'Sitemap', link: '/sitemap' },
    ],
  },
];

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sitespector.app';
      const response = await fetch(`${appUrl}/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Dziękujemy za zapis!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.detail || 'Wystąpił błąd. Spróbuj ponownie.');
      }
    } catch {
      setStatus('error');
      setMessage('Błąd połączenia. Spróbuj ponownie później.');
    }
  };

  return (
    <>
      <footer className="section footer-part-3 py-5 footer-part">
        <Container>
          <Row className="my-5 justify-content-between g-4">
            <Col lg={4} className="align-self-start">
              <div className="footer-about">
                <div className="logo">
                  <Link className="navbar-caption fs-5 text-light ls-1 fw-bold d-inline-flex align-items-center text-nowrap" href="/">
                    <RiSearchEyeFill size={29} className="text-orange fs-4 me-1 flex-shrink-0" />
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
                  <Form onSubmit={handleNewsletterSubmit} className="d-flex align-items-center flex-wrap">
                    <div className="d-flex w-100 align-items-center">
                      <Form.Control 
                        type="email" 
                        placeholder="Twój email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === 'loading'}
                        className="bg-dark text-white border-secondary"
                      />
                      <button 
                        type="submit" 
                        className="btn btn-link p-0 ms-2 text-orange"
                        disabled={status === 'loading'}
                      >
                        {status === 'loading' ? (
                          <Spinner animation="border" size="sm" variant="orange" />
                        ) : (
                          <RiSendPlane2Line size={24} />
                        )}
                      </button>
                    </div>
                    {status === 'success' && (
                      <div className="text-success small mt-2 w-100">{message}</div>
                    )}
                    {status === 'error' && (
                      <div className="text-danger small mt-2 w-100">{message}</div>
                    )}
                  </Form>
                </div>
                <div className="copy-info text-white-50 mt-4">
                  © {currentYear} SiteSpector
                </div>
              </div>
            </Col>
            {footerData.map((column, index) => (
              <Col lg={2} md={4} xs={6} key={index} className="mt-4 mt-lg-0">
                <h5 className="text-light fs-5">{column.heading}</h5>
                <ul className="list-unstyled mt-4">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="mb-2">
                      <Link href={link.link} className="text-white-50 text-decoration-none hover-white">
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
