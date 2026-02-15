import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Mapa strony | SiteSpector',
  description: 'Pełna struktura strony SiteSpector – szybki dostęp do wszystkich sekcji i podstron.',
  path: '/sitemap',
  ogImageType: 'page',
});

const sitemapSections = [
  {
    title: 'Główne',
    links: [
      { label: 'Strona główna', href: '/' },
      { label: 'Zaloguj się / Załóż konto', href: '/login' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Cennik', href: '/cennik' },
    ],
  },
  {
    title: 'Produkt',
    links: [
      { label: 'Funkcje', href: '/funkcje' },
      { label: 'Jak to działa', href: '/jak-to-dziala' },
      { label: 'Integracje', href: '/integracje' },
      { label: 'Porównanie', href: '/porownanie' },
      { label: 'Cennik', href: '/cennik' },
    ],
  },
  {
    title: 'Rozwiązania',
    links: [
      { label: 'Dla agencji SEO', href: '/dla-agencji-seo' },
      { label: 'Dla freelancerów', href: '/dla-freelancerow' },
      { label: 'Dla e-commerce', href: '/dla-ecommerce' },
      { label: 'Dla menedżerów', href: '/dla-managerow' },
      { label: 'Sprawdź agencję SEO', href: '/sprawdz-agencje-seo' },
    ],
  },
  {
    title: 'Zasoby',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Case studies', href: '/case-study' },
      { label: 'Centrum pomocy', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Firma',
    links: [
      { label: 'O nas', href: '/o-nas' },
      { label: 'Kontakt', href: '/kontakt' },
    ],
  },
  {
    title: 'Prawne',
    links: [
      { label: 'Regulamin', href: '/regulamin' },
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci' },
      { label: 'Polityka cookies', href: '/polityka-cookies' },
    ],
  },
] as const;

export default function SitemapPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/sitemap',
            title: 'Mapa strony | SiteSpector',
            description: 'Pełna struktura strony SiteSpector – szybki dostęp do wszystkich sekcji i podstron.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Mapa strony', path: '/sitemap' },
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
                  <span>MAPA STRONY</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-5 fw-bold text-primary mb-0">
                    Pełna struktura <span className="text-gradient text-line">SiteSpector</span>
                  </h1>
                </div>
                <p className="text-muted mt-4 mb-0">
                  Szybki dostęp do wszystkich sekcji i podstron. Dla wyszukiwarek:{' '}
                  <Link href="/sitemap.xml" className="text-orange text-decoration-none">
                    sitemap.xml
                  </Link>
                </p>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="section py-5 bg-white">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10}>
                <div className="row g-4">
                  {sitemapSections.map((section) => (
                    <div className="col-md-6 col-lg-4" key={section.title}>
                      <div className="bg-light rounded-4 border p-4 h-100 shadow-sm">
                        <h2 className="h5 text-primary fw-bold mb-3">{section.title}</h2>
                        <div className="d-flex flex-column gap-2">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="text-muted text-decoration-none hover-white"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
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

