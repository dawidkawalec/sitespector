import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import {
  RiGoogleFill,
  RiRobot2Fill,
  RiFlashlightFill,
  RiDatabase2Fill,
  RiShieldCheckFill,
  RiTerminalBoxFill,
  RiLineChartFill,
  RiBug2Fill,
} from 'react-icons/ri';

const techData = [
  { icon: <RiFlashlightFill size={40} className="text-muted" />, name: 'Lighthouse' },
  { icon: <RiRobot2Fill size={40} className="text-muted" />, name: 'Gemini AI' },
  { icon: <RiGoogleFill size={40} className="text-muted" />, name: 'Google SEO' },
  { icon: <RiLineChartFill size={40} className="text-muted" />, name: 'Senuto' },
  { icon: <RiDatabase2Fill size={40} className="text-muted" />, name: 'Supabase' },
  { icon: <RiShieldCheckFill size={40} className="text-muted" />, name: 'Stripe' },
  { icon: <RiTerminalBoxFill size={40} className="text-muted" />, name: 'Docker' },
  { icon: <RiBug2Fill size={40} className="text-muted" />, name: 'Screaming Frog' },
];

const Brands = () => {
  return (
    <>
      <section className="section brand-section py-5">
        <Container>
          <div className="brand">
            <Row className="align-items-center justify-content-center text-center g-4">
              <Col lg={12} className="mb-4">
                <p className="text-muted text-uppercase ls-1 fw-semibold">Technologie, którym ufamy</p>
              </Col>
              {techData.map((item, idx) => (
                <Col key={idx} lg={2} xs={6}>
                  <div className="d-flex flex-column align-items-center opacity-75">
                    {item.icon}
                    <span className="mt-2 small text-muted fw-medium">{item.name}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Brands;
