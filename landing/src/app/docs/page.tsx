'use client';

import React from 'react';
import { Container, Row, Col, Accordion, Card } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiBookOpenLine, RiDashboardLine, RiFilePdfLine, RiTeamLine, RiWalletLine, RiShieldLine } from 'react-icons/ri';

const docsSections = [
  {
    id: 'start',
    icon: RiBookOpenLine,
    title: 'JAK ZACZĄĆ',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Utwórz konto:</strong> Możesz zarejestrować się używając adresu email lub konta Google/GitHub.</li>
        <li className="mb-2">• <strong>Twój pierwszy audyt:</strong> Po zalogowaniu wpisz URL swojej strony w polu na dashboardzie i kliknij "Rozpocznij audyt".</li>
        <li className="mb-2">• <strong>Konkurenci:</strong> Opcjonalnie możesz dodać do 3 adresów URL konkurencji, aby porównać wyniki.</li>
        <li className="mb-2">• <strong>Czas oczekiwania:</strong> Audyt trwa zazwyczaj od 1 do 3 minut. Wyniki pojawią się automatycznie.</li>
      </ul>
    )
  },
  {
    id: 'panel',
    icon: RiDashboardLine,
    title: 'PANEL AUDYTU',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Zakładka SEO:</strong> Analiza techniczna meta tagów, nagłówków H1-H6, obrazów bez ALT oraz linków wewnętrznych.</li>
        <li className="mb-2">• <strong>Zakładka Wydajność:</strong> Pełne metryki Core Web Vitals (LCP, FCP, CLS, TTFB) dla wersji desktop i mobile.</li>
        <li className="mb-2">• <strong>Zakładka Treść:</strong> Ocena jakości contentu, czytelności oraz inteligentne rekomendacje od AI Gemini.</li>
        <li className="mb-2">• <strong>Zakładka Konkurencja:</strong> Bezpośrednie porównanie Twoich wyników z wybranymi konkurentami.</li>
        <li className="mb-2">• <strong>Quick Wins:</strong> Lista najważniejszych poprawek, które dadzą najszybszy efekt, posortowana według priorytetu.</li>
      </ul>
    )
  },
  {
    id: 'pdf',
    icon: RiFilePdfLine,
    title: 'RAPORTY PDF',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Generowanie:</strong> Przycisk "Pobierz PDF" jest dostępny w prawym górnym rogu strony audytu po jego zakończeniu.</li>
        <li className="mb-2">• <strong>Zawartość:</strong> Raport składa się z 9 sekcji, w tym Executive Summary, szczegółowych analiz i gotowego planu działań.</li>
        <li className="mb-2">• <strong>White-label:</strong> W planach Pro i Enterprise raporty nie zawierają brandingu SiteSpector, co pozwala na wysyłkę bezpośrednio do klienta.</li>
      </ul>
    )
  },
  {
    id: 'teams',
    icon: RiTeamLine,
    title: 'ZESPOŁY I WORKSPACE\'Y',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Tworzenie zespołu:</strong> Przejdź do Ustawienia &gt; Zespół, aby utworzyć nową przestrzeń i zaprosić współpracowników.</li>
        <li className="mb-2">• <strong>Role:</strong> Właściciel (pełny dostęp), Admin (zarządzanie członkami), Członek (wykonywanie audytów).</li>
        <li className="mb-2">• <strong>Przełączanie:</strong> Możesz być członkiem wielu zespołów. Przełączaj się między nimi za pomocą menu w panelu bocznym.</li>
        <li className="mb-2">• <strong>Izolacja:</strong> Każdy Workspace ma oddzielną historię audytów, limity i dane.</li>
      </ul>
    )
  },
  {
    id: 'billing',
    icon: RiWalletLine,
    title: 'SUBSKRYPCJE I PŁATNOŚCI',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Plan Free:</strong> 5 audytów miesięcznie, 1 użytkownik, standardowe raporty PDF.</li>
        <li className="mb-2">• <strong>Plan Pro:</strong> 50 audytów miesięcznie, zespoły, analiza konkurencji, raporty white-label.</li>
        <li className="mb-2">• <strong>Plan Enterprise:</strong> Nielimitowane audyty, dostęp do API, dedykowane wsparcie.</li>
        <li className="mb-2">• <strong>Bezpieczeństwo:</strong> Płatności obsługuje Stripe. Akceptujemy karty płatnicze i Apple/Google Pay.</li>
      </ul>
    )
  },
  {
    id: 'security',
    icon: RiShieldLine,
    title: 'BEZPIECZEŃSTWO I PRYWATNOŚĆ',
    content: (
      <ul className="list-unstyled">
        <li className="mb-2">• <strong>Lokalizacja danych:</strong> Wszystkie dane są przechowywane na serwerach w Unii Europejskiej (Niemcy, Hetzner).</li>
        <li className="mb-2">• <strong>RODO:</strong> Jesteśmy w pełni zgodni z ogólnym rozporządzeniem o ochronie danych.</li>
        <li className="mb-2">• <strong>AI Gemini:</strong> Do analizy treści przesyłamy tylko techniczne dane strony. Nigdy nie przesyłamy Twoich danych osobowych.</li>
        <li className="mb-2">• <strong>Szyfrowanie:</strong> Cała komunikacja z platformą odbywa się przez bezpieczny protokół HTTPS (SSL).</li>
      </ul>
    )
  }
];

export default function DocsPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Centrum pomocy SiteSpector</h1>
                <p className="lead text-muted">Wszystko, co musisz wiedzieć o korzystaniu z naszej platformy.</p>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col lg={9}>
                <Accordion defaultActiveKey="start" className="shadow-sm rounded-4 overflow-hidden border-0">
                  {docsSections.map((section) => (
                    <Accordion.Item eventKey={section.id} key={section.id} className="border-bottom">
                      <Accordion.Header>
                        <div className="d-flex align-items-center py-2">
                          <div className="bg-orange-subtle p-2 rounded-3 text-orange me-3">
                            <section.icon size={24} />
                          </div>
                          <span className="fw-bold text-primary">{section.title}</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="p-4 bg-white">
                        <div className="text-muted lh-lg">
                          {section.content}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>

                <div className="mt-5 p-5 bg-light rounded-4 text-center border">
                  <h4 className="text-primary mb-3">Nie znalazłeś odpowiedzi?</h4>
                  <p className="text-muted mb-4">Nasz zespół wsparcia chętnie pomoże Ci w rozwiązaniu każdego problemu.</p>
                  <a href="/kontakt" className="btn btn-orange px-5 py-3 fw-bold text-white">
                    Skontaktuj się z nami
                  </a>
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
