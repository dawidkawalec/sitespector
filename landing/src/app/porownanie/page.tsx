'use client';

import React from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiCheckLine, RiCloseLine } from 'react-icons/ri';

const comparisonData = [
  { feature: 'Cena miesięcznie', sitespector: '29 USD', sf: '259 GBP/rok', ahrefs: '129 USD', semrush: '139 USD' },
  { feature: 'Crawling SEO', sitespector: true, sf: true, ahrefs: true, semrush: true },
  { feature: 'Core Web Vitals', sitespector: true, sf: false, ahrefs: false, semrush: 'Ograniczone' },
  { feature: 'Analiza AI', sitespector: true, sf: false, ahrefs: false, semrush: false },
  { feature: 'Raporty PDF', sitespector: 'Automatyczne', sf: 'Eksport CSV', ahrefs: false, semrush: 'Ręczne' },
  { feature: 'Analiza konkurencji', sitespector: 'Do 3 na audyt', sf: false, ahrefs: true, semrush: true },
  { feature: 'Team Workspaces', sitespector: true, sf: false, ahrefs: true, semrush: true },
  { feature: 'Darmowy plan', sitespector: '5 audytów/mc', sf: '500 URL limit', ahrefs: false, semrush: false },
  { feature: 'Czas audytu', sitespector: '1-3 min', sf: '5-30 min', ahrefs: '-', semrush: '-' },
  { feature: 'Dane w UE', sitespector: true, sf: 'Lokalnie', ahrefs: false, semrush: false },
];

export default function PorownaniePage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">SiteSpector vs inne narzędzia</h1>
                <p className="lead text-muted">Porównaj SiteSpector z popularnymi rozwiązaniami SEO i zdecyduj, które najlepiej pasuje do Twoich potrzeb.</p>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col lg={12}>
                <div className="bg-white shadow-sm rounded-4 overflow-hidden border">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="p-4 border-0">Funkcja</th>
                        <th className="p-4 border-0 text-center text-orange fw-bold" style={{ width: '20%' }}>SiteSpector Pro</th>
                        <th className="p-4 border-0 text-center" style={{ width: '20%' }}>Screaming Frog</th>
                        <th className="p-4 border-0 text-center" style={{ width: '20%' }}>Ahrefs Lite</th>
                        <th className="p-4 border-0 text-center" style={{ width: '20%' }}>SEMrush Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-4 fw-medium text-primary border-bottom">{row.feature}</td>
                          <td className="p-4 text-center border-bottom bg-orange-subtle fw-bold">
                            {typeof row.sitespector === 'boolean' ? (
                              row.sitespector ? <RiCheckLine size={24} className="text-success" /> : <RiCloseLine size={24} className="text-danger" />
                            ) : row.sitespector}
                          </td>
                          <td className="p-4 text-center border-bottom">
                            {typeof row.sf === 'boolean' ? (
                              row.sf ? <RiCheckLine size={24} className="text-success" /> : <RiCloseLine size={24} className="text-danger" />
                            ) : row.sf}
                          </td>
                          <td className="p-4 text-center border-bottom">
                            {typeof row.ahrefs === 'boolean' ? (
                              row.ahrefs ? <RiCheckLine size={24} className="text-success" /> : <RiCloseLine size={24} className="text-danger" />
                            ) : row.ahrefs}
                          </td>
                          <td className="p-4 text-center border-bottom">
                            {typeof row.semrush === 'boolean' ? (
                              row.semrush ? <RiCheckLine size={24} className="text-success" /> : <RiCloseLine size={24} className="text-danger" />
                            ) : row.semrush}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <div className="mt-5 text-center py-4 bg-light rounded-4 border">
                  <h4 className="text-primary mb-3">Wybierz narzędzie, które oszczędza Twój czas i pieniądze</h4>
                  <p className="text-muted mb-4">SiteSpector łączy funkcje wielu narzędzi w jednej, przystępnej cenie.</p>
                  <a href="/login" className="btn btn-orange px-5 py-3 fw-bold text-white shadow-sm">
                    Wypróbuj za darmo teraz
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
