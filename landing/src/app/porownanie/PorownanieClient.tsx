'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Col, Container, Row, Table, Accordion } from 'react-bootstrap';
import {
  RiCheckLine, RiCloseLine, RiTerminalBoxLine, RiRobotLine,
  RiLineChartLine, RiShieldCheckLine, RiGlobalLine,
  RiChat3Line, RiUser3Line, RiTeamLine, RiBriefcaseLine, RiToolsLine,
} from 'react-icons/ri';

/* ─── Feature comparison data ─── */

type CellValue = boolean | string;

interface ComparisonRow {
  feature: string;
  sitespector: CellValue;
  ahrefs: CellValue;
  semrush: CellValue;
  sf: CellValue;
  seranking: CellValue;
  mangools: CellValue;
}

const comparisonData: ComparisonRow[] = [
  { feature: 'Cena entry (mies.)', sitespector: '$9.99', ahrefs: '$29', semrush: '$139.95', sf: '$22/mies (roczny)', seranking: '$65', mangools: '$29.90' },
  { feature: 'Crawl techniczny (SF engine)', sitespector: true, ahrefs: false, semrush: false, sf: true, seranking: 'Uproszczony', mangools: false },
  { feature: 'Core Web Vitals (Lighthouse)', sitespector: '✓ desktop + mobile', ahrefs: false, semrush: false, sf: false, seranking: false, mangools: false },
  { feature: 'Dane widocznosci PL (Senuto)', sitespector: true, ahrefs: false, semrush: false, sf: false, seranking: false, mangools: false },
  { feature: 'AI analiza (9 obszarow)', sitespector: true, ahrefs: false, semrush: false, sf: false, seranking: false, mangools: false },
  { feature: 'Execution Plan z kodem', sitespector: true, ahrefs: false, semrush: false, sf: false, seranking: false, mangools: false },
  { feature: 'Chat AI z kontekstem audytu', sitespector: '✓ RAG', ahrefs: false, semrush: 'AI Writing', sf: false, seranking: 'AI Writer', mangools: false },
  { feature: 'Raport PDF (3 typy)', sitespector: true, ahrefs: false, semrush: true, sf: 'CSV export', seranking: true, mangools: false },
  { feature: 'Keyword tracking', sitespector: 'via Senuto', ahrefs: true, semrush: true, sf: false, seranking: true, mangools: true },
  { feature: 'Backlink analysis', sitespector: 'via Senuto', ahrefs: true, semrush: true, sf: false, seranking: true, mangools: true },
  { feature: 'AI Overviews monitoring', sitespector: true, ahrefs: 'Beta', semrush: 'Beta', sf: false, seranking: false, mangools: false },
  { feature: 'White-label raporty', sitespector: 'Enterprise', ahrefs: false, semrush: 'Business', sf: false, seranking: true, mangools: false },
  { feature: 'Interfejs po polsku', sitespector: true, ahrefs: false, semrush: false, sf: false, seranking: false, mangools: false },
  { feature: 'Dane w EU (GDPR)', sitespector: '✓ Hetzner DE', ahrefs: '✗ US', semrush: '✗ US', sf: 'Lokalnie', seranking: '✗ UA', mangools: '✗ SK/US' },
];

function Cell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  const base = `p-3 text-center border-bottom align-middle ${highlighted ? 'bg-orange-subtle fw-semibold' : ''}`;
  if (typeof value === 'boolean') {
    return (
      <td className={base}>
        {value ? <RiCheckLine size={20} className="text-success" /> : <RiCloseLine size={20} className="text-muted opacity-50" />}
      </td>
    );
  }
  return <td className={base}><span className="small">{value}</span></td>;
}

/* ─── Pricing data ─── */

const pricingTools = [
  { name: 'SiteSpector', entry: '$9.99', annual: '$120', highlight: true },
  { name: 'Ahrefs', entry: '$29', annual: '$348' },
  { name: 'SEMrush', entry: '$139.95', annual: '$1,680' },
  { name: 'SE Ranking', entry: '$65', annual: '$780' },
  { name: 'Mangools', entry: '$29.90', annual: '$359' },
  { name: 'Screaming Frog', entry: '$22/mies', annual: '$259' },
];

/* ─── FAQ data ─── */

