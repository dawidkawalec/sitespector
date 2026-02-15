import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Pricing, { pricingPlans } from '@/component/Pricing';
import Link from 'next/link';
import { Col, Container, Row, Table } from 'react-bootstrap';
import { RiCheckLine, RiCloseLine, RiQuestionLine } from 'react-icons/ri';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Cennik — SiteSpector | Plany Free, Pro i Enterprise',
  description:
    'Wybierz plan SiteSpector: Free na start, Pro dla profesjonalistów i agencji, Enterprise dla zespołów. Porównanie funkcji, limitów i odpowiedzi na pytania o płatności.',
  keywords: ['cennik SiteSpector', 'audyt SEO cena', 'narzędzie SEO abonament', 'pricing'],
  path: '/cennik',
  ogImageType: 'page',
});

type CellValue = boolean | string;

type ComparisonRow = {
  feature: string;
  free: CellValue;
  pro: CellValue;
  enterprise: CellValue;
};

const comparisonRows: ComparisonRow[] = [
  { feature: 'Audyty / miesiąc', free: '5', pro: '50', enterprise: 'Bez limitu' },
  { feature: 'Użytkownicy', free: '1', pro: 'do 3', enterprise: 'Nielimitowani' },
  { feature: 'Senuto (widoczność/backlinki/AI Overviews)', free: false, pro: true, enterprise: true },
  { feature: 'Execution Plan z kodem', free: false, pro: true, enterprise: true },
  { feature: 'Konkurenci w audycie', free: false, pro: 'do 3', enterprise: 'Nielimitowani' },
  { feature: 'Harmonogramy audytów', free: false, pro: true, enterprise: true },
  { feature: 'Raport PDF (white-label)', free: false, pro: true, enterprise: true },
  { feature: 'API', free: false, pro: true, enterprise: true },
  { feature: 'SLA / dedykowane wsparcie', free: false, pro: false, enterprise: true },
];

function Cell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  const baseClass = `p-4 text-center border-bottom ${highlighted ? 'bg-orange-subtle fw-bold' : ''}`;
  if (typeof value === 'boolean') {
    return (
      <td className={baseClass}>
        {value ? <RiCheckLine size={22} className="text-success" /> : <RiCloseLine size={22} className="text-muted" />}
      </td>
    );
  }
  return <td className={baseClass}>{value}</td>;
}

const pricingFaq = [
  {
    q: 'Czy mogę zacząć za darmo?',
    a: 'Tak. Plan Free daje 5 audytów miesięcznie i pozwala przetestować flow audytu. W każdej chwili możesz przejść na Pro/Enterprise.',
  },
  {
    q: 'Czy potrzebuję karty kredytowej?',
    a: 'Nie do startu. Free działa bez karty. Płatne plany aktywujesz w panelu subskrypcji.',
  },
  {
    q: 'Czy mogę anulować subskrypcję?',
    a: 'Tak. Subskrypcję możesz anulować w dowolnym momencie, a plan pozostanie aktywny do końca okresu rozliczeniowego.',
  },
  {
    q: 'Czy dostanę fakturę VAT?',
    a: 'Tak. Faktury i dane firmowe są dostępne w panelu płatności (Stripe).',
  },
  {
    q: 'Czy Pro wystarczy dla agencji?',
    a: 'Dla wielu małych i średnich agencji tak: 50 audytów/mc, white-label PDF, harmonogramy i API. Jeśli potrzebujesz większej skali, weź Enterprise.',
  },
  {
    q: 'Co zawiera Enterprise?',
    a: 'Enterprise to wszystko z Pro + brak limitów, dedykowane wsparcie i warunki SLA pod potrzeby zespołu.',
  },
];

