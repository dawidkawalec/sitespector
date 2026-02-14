import { default as icon1, default as icon6 } from '@/assets/images/appoinment.png';
import arrowIcon from '@/assets/images/arrow-1.png';
import icon5 from '@/assets/images/cloud-lock.png';
import icon4 from '@/assets/images/creativity.png';
import icon2 from '@/assets/images/team.png';
import icon3 from '@/assets/images/users.png';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';

type FeatureItem = {
  icon: StaticImageData;
  title: string;
  subtitle: string;
};

const featuresData: FeatureItem[] = [
  {
    icon: icon1,
    title: 'Audyty Techniczne',
    subtitle: 'Screaming Frog Engine',
  },
  {
    icon: icon2,
    title: 'Analiza Wydajności',
    subtitle: 'Google Lighthouse',
  },
  {
    icon: icon3,
    title: 'Widoczność i Backlinki',
    subtitle: 'Integracja Senuto',
  },
  {
    icon: icon4,
    title: 'AI Overviews',
    subtitle: 'Monitoring odpowiedzi AI',
  },
  {
    icon: icon5,
    title: 'Execution Plan',
    subtitle: 'Zadania z kodem z AI',
  },
  {
    icon: icon6,
    title: 'Raporty PDF',
    subtitle: 'White-label Ready',
  },
];

const About = () => {
  return (
    <section className="section about-section pt-5 z-1" id="about">
      <Container>
        <Row className="align-items-center justify-content-start g-lg-4 g-3">
          <Col xl={5}>
            <div className="title-sm">
              <span>DLACZEGO SITESPECTOR?</span>
            </div>
            <div className="about-title main-title mt-3">
              <h2 className="text-primary">
                Narzędzia, które napędzają Twój{' '}
                <span className="text-orange text-line p-0">Wzrost</span>
              </h2>
            </div>
          </Col>

          <Col xl={6} className="offset-xl-1">
            <Row className="g-lg-4 g-3">
              {featuresData.slice(0, 2).map((item, idx) => (
                <Col lg={6} md={6} key={idx}>
                  <div className="about-style-two">
                    <div className="icon">
                      <Image src={item.icon} alt="Icon" width={47} />
                    </div>
                    <h3>
                      <Link href="">{item.title}</Link>
                    </h3>
                    <div className="bottom">
                      <span>{item.subtitle}</span>
                      <Link href="" className="angle-btn" />
                      <Image src={arrowIcon} alt="Arrow Icon" />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>

          <Col xl={9}>
            <Row className="g-lg-4 g-3">
              {featuresData.slice(2, 5).map((item, idx) => (
                <Col xl={4} lg={6} md={6} key={idx}>
                  <div className="about-style-two">
                    <div className="icon">
                      <Image src={item.icon} alt="Icon" width={55} />
                    </div>
                    <h3>
                      <Link href="">{item.title}</Link>
                    </h3>
                    <div className="bottom">
                      <span>{item.subtitle}</span>
                      <Link href="" className="angle-btn" />
                      <Image src={arrowIcon} alt="Arrow Icon" />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>

          <Col xl={3}>
            <div className="about-style-two">
              <div className="icon">
                <Image src={featuresData[5].icon} alt="Icon" width={47} />
              </div>
              <h3>
                <Link href="">{featuresData[5].title}</Link>
              </h3>
              <div className="bottom">
                <span>{featuresData[5].subtitle}</span>
                <Link href="" className="angle-btn" />
                <Image src={arrowIcon} alt="Arrow Icon" />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default About;