const faqData = [
  {
    q: 'Czy SiteSpector zastapi Ahrefs lub SEMrush?',
    a: 'SiteSpector skupia sie na audytach technicznych + AI analizie + Execution Plan. Jezeli potrzebujesz glownie keyword research i competitive intelligence na skale globalna, Ahrefs/SEMrush sa dobrym wyborem. Mozesz uzyc SiteSpector obok nich — jako narzedzie audytowe, ktore daje gotowy plan dzialania z kodem.',
  },
  {
    q: 'Dlaczego SiteSpector jest taki tani?',
    a: 'Nie utrzymujemy wlasnego indeksu backlinków ani keyword database — korzystamy z Senuto (dla polskiego rynku). Dzieki temu nie ponosimy kosztów infrastruktury na skale Ahrefs ($100M+ rocznie). Skupiamy sie na audytach i AI, gdzie dostarczamy unikalna wartosc.',
  },
  {
    q: 'Czy dane Senuto sa w cenie planu?',
    a: 'Tak — widocznosc, pozycje slow kluczowych, backlinki i AI Overviews monitoring sa wliczone w kazdy plan SiteSpector. Nie musisz kupowac osobnej subskrypcji Senuto.',
  },
  {
    q: 'Co z keyword trackerem i monitoringiem pozycji?',
    a: 'SiteSpector integruje dane widocznosci z Senuto (polskie pozycje, TOP 3/10/50, trendy). Jezeli potrzebujesz sledzenia setek fraz na 50 rynkach, rozważ Ahrefs/SEMrush jako uzupelnienie.',
  },
  {
    q: 'Czy moge przetestowac za darmo?',
    a: 'Tak — plan Free daje 50 kredytow na start (wystarczy na 1 pelny audyt z AI). Rejestracja bez karty kredytowej. Zobaczysz czesciowy raport z Execution Plan.',
  },
  {
    q: 'Czy SiteSpector dziala dla stron nie-polskich?',
    a: 'Crawl techniczny (Screaming Frog) i Lighthouse dzialaja globalnie. Dane widocznosci (Senuto) sa dostepne przede wszystkim dla polskiego rynku. Jezeli audytujesz strony polskie — masz pelny pakiet.',
  },
];

/* ─── Main component ─── */

