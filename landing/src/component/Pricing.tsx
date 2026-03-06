import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { RiCheckboxCircleLine } from 'react-icons/ri';
import { OFFER_PLACEHOLDER_COPY } from '@/lib/offerPlaceholder';

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
    title: 'Wkrótce',
    description: 'Pracujemy nad nową ofertą dla freelancerów i zespołów.',
    price: 0,
    period: '',
    features: [
      'Szczegóły pakietów opublikujemy wkrótce',
      'Pełna oferta będzie dostępna po publikacji szczegółów',
      'Skontaktuj się z nami, aby poznać aktualne możliwości',
      'Dostosujemy zakres do Twoich potrzeb',
    ],
    button: {
      label: OFFER_PLACEHOLDER_COPY.cta,
      link: '/kontakt',
      variant: 'outline-primary',
    },
  },
  {
    title: 'Wkrótce',
    description: 'Aktualizujemy szczegóły planu dla agencji i specjalistów.',
    price: 29,
    period: '',
    isPopular: true,
    features: [
      'Wkrótce opublikujemy pełny zakres funkcji',
      'Nowe limity i możliwości podamy po finalizacji oferty',
      'W sprawie wdrożenia skontaktuj się z nami',
    ],
    button: {
      label: OFFER_PLACEHOLDER_COPY.cta,
      link: '/kontakt',
      variant: 'primary',
    },
  },
  {
    title: 'Wkrótce',
    description: 'Oferta dla większych zespołów jest przygotowywana.',
    price: 99,
    period: '',
    features: [
      'Przygotowujemy finalne warunki współpracy',
      'Pakiety i zakres wsparcia podamy wkrótce',
      'Skontaktuj się z nami, aby omówić potrzeby Twojego zespołu',
    ],
    button: {
      label: OFFER_PLACEHOLDER_COPY.cta,
      link: '/kontakt',
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
                <h2 className="text-primary">{OFFER_PLACEHOLDER_COPY.title}</h2>
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
                      <h1 className="fw-bold text-primary my-3">Wkrótce</h1>
                      <p className="text-dark mb-4">Skontaktuj się z nami, aby otrzymać szczegóły:</p>
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
