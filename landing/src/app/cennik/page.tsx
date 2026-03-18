import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Pricing from '@/component/Pricing';
import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Cennik — SiteSpector | Audyt SEO od $9.99/msc',
  description:
    'Prosty cennik SiteSpector: Free, Solo ($9.99), Agency ($29.99), Enterprise ($99). Screaming Frog + Lighthouse + Senuto + AI w jednym. Bez opłat per-seat.',
  keywords: ['cennik SiteSpector', 'audyt SEO cena', 'narzędzie SEO cennik', 'Screaming Frog alternatywa cena'],
  path: '/cennik',
  ogImageType: 'page',
});

export default function CennikPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/cennik',
            title: 'Cennik — SiteSpector',
            description:
              'Prosty cennik SiteSpector. 4 plany: Free, Solo, Agency, Enterprise. Bez opłat per-seat.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Cennik', path: '/cennik' },
          ]),
        ]}
      />

      <Topbar />
      <main className="pt-5 mt-5">
        <Pricing />

        <section className="section py-5 bg-light">
          <Container>
            <Row className="justify-content-center mt-2">
              <Col lg={10}>
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm text-center">
                  <div className="main-title">
                    <h2 className="text-primary mb-2">
                      Potrzebujesz API lub integracji?
                    </h2>
                  </div>
                  <p className="text-muted mb-4">
                    Plan Custom z dostępem API, integracją CRM i dedykowanym onboardingiem.
                  </p>
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                    Skontaktuj się z nami
                  </Link>
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
