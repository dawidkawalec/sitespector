import type { ElementType } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { RiNumber1, RiNumber2, RiNumber3, RiNumber4, RiNumber5, RiNumber6, RiNumber7, RiNumber8 } from 'react-icons/ri';

export interface FaqItem {
  id: number;
  icon: ElementType<{ size?: number; className?: string }>;
  question: string;
  answer: string;
}

export const faqData: FaqItem[] = [
  {
    id: 1,
    icon: RiNumber1,
    question: 'Jak działa audyt SiteSpector?',
    answer:
      '3 fazy: techniczna (Screaming Frog + Lighthouse + Senuto), analiza AI oraz Execution Plan. Wyniki pojawiają się zwykle w 1-3 minuty.',
  },
  {
    id: 2,
    icon: RiNumber2,
    question: 'Czy mogę generować raporty PDF dla klientów?',
    answer:
      'Tak. Raport PDF jest dostępny po zakończeniu audytu. W planach Pro i Enterprise możesz generować wersje white-label gotowe do wysyłki klientom.',
  },
  {
    id: 3,
    icon: RiNumber3,
    question: 'Ile trwa analiza strony?',
    answer:
      'Zazwyczaj 1-3 minuty. Faza techniczna trwa ok. 1-2 min, a analiza AI może dogrywać się w tle.',
  },
  {
    id: 4,
    icon: RiNumber4,
    question: 'Czy mogę zaprosić zespół?',
    answer:
      'Tak. Możesz tworzyć Workspace’y, zapraszać członków i przydzielać role (Właściciel, Admin, Członek).',
  },
  {
    id: 5,
    icon: RiNumber5,
    question: 'Co to jest Execution Plan?',
    answer:
      'To lista zadań generowana przez AI z priorytetami i gotowym kodem. Możesz odznaczać wykonane elementy i dodawać notatki do wdrożenia.',
  },
  {
    id: 6,
    icon: RiNumber6,
    question: 'Czy dane moich klientów są bezpieczne?',
    answer:
      'Tak. Stosujemy SSL (TLS), a dane są izolowane w ramach Workspace’u (Row Level Security).',
  },
  {
    id: 7,
    icon: RiNumber7,
    question: 'Gdzie przechowywane są moje dane?',
    answer:
      'Supabase przechowuje dane kont i zespołów, a wyniki audytów trzymamy na VPS w Niemczech (Hetzner). Wszystko w Unii Europejskiej, zgodnie z RODO.',
  },
  {
    id: 8,
    icon: RiNumber8,
    question: 'Co to jest AI Overviews?',
    answer:
      'To monitoring, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI w wyszukiwarce. SiteSpector analizuje to w ramach integracji z Senuto.',
  },
];

const Faq = () => {
  const leftColumn = faqData.slice(0, 4);
  const rightColumn = faqData.slice(4);

  return (
    <>
      <section className="section faq-section" id="faq">
        <Container>
          <Row className="align-items-center justify-content-center text-center">
            <Col lg={7}>
              <div className="title-sm">
                <span>POMOC</span>
              </div>
              <div className="price-title main-title mt-3">
                <h2 className="text-primary">
                  Najczęściej zadawane <span className="text-orange text-line">Pytania</span>
                </h2>
              </div>
            </Col>
          </Row>
          <Row className="align-items-center justify-content-between mt-5">
            <Col lg={5}>
              {leftColumn.map(({ id, icon: Icon, question, answer }) => (
                <div key={id} className="faq-all mt-5">
                  <h5 className="lh-base">
                    <Icon
                      size={36}
                      className="me-3 p-2 bg-success-subtle text-primary rounded-circle align-middle"
                    />
                    {question}
                  </h5>
                  <p className="ms-5">{answer}</p>
                </div>
              ))}
            </Col>
            <Col lg={5}>
              {rightColumn.map(({ id, icon: Icon, question, answer }) => (
                <div key={id} className="faq-all mt-5">
                  <h5 className="lh-base">
                    <Icon
                      size={36}
                      className="me-3 p-2 bg-success-subtle text-primary rounded-circle align-middle"
                    />
                    {question}
                  </h5>
                  <p className="ms-5">{answer}</p>
                </div>
              ))}
            </Col>
          </Row>
        </Container>
        <div className="faq-back">
          <h1 className="fw-bold">FAQ</h1>
        </div>
      </section>
    </>
  );
};

export default Faq;
