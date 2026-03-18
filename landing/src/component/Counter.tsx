'use client';
import type { ReactNode } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import CountUp from 'react-countup';
import { RiCheckboxLine, RiHourglassFill, RiTeamLine, RiVidiconLine } from 'react-icons/ri';

type CounterItem = {
  icon: ReactNode;
  end: number;
  suffix?: string;
  label: string;
};

const counterData: CounterItem[] = [
  {
    icon: <RiCheckboxLine size={72} className="p-3 bg-success-subtle rounded-3 text-primary" />,
    end: 9,
    label: 'Obszarów Analizy AI',
  },
  {
    icon: <RiTeamLine size={72} className="p-3 bg-success-subtle rounded-3 text-primary" />,
    end: 200,
    suffix: '',
    label: 'Zadań w Execution Plan',
  },
  {
    icon: <RiVidiconLine size={72} className="p-3 bg-success-subtle rounded-3 text-primary" />,
    end: 3,
    label: 'Formaty Raportów PDF',
  },
  {
    icon: <RiHourglassFill size={72} className="p-3 bg-success-subtle rounded-3 text-primary" />,
    end: 30,
    suffix: ' min',
    label: 'Czas Audytu',
  },
];

const Counter = () => {
  return (
    <section className="counter-part pt-0 bg-primary">
      <Container>
        <Row className="align-items-center">
          {counterData.map((item, idx) => (
            <Col lg={3} key={idx}>
              <div className="counter-no mt-5 text-center p-4">
                <div className="icon mb-5">{item.icon}</div>
                <div className="number">
                  <h2 className="text-white fw-bold">
                    <CountUp end={item.end} suffix={item.suffix || ''} />
                  </h2>
                </div>
                <div className="content">
                  <p className="text-white-50">{item.label}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Counter;
