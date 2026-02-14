import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { RiCheckboxCircleLine } from 'react-icons/ri';

export interface PricingPlan {
  title: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
  button: {
    label: string;
    link: string;
    variant: 'primary' | 'outline-primary';
  };
}

export const pricingPlans: PricingPlan[] = [
  {
    title: 'Free',
    description: 'Dla freelancerów i małych stron.',
    price: 0,
    period: 'mc',
    features: ['5 audytów miesięcznie', 'Podstawowa analiza SEO', '1 użytkownik', 'PDF standard'],
    button: {
      label: 'Rozpocznij',
      link: '/login',
      variant: 'outline-primary',
    },
  },
  {
    title: 'Pro',
    description: 'Dla profesjonalistów i małych agencji.',
    price: 29,
    period: 'mc',
    isPopular: true,
    features: [
      '50 audytów miesięcznie',
      'Pełna analiza + Senuto',
      '3 konkurentów na audyt',
      'Execution Plan z kodem',
      'Harmonogramy audytów',
      'White-label PDF',
      'API',
    ],
    button: {
      label: 'Rozpocznij',
      link: '/login',
      variant: 'primary',
    },
  },
  {
    title: 'Enterprise',
    description: 'Dla dużych agencji i zespołów.',
    price: 99,
    period: 'mc',
    features: ['Bez limitów', 'Wszystko z Pro', 'Nielimitowani użytkownicy', 'Dedykowane wsparcie', 'SLA'],
    button: {
      label: 'Rozpocznij',
      link: '/login',
      variant: 'outline-primary',
    },
  },
];

const Pricing = () => {
  return (
    <>
      <section className="section price-section bg-light" id="price">
        <Container>
          <Row className="align-items-center text-center justify-content-center">
            <Col lg={6}>
              <div className="title-sm">
                <span>CENNIK</span>
              </div>
              <div className="price-title main-title mt-3">
                <h2 className="text-primary">
                  Wybierz plan idealny dla{' '}
                  <span className="text-orange text-line">Twojego Biznesu</span>
                </h2>
              </div>
            </Col>
          </Row>

          <Row className="mt-4 g-4">
            {pricingPlans.map((plan, index) => (
              <Col key={index} md={6} lg={4}>
                <div
                  className={`card ${plan.isPopular ? 'shadow' : 'shadow-sm'} h-100 border-0 rounded-2`}
                >
                  <div className="card-body text-start p-3">
                    <div
                      className={`p-4 rounded-2 ${plan.isPopular ? 'bg-primary text-white' : 'bg-light'}`}
                    >
                      <h4
                        className={`card-title fw-bold ${plan.isPopular ? 'text-light' : 'text-primary'}`}
                      >
                        {plan.title}
                      </h4>
                      <p className={`mt-4 m-0 ${plan.isPopular ? 'text-white' : ''}`}>
                        {plan.description}
                      </p>
                    </div>
                    <div className="price-info text-start p-4">
                      <h1 className="fw-bold text-primary my-3">
                        ${plan.price}
                        <span className="fs-6 text-muted"> / {plan.period}</span>
                      </h1>
                      <p className="text-dark mb-4">Includes :</p>
                      <ul>
                        {plan.features.map((feature, i) => (
                          <li key={i} className="mt-3 text-muted">
                            <RiCheckboxCircleLine className="text-primary me-4 fs-5 align-middle" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="card-footer border-0 p-4">
                    <div className="price-btn text-center">
                      <Link
                        href={plan.button.link}
                        className={`btn btn-${plan.button.variant} w-50`}
                      >
                        {plan.button.label}
                      </Link>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Pricing;
