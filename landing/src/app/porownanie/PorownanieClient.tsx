'use client';

import React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Table } from 'react-bootstrap';
import { RiCheckLine, RiCloseLine, RiLineChartLine, RiRobotLine, RiShieldCheckLine, RiTerminalBoxLine } from 'react-icons/ri';

type CellValue = boolean | string;

type ComparisonRow = {
  feature: string;
  sitespector: CellValue;
  sf: CellValue;
  ahrefs: CellValue;
  semrush: CellValue;
};

const comparisonData: ComparisonRow[] = [
  { feature: 'Oferta', sitespector: 'Wkrótce — skontaktuj się z nami', sf: 'Zależnie od dostawcy', ahrefs: 'Zależnie od dostawcy', semrush: 'Zależnie od dostawcy' },
  { feature: 'Crawling SEO', sitespector: '✓ (SF engine)', sf: true, ahrefs: true, semrush: true },
  { feature: 'Core Web Vitals (Lighthouse)', sitespector: '✓ desktop + mobile', sf: false, ahrefs: false, semrush: false },
  { feature: 'Widoczność (Senuto)', sitespector: true, sf: false, ahrefs: '✓ (własne)', semrush: '✓ (własne)' },
  { feature: 'AI Overviews monitoring', sitespector: '✓ (Senuto)', sf: false, ahrefs: false, semrush: false },
  { feature: 'Execution Plan z kodem', sitespector: true, sf: false, ahrefs: false, semrush: false },
  { feature: '3-fazowy audyt (technika → AI → plan)', sitespector: true, sf: false, ahrefs: false, semrush: false },
  { feature: 'Analiza AI (treść, UX, bezpieczeństwo)', sitespector: '✓ (Gemini)', sf: false, ahrefs: false, semrush: false },
  { feature: 'Zaplanowane audyty', sitespector: true, sf: false, ahrefs: true, semrush: true },
  { feature: 'Konkurenci w audycie', sitespector: '✓ (szczegóły wkrótce)', sf: false, ahrefs: true, semrush: true },
  { feature: 'Raporty PDF', sitespector: '✓ (9 sekcji, white-label)', sf: '✓ (podstawowe)', ahrefs: true, semrush: true },
  { feature: 'Zespoły / Workspace', sitespector: true, sf: false, ahrefs: true, semrush: true },
  { feature: 'Dane w UE', sitespector: true, sf: true, ahrefs: false, semrush: false },
  { feature: 'Dostępność', sitespector: 'Wkrótce', sf: 'Zależnie od planu', ahrefs: false, semrush: 'Zależnie od planu' },
];

function Cell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  const baseClass = `p-4 text-center border-bottom ${highlighted ? 'bg-orange-subtle fw-bold' : ''}`;

  if (typeof value === 'boolean') {
    return (
      <td className={baseClass}>
        {value ? <RiCheckLine size={22} className="text-success" /> : <RiCloseLine size={22} className="text-muted" />}
      </td>
    );
  }

  return <td className={baseClass}>{value}</td>;
}

