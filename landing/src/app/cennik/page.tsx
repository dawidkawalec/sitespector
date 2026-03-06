import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Pricing from '@/component/Pricing';
import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';
import { OFFER_PLACEHOLDER_COPY } from '@/lib/offerPlaceholder';

export const metadata = buildMetadata({
  title: 'Oferta — SiteSpector | Wkrótce',
  description:
    'Aktualizujemy ofertę SiteSpector. Szczegóły pakietów i warunków współpracy opublikujemy wkrótce.',
  keywords: ['oferta SiteSpector', 'audyt SEO', 'narzędzie SEO'],
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
            title: 'Oferta — SiteSpector | Wkrótce',
            description:
              'Aktualizujemy ofertę SiteSpector. Szczegóły pakietów i warunków współpracy opublikujemy wkrótce.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Oferta', path: '/cennik' },
          ]),
        ]}
      />

      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-light">
          <Container>
            <Row className="justify-content-center text-center">
              <Col lg={9}>
                <div className="title-sm">
                  <span>{OFFER_PLACEHOLDER_COPY.sectionLabel}</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    {OFFER_PLACEHOLDER_COPY.title}
                  </h1>
                </div>
                <p className="lead text-muted mt-4 mb-0">
                  Finalizujemy szczegóły oferty. W sprawie aktualnych możliwości i wdrożenia skontaktuj się z nami.
                </p>
                <div className="mt-4">
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    {OFFER_PLACEHOLDER_COPY.cta}
                  </Link>
                  <Link href="/porownanie" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Porównaj z konkurencją
                  </Link>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <Pricing />
        <section className="section py-5 bg-light">
          <Container>
            <Row className="justify-content-center mt-2">
              <Col lg={10}>
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm text-center">
                  <div className="main-title">
                    <h2 className="text-primary mb-2">
                      {OFFER_PLACEHOLDER_COPY.subtitle}
                    </h2>
                  </div>
                  <p className="text-muted mb-4">
                    Przygotowujemy finalne pakiety i warunki współpracy. Skontaktuj się z nami, a przedstawimy aktualne możliwości.
                  </p>
                  <Link href="/kontakt" className="btn btn-primary px-5 py-3 fw-bold">
                    {OFFER_PLACEHOLDER_COPY.cta}
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

