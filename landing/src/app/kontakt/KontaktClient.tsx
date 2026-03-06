'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { RiMailLine, RiMapPinLine, RiPlayCircleLine, RiTimeLine } from 'react-icons/ri';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const SUBJECT_OPTIONS = ['Pytanie ogólne', 'Wsparcie techniczne', 'Sprzedaż / oferta', 'Współpraca', 'Inne'] as const;
type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

export default function KontaktClient() {
  const defaultSubject: SubjectOption = 'Pytanie ogólne';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: defaultSubject,
    message: '',
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  const contactEndpoint = useMemo(() => {
    // Optional. If not set, we keep UI-only behavior per brief.
    return process.env.NEXT_PUBLIC_CONTACT_ENDPOINT?.trim() || '';
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: defaultSubject, message: '' });
    setStatus('idle');
    setResponseMessage('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Podaj imię i nazwisko.';
    if (!formData.email.trim()) return 'Podaj adres e-mail.';
    if ((formData.message || '').trim().length < 10) return 'Wiadomość musi mieć minimum 10 znaków.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setResponseMessage(validationError);
      return;
    }

    setStatus('loading');

    // UI-first. If endpoint is not configured, we don't send anything.
    if (!contactEndpoint) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setStatus('success');
      setResponseMessage('Dziękujemy! Odpowiemy w ciągu 24 godzin w dni robocze.');
      resetForm();
      return;
    }

    try {
      const response = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('success');
        setResponseMessage((data as { message?: string }).message || 'Dziękujemy! Odpowiemy w ciągu 24 godzin w dni robocze.');
        resetForm();
      } else {
        setStatus('error');
        setResponseMessage((data as { detail?: string }).detail || 'Wystąpił błąd podczas wysyłania wiadomości.');
      }
    } catch {
      setStatus('error');
      setResponseMessage('Błąd połączenia. Spróbuj ponownie później.');
    }
  };

  return (
    <section className="section py-5 bg-white">
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={8} className="text-center">
            <h1 className="display-4 fw-bold text-primary mb-3">
              Skontaktuj się <span className="text-gradient text-line">z nami</span>
            </h1>
            <p className="lead text-muted mb-0">
              Masz pytania? Potrzebujesz pomocy technicznej lub informacji o ofercie? Napisz — odpowiemy w ciągu 24 godzin w dni robocze.
            </p>
          </Col>
        </Row>

        <Row className="g-5">
          <Col lg={5}>
            <div className="title-sm">
              <span>DANE KONTAKTOWE</span>
            </div>
            <div className="main-title mt-3">
              <h2 className="text-primary">
                Jesteśmy tu dla <span className="text-orange text-line">Ciebie</span>
              </h2>
            </div>

            <div className="bg-light p-4 p-lg-5 rounded-4 h-100 mt-4">
              <div className="d-flex mb-4">
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 rounded-circle shadow-sm">
                    <RiMapPinLine size={24} className="text-orange" />
                  </div>
                </div>
                <div className="ms-4">
                  <h5 className="mb-1">Adres</h5>
                  <p className="text-muted mb-0">Warszawa, Polska</p>
                  <p className="text-muted small mb-0">Spotkania po wcześniejszym umówieniu.</p>
                </div>
              </div>

              <div className="d-flex mb-4">
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 rounded-circle shadow-sm">
                    <RiMailLine size={24} className="text-orange" />
                  </div>
                </div>
                <div className="ms-4">
                  <h5 className="mb-1">E-mail</h5>
                  <p className="text-muted mb-0">kontakt@sitespector.pl</p>
                  <p className="text-muted small mb-0">Odpowiadamy w 24 godziny (pn–pt 9:00–17:00 CET).</p>
                </div>
              </div>

              <div className="d-flex">
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 rounded-circle shadow-sm">
                    <RiTimeLine size={24} className="text-orange" />
                  </div>
                </div>
                <div className="ms-4">
                  <h5 className="mb-1">Godziny</h5>
                  <p className="text-muted mb-0">Pn–Pt 9:00–17:00 (CET)</p>
                  <p className="text-muted small mb-0">Poza godzinami — odpowiedź następnego dnia.</p>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className="title-sm">
              <span>NAPISZ DO NAS</span>
            </div>
            <div className="main-title mt-3">
              <h2 className="text-primary">
                Wyślij <span className="text-orange text-line">wiadomość</span>
              </h2>
            </div>

            <div className="bg-white p-4 p-lg-5 rounded-4 shadow-sm border mt-4">
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
                      <Form.Label>Adres e-mail</Form.Label>
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
                  <Form.Select name="subject" value={formData.subject} onChange={handleChange} disabled={status === 'loading'}>
                    {SUBJECT_OPTIONS.map(opt => (
                      <option value={opt} key={opt}>
                        {opt}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4" controlId="message">
                  <Form.Label>Wiadomość</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    placeholder="W czym możemy Ci pomóc? (min. 10 znaków)"
                    disabled={status === 'loading'}
                  />
                </Form.Group>

                <div className="d-flex flex-column flex-sm-row gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex-grow-1 py-3 fw-bold"
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

                  <Button
                    variant="outline-primary"
                    type="button"
                    className="py-3 fw-bold"
                    onClick={resetForm}
                    disabled={status === 'loading'}
                  >
                    Wyczyść
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm text-center">
              <div className="title-sm">
                <span>ZANIM NAPISZESZ</span>
              </div>
              <h3 className="text-primary fw-bold mt-2 mb-2">Możesz od razu wypróbować SiteSpector</h3>
              <p className="text-muted mb-4">
                Oferta jest w przygotowaniu. Jeśli chcesz poznać aktualne możliwości SiteSpector, skontaktuj się z nami. Wiele odpowiedzi znajdziesz też w dokumentacji.
              </p>
              <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
                <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                  <RiPlayCircleLine className="me-1" />
                  Skontaktuj się z nami
                </Link>
                <Link href="/docs" className="btn btn-outline-primary px-5 py-3 fw-bold">
                  Dokumentacja
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