export default function PorownanieClient() {
  return (
    <section className="section py-5 bg-white">
      <Container>
        {/* ── Hero ── */}
        <Row className="justify-content-center mb-5">
          <Col lg={10} className="text-center">
            <h1 className="display-4 fw-bold text-primary mb-3">
              SiteSpector vs <span className="text-gradient text-line">konkurencja</span>
            </h1>
            <p className="lead text-muted mb-2">
              Jeden tool zamiast pieciu subskrypcji. Screaming Frog + Lighthouse + Senuto + AI w jednym.
            </p>
            <p className="text-muted mb-4">Od <strong className="text-orange">$9.99/mies</strong> — taniej niz jakakolwiek alternatywa.</p>
            <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
              <Link href="/register" className="btn btn-primary px-5 py-3 fw-bold">
                Zacznij za darmo
              </Link>
              <Link href="/cennik" className="btn btn-outline-primary px-5 py-3 fw-bold">
                Zobacz cennik
              </Link>
            </div>
          </Col>
        </Row>

        {/* ── Feature Comparison Table ── */}
        <Row className="justify-content-center">
          <Col lg={12}>
            <div className="title-sm"><span>POROWNANIE FUNKCJI</span></div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                6 narzedzi, 14 <span className="text-orange text-line">kryteriow</span>
              </h2>
            </div>

            <div className="bg-white shadow-sm rounded-4 overflow-hidden border">
              <Table responsive hover className="mb-0 align-middle" style={{ fontSize: '0.88rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="p-3 border-0" style={{ minWidth: 180 }}>Funkcja</th>
                    <th className="p-3 border-0 text-center text-orange fw-bold" style={{ minWidth: 110 }}>SiteSpector</th>
                    <th className="p-3 border-0 text-center" style={{ minWidth: 100 }}>Ahrefs</th>
                    <th className="p-3 border-0 text-center" style={{ minWidth: 100 }}>SEMrush</th>
                    <th className="p-3 border-0 text-center" style={{ minWidth: 100 }}>Screaming Frog</th>
                    <th className="p-3 border-0 text-center" style={{ minWidth: 100 }}>SE Ranking</th>
                    <th className="p-3 border-0 text-center" style={{ minWidth: 100 }}>Mangools</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 fw-medium text-primary border-bottom">{row.feature}</td>
                      <Cell value={row.sitespector} highlighted />
                      <Cell value={row.ahrefs} />
                      <Cell value={row.semrush} />
                      <Cell value={row.sf} />
                      <Cell value={row.seranking} />
                      <Cell value={row.mangools} />
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>

        {/* ── Pricing Comparison ── */}
        <Row className="justify-content-center mt-5">
          <Col lg={12}>
            <div className="title-sm"><span>POROWNANIE CEN</span></div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                Ile <span className="text-orange text-line">naprawde zaplacisz</span> rocznie
              </h2>
            </div>

            <div className="row g-3">
              {pricingTools.map((tool) => (
                <div className="col-6 col-md-4 col-lg-2" key={tool.name}>
                  <div className={`card h-100 rounded-4 shadow-sm text-center ${tool.highlight ? 'border-2 border-orange' : 'border'}`}>
                    <div className="card-body p-3">
                      {tool.highlight && <div className="badge bg-orange text-white mb-2" style={{ fontSize: '0.65rem' }}>Najkorzystniej</div>}
                      <div className={`fw-bold ${tool.highlight ? 'text-orange' : 'text-primary'}`} style={{ fontSize: '0.85rem' }}>{tool.name}</div>
                      <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>od {tool.entry}/mies</div>
                      <div className={`h4 fw-bold mt-2 mb-0 ${tool.highlight ? 'text-orange' : 'text-primary'}`}>{tool.annual}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>/rok</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-light rounded-4 border text-center">
              <p className="mb-1 fw-bold text-primary">Oszczedzasz z SiteSpector:</p>
              <p className="mb-0 text-muted">
                <strong className="text-orange">$1,560/rok</strong> vs SEMrush &nbsp;·&nbsp;
                <strong className="text-orange">$228/rok</strong> vs Ahrefs &nbsp;·&nbsp;
                <strong className="text-orange">$660/rok</strong> vs SE Ranking
              </p>
            </div>
          </Col>
        </Row>

        {/* ── 5 Key Differentiators ── */}
        <Row className="justify-content-center mt-5">
          <Col lg={12}>
            <div className="title-sm"><span>DLACZEGO SITESPECTOR</span></div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                5 rzeczy, ktorych <span className="text-orange text-line">nie znajdziesz nigdzie indziej</span>
              </h2>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: RiToolsLine,
                  title: 'SF + Lighthouse + Senuto + AI w jednym',
                  desc: 'Zaden inny tool nie laczy crawlingu Screaming Frog, Core Web Vitals z Lighthouse, polskich danych z Senuto i analizy AI w jednym panelu. Nie przeskakujesz miedzy 4 oknami.',
                },
                {
                  icon: RiTerminalBoxLine,
                  title: 'Execution Plan z gotowym kodem',
                  desc: 'Nie "popraw meta tagi" — dostajesz gotowy kod HTML/JSON-LD do wklejenia. Do 200 priorytetyzowanych zadan z kodem, opisem i estymatem wplywu.',
                },
                {
                  icon: RiRobotLine,
                  title: 'AI Overviews monitoring',
                  desc: 'Sprawdzamy czy Twoje frazy kluczowe pojawiaja sie w odpowiedziach AI Google. Integracja z Senuto — unikalne na polskim rynku.',
                },
                {
                  icon: RiGlobalLine,
                  title: 'Polish-first: Senuto, polski UI, dane w EU',
                  desc: 'Interfejs po polsku, raporty PDF po polsku, dane widocznosci z polskiego Google (Senuto), serwery w Niemczech (GDPR). Zbudowany dla polskiego rynku.',
                },
                {
                  icon: RiChat3Line,
                  title: 'Chat AI z kontekstem audytu (RAG)',
                  desc: 'Pytaj AI o wyniki Twojego audytu po polsku. Chat zna Twoje dane — odpowiada konkretnie, nie ogolnie. 5 agentow specjalistycznych.',
                },
              ].map((w, idx) => {
                const Icon = w.icon;
                return (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <div className="bg-light rounded-4 border p-4 h-100 shadow-sm">
                      <div className="bg-white rounded-circle d-inline-flex p-3 shadow-sm mb-3">
                        <Icon size={24} className="text-orange" />
                      </div>
                      <h3 className="h5 text-primary fw-bold">{w.title}</h3>
                      <p className="text-muted mb-0 small">{w.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>

        {/* ── When to choose which tool ── */}
        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="title-sm"><span>KIEDY WYBRAC KTORE NARZEDZIE</span></div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                Dopasuj narzedzie do <span className="text-orange text-line">swoich potrzeb</span>
              </h2>
            </div>

            <div className="row g-3">
              {[
                {
                  icon: RiUser3Line,
                  persona: 'Freelancer SEO',
                  recommendation: 'SiteSpector Solo ($9.99/mies)',
                  why: 'Pelny audyt + raport PDF dla klienta w 30 minut. Taniej niz jakakolwiek alternatywa.',
                },
                {
                  icon: RiTeamLine,
                  persona: 'Agencja SEO',
                  recommendation: 'SiteSpector Agency ($29.99/mies)',
                  why: 'Workspaces per klient, harmonogramy, white-label raporty. 400 kredytow/mies = ~13 audytow.',
                },
                {
                  icon: RiBriefcaseLine,
                  persona: 'Enterprise + keyword tracking',
                  recommendation: 'Ahrefs/SEMrush + SiteSpector',
                  why: 'Ahrefs/SEMrush do sledzenia pozycji globalnie, SiteSpector do glebokich audytow z Execution Plan.',
                },
                {
                  icon: RiToolsLine,
                  persona: 'Jednorazowy crawl',
                  recommendation: 'Screaming Frog (desktop)',
                  why: 'Darmowy do 500 URL. Bez AI, bez CWV, bez raportow — ale dobry do jednorazowych sprawdzen.',
                },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div className="col-md-6" key={idx}>
                    <div className="border rounded-4 p-4 h-100 bg-white shadow-sm">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-orange-subtle rounded-circle d-inline-flex p-2">
                          <Icon size={20} className="text-orange" />
                        </div>
                        <div>
                          <div className="fw-bold text-primary">{s.persona}</div>
                          <div className="text-orange fw-semibold small">{s.recommendation}</div>
                        </div>
                      </div>
                      <p className="text-muted mb-0 small">{s.why}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>

        {/* ── FAQ ── */}
        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="title-sm"><span>CZESTE PYTANIA</span></div>
            <div className="main-title mt-3 mb-4">
              <h2 className="text-primary">
                FAQ — <span className="text-orange text-line">porownanie</span>
              </h2>
            </div>

            <Accordion className="shadow-sm rounded-4 overflow-hidden border">
              {faqData.map((item, idx) => (
                <Accordion.Item eventKey={String(idx)} key={idx}>
                  <Accordion.Header className="fw-semibold">{item.q}</Accordion.Header>
                  <Accordion.Body className="text-muted">{item.a}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Col>
        </Row>

        {/* ── Final CTA ── */}
        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="bg-primary rounded-4 p-4 p-lg-5 shadow text-center text-white">
              <h3 className="fw-bold mb-2">Wyprobuj za darmo — bez karty kredytowej</h3>
              <p className="mb-4 opacity-75">
                50 kredytow na start. Pelny audyt techniczny + AI analiza + Execution Plan w 30 minut.
              </p>
              <div className="d-flex justify-content-center flex-column flex-sm-row gap-2">
                <Link href="/register" className="btn btn-light px-5 py-3 fw-bold text-primary">
                  Zaloz konto za darmo
                </Link>
                <Link href="/cennik" className="btn btn-outline-light px-5 py-3 fw-bold">
                  Zobacz cennik
                </Link>
              </div>
            </div>
          </Col>
        </Row>

        {/* ── Blog link ── */}
        <Row className="justify-content-center mt-4 mb-3">
          <Col lg={10} className="text-center">
            <p className="text-muted small">
              Szukasz szczegolowego porownania? Przeczytaj nasz{' '}
              <Link href="/blog/porownanie-narzedzi-seo-2026" className="text-orange fw-semibold">
                artykul: Porownanie narzedzi SEO 2026
              </Link>.
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
