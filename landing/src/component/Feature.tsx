import dashboard from '@/assets/images/dashbord-3.png';
import Image from 'next/image';
import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { RiCheckboxBlankCircleFill } from 'react-icons/ri';

type featureType = {
  name: string;
};

const featureData: featureType[] = [
  {
    name: 'Crawling SEO (Screaming Frog)',
  },
  {
    name: 'Core Web Vitals (Lighthouse)',
  },
  {
    name: 'Analiza Treści i Słów Kluczowych',
  },
  {
    name: 'Zarządzanie Subskrypcjami i Zespołem',
  },
];

const Feature = () => {
  return (
    <>
      <section className="section feature-section bg-light">
        <Container>
          <Row className="align-items-center justify-content-between">
            <Col lg={5}>
              <div className="title-sm">
                <span>MOŻLIWOŚCI</span>
              </div>
              <div className="feature-title main-title mt-3">
                <h2 className="text-primary">
                  Wszystko czego potrzebujesz do <span className="text-orange text-line">Optymalizacji</span>
                </h2>
                <p className="my-3">
                  SiteSpector zastępuje wiele drogich narzędzi jedną, zintegrowaną platformą. Nie musisz już płacić oddzielnie za crawler, narzędzia do testowania szybkości i generatory treści. Skup się na wynikach, my zajmiemy się danymi.
                </p>
              </div>
              <Row className="mt-4 g-lg-4 g-3">
                {featureData.map((item, idx) => (
                  <Col lg={6} key={idx}>
                    <h6 className="text-primary fw-semibold">
                      <RiCheckboxBlankCircleFill className="text-orange me-3" />
                      {item.name}
                    </h6>
                  </Col>
                ))}
              </Row>
              <div className="feature-link mt-5">
                <Link href="/login" className="btn btn-primary">
                  Poznaj pełną specyfikację
                </Link>
              </div>
            </Col>
            <Col lg={6}>
              <Image src={dashboard} alt="" className="img-fluid" />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Feature;
