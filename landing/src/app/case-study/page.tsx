import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import Link from 'next/link';
import Image from 'next/image';
import { RiFilter3Line, RiLineChartLine } from 'react-icons/ri';
import { getSortedCaseStudiesData } from '@/lib/caseStudies';

export const metadata: Metadata = {
  title: 'Case studies — SiteSpector | Przykłady sukcesów SEO',
  description:
    'Sprawdź, jak agencje, sklepy i freelancerzy wykorzystują SiteSpector do audytów SEO. Przed i po, kluczowe metryki, wyzwania i rozwiązania.',
  keywords: ['case study SEO', 'audyt strony case study', 'SiteSpector przykłady', 'sukces SEO'],
};

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function buildHref(category: string | undefined) {
  if (!category || category === 'Wszystkie') return '/case-study';
  return `/case-study?category=${encodeURIComponent(category)}`;
}

export default async function CaseStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selectedCategory = (category || '').trim();

  const allCaseStudies = await getSortedCaseStudiesData();
  const categories = Array.from(new Set(allCaseStudies.map(cs => cs.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const filtered = selectedCategory
    ? allCaseStudies.filter(cs => cs.category === selectedCategory)
    : allCaseStudies;

  const featuredSlugs = new Set(['agencja-webpro', 'ecommerce-fashionhouse']);
  const featured = allCaseStudies.filter(cs => featuredSlugs.has(cs.slug)).slice(0, 2);

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-light">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-9 text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Case studies — prawdziwe wyniki</h1>
                <p className="lead text-muted mb-0">
                  Zobacz, jak agencje SEO, sklepy e-commerce i freelancerzy wykorzystują SiteSpector do audytów, weryfikacji agencji i wzrostu widoczności.
                </p>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                  <span className="text-muted small d-flex align-items-center me-2">
                    <RiFilter3Line className="me-1" /> Kategorie:
                  </span>
                  <Link
                    href={buildHref(undefined)}
                    className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline-primary'}`}
                  >
                    Wszystkie
                  </Link>
                  {categories.map(cat => (
                    <Link
                      href={buildHref(cat)}
                      key={cat}
                      className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-primary'}`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {featured.length > 0 && !selectedCategory && (
          <section className="section py-5 bg-white" id="featured">
            <div className="container">
              <div className="row justify-content-center mb-4">
                <div className="col-lg-10">
                  <div className="title-sm">
                    <span>WYRÓŻNIONE</span>
                  </div>
                  <div className="main-title mt-3">
                    <h2 className="text-primary">
                      Najpopularniejsze <span className="text-orange text-line">case studies</span>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="row justify-content-center g-4">
                {featured.map(cs => (
                  <div className="col-lg-10" key={cs.slug}>
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="row g-0">
                        <div className="col-lg-4 bg-orange p-4 p-lg-5 d-flex flex-column justify-content-center text-white">
                          <div className="badge bg-white text-orange align-self-start mb-3 px-3 py-2">{cs.category}</div>
                          <div className="h4 fw-bold mb-2">{cs.title}</div>
                          <div className="opacity-75 small">{formatDate(cs.date)}</div>
                        </div>
                        <div className="col-lg-8">
                          <div className="p-4 p-lg-5">
                            <div className="row g-4">
                              <div className="col-md-6">
                                <div className="fw-bold text-primary mb-2">Wyzwanie</div>
                                <div className="text-muted small lh-lg">{cs.challengeSummary || '—'}</div>

                                <div className="fw-bold text-primary mt-4 mb-2">Efekt</div>
                                <div className="text-muted small lh-lg">{cs.resultsSummary || '—'}</div>
                              </div>
                              <div className="col-md-6">
                                <div className="bg-light rounded-4 p-4 h-100">
                                  <div className="fw-bold text-primary mb-3 d-flex align-items-center">
                                    <RiLineChartLine className="me-2 text-orange" /> Kluczowe metryki
                                  </div>
                                  <div className="text-muted small">
                                    {(cs.keyMetrics || []).slice(0, 4).map(m => (
                                      <div key={m.label} className="mb-2">
                                        <span className="text-primary fw-semibold">{m.label}:</span> {m.before} →{' '}
                                        <span className="text-dark fw-semibold">{m.after}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4">
                                    <Link href={`/case-study/${cs.slug}`} className="btn btn-outline-primary fw-bold">
                                      Czytaj pełne studium
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section py-5 bg-white" id="lista">
          <div className="container">
            <div className="row justify-content-center mb-4">
              <div className="col-lg-10">
                <div className="title-sm">
                  <span>CASE STUDIES</span>
                </div>
                <div className="main-title mt-3">
                  <h2 className="text-primary">
                    Wszystkie <span className="text-orange text-line">historie</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {filtered.map(cs => (
                <div className="col-md-6 col-lg-4" key={cs.slug}>
                  <article className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 hover-lift transition-all">
                    <div className="position-relative">
                      {cs.coverImage?.src ? (
                        <div className="ratio ratio-16x9 bg-light">
                          <Image
                            src={cs.coverImage.src}
                            alt={cs.coverImage.alt || cs.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-fit-cover"
                          />
                        </div>
                      ) : (
                        <div className="ratio ratio-16x9 bg-light d-flex align-items-center justify-content-center">
                          <div className="text-muted small">Brak okładki (placeholder)</div>
                        </div>
                      )}
                      <div className="position-absolute top-0 start-0 p-3">
                        <span className="badge bg-white text-primary border">{cs.category}</span>
                      </div>
                    </div>

                    <div className="card-body p-4 d-flex flex-column">
                      <div className="text-muted small mb-2">{formatDate(cs.date)}</div>
                      <h3 className="h5 fw-bold text-primary mb-2">{cs.title}</h3>
                      <p className="text-muted mb-3">{cs.challengeSummary || cs.resultsSummary || '—'}</p>

                      <div className="text-primary fw-bold mt-auto">
                        <Link href={`/case-study/${cs.slug}`} className="btn btn-outline-primary fw-bold">
                          Czytaj pełne studium
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-12 text-center py-5">
                  <div className="text-muted">Brak case studies w tej kategorii.</div>
                </div>
              )}
            </div>

            <div className="mt-5 p-4 p-lg-5 bg-light rounded-4 text-center border shadow-sm" id="cta">
              <div className="title-sm">
                <span>TWOJA HISTORIA SUKCESU?</span>
              </div>
              <h3 className="text-primary fw-bold mt-2 mb-2">Zacznij swoją transformację z SiteSpector</h3>
              <p className="text-muted mb-4">
                Wypróbuj darmowy plan. 5 audytów miesięcznie. Zobacz, czy SiteSpector pasuje do Twojego workflow — tak jak pasuje do setek agencji i sklepów.
              </p>
              <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                Rozpocznij darmowy audyt
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
