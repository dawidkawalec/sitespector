import { Col, Container, Row } from 'react-bootstrap';
import { RiNumber1, RiNumber2, RiNumber3, RiNumber4, RiNumber5, RiNumber6, RiNumber7, RiNumber8 } from 'react-icons/ri';

export interface FaqItem {
  id: number;
  icon: any;
  question: string;
  answer: string;
}

export const faqData: FaqItem[] = [
  {
    id: 1,
    icon: RiNumber1,
    question: 'Jak działa audyt SiteSpector?',
    answer:
      'Nasze roboty skanują Twoją stronę podobnie jak Googlebot, analizując kod, treść i wydajność. Następnie AI przetwarza dane i generuje listę rekomendacji.',
  },
  {
    id: 2,
    icon: RiNumber2,
    question: 'Czy mogę generować raporty PDF dla klientów?',
    answer:
      'Tak, w planach Pro i Enterprise możesz generować profesjonalne, białe raporty PDF gotowe do wysłania klientowi.',
  },
  {
    id: 3,
    icon: RiNumber3,
    question: 'Ile trwa analiza strony?',
    answer:
      'Standardowy audyt trwa od 1 do 3 minut, w zależności od wielkości strony i obciążenia serwerów.',
  },
  {
    id: 4,
    icon: RiNumber4,
    question: 'Czy mogę zaprosić zespół?',
    answer:
      'Tak, SiteSpector obsługuje Workspace\'y. Możesz tworzyć zespoły, zapraszać członków i przydzielać im role (Właściciel, Admin, Członek).',
  },
  {
    id: 5,
    icon: RiNumber5,
    question: 'Jak działa analiza konkurencji?',
    answer:
      'Możesz dodać do 3 konkurentów do każdego audytu. Porównamy Twoją stronę z nimi pod kątem słów kluczowych, szybkości i struktury.',
  },
  {
    id: 6,
    icon: RiNumber6,
    question: 'Czy dane moich klientów są bezpieczne?',
    answer:
      'Tak, stosujemy szyfrowanie SSL, a dane są izolowane w ramach Twojego Workspace\'u (Row Level Security).',
  },
  {
    id: 7,
    icon: RiNumber7,
    question: 'Gdzie przechowywane są moje dane?',
    answer:
      'Dane użytkowników i zespołów są w Supabase (infrastruktura AWS EU). Wyniki audytów na naszym VPS w Niemczech (Hetzner). Wszystko w Unii Europejskiej, zgodnie z RODO.',
  },
  {
    id: 8,
    icon: RiNumber8,
    question: 'Jakie dane przesyłane są do AI?',
    answer:
      'Do Google Gemini przesyłamy wyłącznie dane techniczne strony: tytuł, meta opis, nagłówki, liczbę słów. Nie przesyłamy danych osobowych ani informacji o Twoim koncie.',
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
          <h1 className="fw-bold">FaQ's</h1>
        </div>
      </section>
    </>
  );
};

export default Faq;