export default function PorownanieClient() {
  return (
    <section className="section py-5 bg-white">
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={10} className="text-center">
            <h1 className="display-4 fw-bold text-primary mb-3">
              SiteSpector vs <span className="text-gradient text-line">konkurencja</span>
            </h1>
            <p className="lead text-muted mb-4">
              Jedno narzędzie zamiast pięciu. Execution Plan z kodem, AI Overviews, integracja Senuto i 3-fazowy audyt. Oferta jest aktualizowana.
            </p>
            <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
              Skontaktuj się z nami
            </Link>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={12}>
            <div className="title-sm">
              <span>PORÓWNANIE FUNKCJI</span>
            </div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                Co oferuje każda <span className="text-orange text-line">platforma</span>
              </h2>
            </div>

            <div className="bg-white shadow-sm rounded-4 overflow-hidden border">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="p-4 border-0">Funkcja</th>
                    <th className="p-4 border-0 text-center text-orange fw-bold" style={{ width: '20%' }}>
                      SiteSpector
                    </th>
                    <th className="p-4 border-0 text-center" style={{ width: '20%' }}>
                      Screaming Frog
                    </th>
                    <th className="p-4 border-0 text-center" style={{ width: '20%' }}>
                      Ahrefs
                    </th>
                    <th className="p-4 border-0 text-center" style={{ width: '20%' }}>
                      SEMrush
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-4 fw-medium text-primary border-bottom">{row.feature}</td>
                      <Cell value={row.sitespector} highlighted />
                      <Cell value={row.sf} />
                      <Cell value={row.ahrefs} />
                      <Cell value={row.semrush} />
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="mt-4 text-center text-muted">
              Finalny zakres oferty jest w przygotowaniu. Skontaktuj się z nami, aby otrzymać aktualne informacje.
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5">
          <Col lg={12}>
            <div className="title-sm">
              <span>OFERTA</span>
            </div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                Oferta <span className="text-orange text-line">wkrótce</span>
              </h2>
            </div>

            <div className="row g-4">
              {[
                {
                  title: 'SiteSpector',
                  price: 'Wkrótce',
                  points: ['Szczegóły pakietów opublikujemy wkrótce', 'Skontaktuj się z nami po ofertę'],
                  highlight: true,
                },
                { title: 'Screaming Frog', price: 'Ceny zewnętrzne', points: ['Szczegóły po stronie dostawcy'] },
                { title: 'Ahrefs', price: 'Ceny zewnętrzne', points: ['Szczegóły po stronie dostawcy'] },
                { title: 'SEMrush', price: 'Ceny zewnętrzne', points: ['Szczegóły po stronie dostawcy'] },
              ].map((c, idx) => (
                <div className="col-md-6 col-lg-3" key={idx}>
                  <div className={`card h-100 rounded-4 shadow-sm ${c.highlight ? 'border border-orange' : 'border-0'}`}>
                    <div className="card-body p-4">
                      {c.highlight && <div className="badge bg-orange text-white mb-3">Rekomendowany</div>}
                      <div className="text-primary fw-bold">{c.title}</div>
                      <div className="h3 text-primary fw-bold mt-2">{c.price}</div>
                      <div className="text-muted small mt-3">
                        {c.points.map(p => (
                          <div key={p}>• {p}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5">
          <Col lg={12}>
            <div className="title-sm">
              <span>DLACZEGO SITESPECTOR</span>
            </div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                5 powodów, dla których <span className="text-orange text-line">wybierają nas</span>
              </h2>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: RiTerminalBoxLine,
                  title: 'Execution Plan',
                  desc: 'Jedyna platforma oferująca konkretne zadania z gotowym kodem. Nie „popraw meta tagi”, ale „oto kod do wklejenia”.',
                },
                {
                  icon: RiRobotLine,
                  title: 'AI Overviews',
                  desc: 'Monitoring, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google. Integracja z Senuto — unikalna na rynku.',
                },
                {
                  icon: RiLineChartLine,
                  title: '3-fazowy audyt',
                  desc: 'Technika (SF + LH + Senuto) → Analiza AI (treść, UX, bezpieczeństwo) → Execution Plan. Wszystko w jednym flow, 1–3 minuty.',
                },
                {
                  icon: RiCheckLine,
                  title: 'Oferta w przygotowaniu',
                  desc: 'Aktualizujemy zakres i warunki pakietów. Po szczegóły zapraszamy do kontaktu.',
                },
                {
                  icon: RiShieldCheckLine,
                  title: 'Dane w UE',
                  desc: 'Supabase + Hetzner DE. RODO. Nie wysyłamy danych do USA.',
                },
              ].map((w, idx) => {
                const Icon = w.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <div className="bg-light rounded-4 border p-4 h-100 shadow-sm">
                      <div className="bg-white rounded-circle d-inline-flex p-3 shadow-sm mb-3">
                        <Icon size={24} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold">{w.title}</h3>
                      <p className="text-muted mb-0">{w.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm text-center">
              <div className="title-sm">
                <span>PRZEKONAJ SIĘ SAM</span>
              </div>
              <h3 className="text-primary fw-bold mt-2 mb-2">
                Oferta SiteSpector <span className="text-orange text-line">wkrótce</span>
              </h3>
              <p className="text-muted mb-4">
                Aktualizujemy zakres pakietów. Skontaktuj się z nami, aby poznać aktualne możliwości.
              </p>
              <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
                <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                  Skontaktuj się z nami
                </Link>
                <Link href="/cennik" className="btn btn-outline-primary px-5 py-3 fw-bold">
                  Zobacz stronę oferty
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

