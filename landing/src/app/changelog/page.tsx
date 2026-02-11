'use client';

import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiRocketLine, RiBugLine, RiFileChartLine, RiTeamLine } from 'react-icons/ri';

const changelogData = [
  {
    month: 'LUTY 2026',
    items: [
      {
        title: 'Dwufazowe audyty – szybsze wyniki',
        description: 'Faza techniczna (Screaming Frog + Lighthouse) kończy się natychmiast, dając Ci wgląd w dane w mniej niż minutę. Faza AI (Gemini) wzbogaca raport w tle.',
        icon: RiRocketLine,
        color: 'orange'
      },
      {
        title: 'Certyfikat SSL Let\'s Encrypt',
        description: 'Pełne szyfrowanie całej komunikacji na sitespector.app dla Twojego bezpieczeństwa.',
        icon: RiRocketLine,
        color: 'orange'
      },
      {
        title: 'Unified Sidebar',
        description: 'Jeden spójny panel boczny z szybkim przełączaniem workspace\'ów i intuicyjną nawigacją.',
        icon: RiRocketLine,
        color: 'orange'
      },
      {
        title: 'Naprawiony pipeline audytów',
        description: 'Zoptymalizowane timeouty i logi postępów w czasie rzeczywistym. Koniec z zawieszonymi audytami.',
        icon: RiBugLine,
        color: 'orange'
      }
    ]
  },
  {
    month: 'STYCZEŃ 2026',
    items: [
      {
        title: 'Raporty PDF v2',
        description: '9 pełnych sekcji z realnymi danymi. Usunęliśmy wszystkie uproszczenia – teraz raporty są w 100% oparte na wynikach analizy.',
        icon: RiFileChartLine,
        color: 'primary'
      },
      {
        title: 'Analiza Local SEO',
        description: 'Automatyczne wykrywanie firm lokalnych i sprawdzanie obecności NAP oraz Schema markup.',
        icon: RiFileChartLine,
        color: 'primary'
      },
      {
        title: 'Action Plan w raporcie',
        description: 'Priorytetyzacja zadań na podstawie wyników: od krytycznych błędów po drobne optymalizacje.',
        icon: RiFileChartLine,
        color: 'primary'
      }
    ]
  },
  {
    month: 'GRUDZIEŃ 2025',
    items: [
      {
        title: 'Team Workspaces',
        description: 'Tworzenie zespołów, zapraszanie członków za pomocą emaila i przypisywanie ról (Owner, Admin, Member).',
        icon: RiTeamLine,
        color: 'secondary'
      },
      {
        title: 'Stripe Billing',
        description: 'Wygodne plany subskrypcyjne Free, Pro i Enterprise obsługiwane przez bezpieczne płatności Stripe.',
        icon: RiTeamLine,
        color: 'secondary'
      },
      {
        title: 'Analiza konkurencji',
        description: 'Możliwość dodania do 3 konkurentów do każdego audytu i porównania wyników wydajności.',
        icon: RiTeamLine,
        color: 'secondary'
      }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <Container>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Co nowego w SiteSpector</h1>
                <p className="lead text-muted">Śledź rozwój platformy. Regularnie dodajemy nowe funkcje i ulepszenia, aby Twoje audyty były jeszcze lepsze.</p>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col lg={9}>
                {changelogData.map((monthData, idx) => (
                  <div key={idx} className="mb-5">
                    <div className="d-flex align-items-center mb-4">
                      <h3 className="fw-bold text-primary mb-0 me-3">{monthData.month}</h3>
                      <div className="flex-grow-1 border-bottom"></div>
                    </div>
                    
                    <Row className="g-4">
                      {monthData.items.map((item, itemIdx) => (
                        <Col lg={12} key={itemIdx}>
                          <Card className="border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
                            <div className="d-flex align-items-start">
                              <div className={`p-3 bg-${item.color}-subtle rounded-3 text-${item.color} me-4`}>
                                <item.icon size={28} />
                              </div>
                              <div>
                                <h5 className="fw-bold text-primary mb-2">{item.title}</h5>
                                <p className="text-muted mb-0 lh-lg">{item.description}</p>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}

                <div className="mt-5 p-5 bg-orange text-white rounded-4 text-center shadow">
                  <h3 className="fw-bold mb-3">Bądź na bieżąco z nowościami</h3>
                  <p className="mb-4 opacity-75">Zapisz się do naszego newslettera w stopce strony, aby otrzymywać powiadomienia o nowych funkcjach.</p>
                  <a href="/#home" className="btn btn-light px-5 py-3 fw-bold text-orange shadow-sm">
                    Wróć do strony głównej
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