export default function CennikPage() {
  const proPlan = pricingPlans.find(p => p.title.toLowerCase() === 'pro');
  const enterprisePlan = pricingPlans.find(p => p.title.toLowerCase() === 'enterprise');

  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            path: '/cennik',
            title: 'Cennik — SiteSpector | Plany Free, Pro i Enterprise',
            description:
              'Wybierz plan SiteSpector: Free na start, Pro dla profesjonalistów i agencji, Enterprise dla zespołów. Porównanie funkcji, limitów i odpowiedzi na pytania o płatności.',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Cennik', path: '/cennik' },
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
                  <span>CENNIK</span>
                </div>
                <div className="main-title mt-3">
                  <h1 className="display-4 fw-bold text-primary mb-0">
                    Prosty cennik.{' '}
                    <span className="text-gradient text-line">Realne efekty</span>.
                  </h1>
                </div>
                <p className="lead text-muted mt-4 mb-0">
                  Zacznij w planie Free, a gdy będziesz gotowy na pełny workflow (Senuto, AI, Execution Plan, white-label PDF) przejdź na Pro.
                </p>
                <div className="mt-4">
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold me-2 my-2">
                    Rozpocznij za darmo
                  </Link>
                  <Link href="/porownanie" className="btn btn-outline-primary px-5 py-3 fw-bold my-2">
                    Porównaj z konkurencją
                  </Link>
                </div>

                <div className="mt-4 text-muted small">
                  Najczęściej wybierany:{' '}
                  <span className="text-primary fw-semibold">Pro</span>
                  {proPlan?.price ? (
                    <>
                      {' '}
                      ({`$${proPlan.price}/${proPlan.period}`})
                    </>
                  ) : null}
                  {enterprisePlan?.price ? (
                    <>
                      {' '}
                      • Enterprise od {`$${enterprisePlan.price}/${enterprisePlan.period}`}
                    </>
                  ) : null}
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Pricing cards – reuse existing component (keeps styling consistent with homepage). */}
        <Pricing />

        <section className="section py-5 bg-white">
          <Container>
            <Row className="justify-content-center mb-4">
              <Col lg={10}>
                <div className="title-sm text-center">
                  <span>PORÓWNANIE PLANÓW</span>
                </div>
                <div className="main-title mt-3 text-center">
                  <h2 className="text-primary">
                    Co dostajesz w <span className="text-orange text-line">każdym planie</span>
                  </h2>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col lg={12}>
                <div className="bg-white shadow-sm rounded-4 overflow-hidden border">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="p-4 border-0">Funkcja</th>
                        <th className="p-4 border-0 text-center" style={{ width: '20%' }}>
                          Free
                        </th>
                        <th className="p-4 border-0 text-center text-orange fw-bold" style={{ width: '20%' }}>
                          Pro
                        </th>
                        <th className="p-4 border-0 text-center" style={{ width: '20%' }}>
                          Enterprise
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-4 fw-medium text-primary border-bottom">{row.feature}</td>
                          <Cell value={row.free} />
                          <Cell value={row.pro} highlighted />
                          <Cell value={row.enterprise} />
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="section py-5 bg-light" id="pricing-faq">
          <Container>
            <Row className="justify-content-center mb-4">
              <Col lg={10} className="text-center">
                <div className="title-sm">
                  <span>FAQ</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Pytania o <span className="text-orange text-line">płatności</span>
                  </h2>
                </div>
                <p className="text-muted mt-3 mb-0">
                  Krótkie odpowiedzi na najczęstsze pytania o plany i subskrypcję.
                </p>
              </Col>
            </Row>

            <Row className="g-4 justify-content-center">
              {pricingFaq.map(({ q, a }) => (
                <Col key={q} md={6} lg={5}>
                  <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                    <div className="d-flex align-items-start">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3 me-3 flex-shrink-0">
                        <RiQuestionLine size={22} className="text-orange" />
                      </div>
                      <div>
                        <h3 className="h6 text-primary fw-bold mb-2">{q}</h3>
                        <p className="text-muted mb-0">{a}</p>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            <Row className="justify-content-center mt-5">
              <Col lg={10}>
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm text-center">
                  <div className="main-title">
                    <h2 className="text-primary mb-2">
                      Gotowy na <span className="text-orange text-line">pierwszy audyt</span>?
                    </h2>
                  </div>
                  <p className="text-muted mb-4">
                    Zacznij w planie Free i zobacz wyniki w kilka minut. Jeśli potrzebujesz skali i raportowania dla klientów, przejdź na Pro.
                  </p>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Załóż konto
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

