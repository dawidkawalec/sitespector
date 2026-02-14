'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiMapPinLine, RiMailLine, RiTimeLine, RiCustomerService2Line } from 'react-icons/ri';

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Pytanie o produkt',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sitespector.app';
      const response = await fetch(`${appUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setResponseMessage(data.message || 'Dziękujemy! Odpowiemy w ciągu 24 godzin.');
        setFormData({ name: '', email: '', subject: 'Pytanie o produkt', message: '' });
      } else {
        setStatus('error');
        setResponseMessage(data.detail || 'Wystąpił błąd podczas wysyłania wiadomości.');
      }
    } catch {
      setStatus('error');
      setResponseMessage('Błąd połączenia. Spróbuj ponownie później.');
    }
  };

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Skontaktuj się z nami</h1>
                <p className="lead text-muted">Masz pytania dotyczące SiteSpector? Jesteśmy tutaj, aby pomóc.</p>
              </Col>
            </Row>

            <Row className="g-5">
              <Col lg={5}>
                <div className="bg-light p-5 rounded-4 h-100">
                  <h3 className="text-primary mb-4">Dane kontaktowe</h3>
                  
                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-3 rounded-circle shadow-sm">
                        <RiMapPinLine size={24} className="text-orange" />
                      </div>
                    </div>
                    <div className="ms-4">
                      <h5 className="mb-1">Biuro</h5>
                      <p className="text-muted mb-0">Warszawa, Polska</p>
                    </div>
                  </div>

                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-3 rounded-circle shadow-sm">
                        <RiMailLine size={24} className="text-orange" />
                      </div>
                    </div>
                    <div className="ms-4">
                      <h5 className="mb-1">Email</h5>
                      <p className="text-muted mb-0">kontakt@sitespector.pl</p>
                    </div>
                  </div>

                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-3 rounded-circle shadow-sm">
                        <RiTimeLine size={24} className="text-orange" />
                      </div>
                    </div>
                    <div className="ms-4">
                      <h5 className="mb-1">Godziny wsparcia</h5>
                      <p className="text-muted mb-0">Pon-Pt, 9:00-17:00 CET</p>
                    </div>
                  </div>

                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-3 rounded-circle shadow-sm">
                        <RiCustomerService2Line size={24} className="text-orange" />
                      </div>
                    </div>
                    <div className="ms-4">
                      <h5 className="mb-1">Czas odpowiedzi</h5>
                      <p className="text-muted mb-0">Do 24 godzin w dni robocze</p>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={7}>
                <div className="bg-white p-5 rounded-4 shadow-sm border">
                  <h3 className="text-primary mb-4">Wyślij wiadomość</h3>
                  
                  {status === 'success' && (
                    <Alert variant="success" className="mb-4">
                      {responseMessage}
                    </Alert>
                  )}

                  {status === 'error' && (
                    <Alert variant="danger" className="mb-4">
                      {responseMessage}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="name">
                          <Form.Label>Imię i nazwisko</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Jan Kowalski"
                            disabled={status === 'loading'}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="email">
                          <Form.Label>Adres email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="jan@przyklad.pl"
                            disabled={status === 'loading'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="subject">
                      <Form.Label>Temat</Form.Label>
                      <Form.Select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                      >
                        <option value="Pytanie o produkt">Pytanie o produkt</option>
                        <option value="Wsparcie techniczne">Wsparcie techniczne</option>
                        <option value="Współpraca">Współpraca</option>
                        <option value="Inne">Inne</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="message">
                      <Form.Label>Wiadomość</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        minLength={20}
                        placeholder="W czym możemy Ci pomóc? (min. 20 znaków)"
                        disabled={status === 'loading'}
                      />
                    </Form.Group>

                    <Button
                      variant="orange"
                      type="submit"
                      className="w-100 py-3 fw-bold text-white"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Wysyłanie...
                        </>
                      ) : (
                        'Wyślij wiadomość'
                      )}
                    </Button>
                  </Form>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
