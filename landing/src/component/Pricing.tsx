import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { RiCheckboxCircleLine } from 'react-icons/ri';

export interface PricingPlan {
  title: string;
  description: string;
  price: string;
  period: string;
  credits: string;
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
    description: 'Zacznij za darmo — bez karty kredytowej.',
    price: '$0',
    period: '',
    credits: '50 kredytów na start',
    features: [
      '1 audyt demo (raport 80% zblurowany)',
      'AI Chat (do wyczerpania kredytów)',
      'Workspace osobisty',
      'Bez zobowiązań',
    ],
    button: {
      label: 'Zacznij za darmo',
      link: '/register',
      variant: 'outline-primary',
    },
  },
  {
    title: 'Solo',
    description: 'Dla freelancerów i specjalistów SEO.',
    price: '$9.99',
    period: '/msc',
    credits: '100 kredytów/msc (~3 audyty)',
    features: [
      'Pełne raporty (bez blurowania)',
      '1 harmonogram automatyczny',
      'Dokupywanie kredytów',
      'Do 3 członków workspace',
      'Wsparcie email',
    ],
    button: {
      label: 'Wypróbuj za darmo',
      link: '/register',
      variant: 'outline-primary',
    },
  },
  {
    title: 'Agency',
    description: 'Dla agencji SEO i software house\'ów.',
    price: '$29.99',
    period: '/msc',
    credits: '400 kredytów/msc (~13 audytów)',
    isPopular: true,
    features: [
      'Branding raportów PDF (logo klienta)',
      '5 harmonogramów automatycznych',
      'Analiza do 3 konkurentów',
      'Wiele workspace\'ów',
      'Do 10 członków workspace',
      'Wsparcie priorytetowe',
    ],
    button: {
      label: 'Wypróbuj za darmo',
      link: '/register',
      variant: 'primary',
    },
  },
  {
    title: 'Enterprise',
    description: 'Dla dużych zespołów i firm.',
    price: '$99',
    period: '/msc',
    credits: '2 000 kredytów/msc (~66 audytów)',
    features: [
      'White-label PDF (pełne brandowanie)',
      'Unlimited harmonogramy',
      'Unlimited członków workspace',
      'Dedykowane wsparcie + SLA',
    ],
    button: {
      label: 'Wypróbuj za darmo',
      link: '/register',
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
                <h2 className="text-primary">Prosty cennik, bez ukrytych opłat</h2>
                <p className="text-muted mt-2">Bez opłat per-seat. Screaming Frog + Lighthouse + Senuto + AI w jednym.</p>
              </div>
            </Col>
          </Row>

          <Row className="mt-4 g-4">
            {pricingPlans.map((plan, index) => (
              <Col key={index} md={6} lg={3}>
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
                        {plan.isPopular && (
                          <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>
                            Najlepsza wartość
                          </span>
                        )}
                      </h4>
                      <p className={`mt-2 m-0 ${plan.isPopular ? 'text-white' : ''}`} style={{ fontSize: '0.9rem' }}>
                        {plan.description}
                      </p>
                    </div>
                    <div className="price-info text-start p-4">
                      <h1 className="fw-bold text-primary my-2">
                        {plan.price}
                        {plan.period && <span style={{ fontSize: '1rem', fontWeight: 400 }}>{plan.period}</span>}
                      </h1>
                      <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                        {plan.credits}
                      </p>
                      <ul className="list-unstyled">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="mt-2 text-muted" style={{ fontSize: '0.9rem' }}>
                            <RiCheckboxCircleLine className="text-primary me-2 fs-6 align-middle" />
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
                        className={`btn btn-${plan.button.variant} w-75`}
                      >
                        {plan.button.label}
                      </Link>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <Row className="mt-4 text-center">
            <Col>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Wszystkie ceny w USD. 1 audyt = 30 kredytów. Roczna subskrypcja: 20% taniej.
                Potrzebujesz API? <Link href="/kontakt" className="text-primary fw-bold">Kontakt — plan Custom</Link>
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Pricing;
