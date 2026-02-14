import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { getCaseStudyData, getSortedCaseStudiesData } from '@/lib/caseStudies';
import { RiArrowLeftLine, RiQuoteText } from 'react-icons/ri';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/schema';

export async function generateStaticParams() {
  const all = await getSortedCaseStudiesData();
  return all.map(cs => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const cs = await getCaseStudyData(slug);
    const title = `${cs.title} — Case study`;
    const description = cs.resultsSummary || cs.challengeSummary || 'Case study SiteSpector.';
    return buildMetadata({
      title,
      description,
      path: `/case-study/${cs.slug}`,
      type: 'article',
      ogImageType: 'casestudy',
      publishedTime: cs.date,
      authors: ['SiteSpector'],
    });
  } catch {
    return { title: 'Case study | SiteSpector' };
  }
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default async function CaseStudySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let cs;
  try {
    cs = await getCaseStudyData(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={[
          buildArticleSchema({
            path: `/case-study/${cs.slug}`,
            title: cs.title,
            description: cs.resultsSummary || cs.challengeSummary,
            datePublished: cs.date,
            authorName: 'SiteSpector',
            image: cs.coverImage?.src || undefined,
            type: 'Article',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Case studies', path: '/case-study' },
            { name: cs.title, path: `/case-study/${cs.slug}` },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <article className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <Link href="/case-study" className="btn btn-sm btn-outline-primary mb-4">
                  <RiArrowLeftLine className="me-1" />
                  Wróć do listy case studies
                </Link>

                <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                  {cs.category && <span className="badge bg-light text-primary border">{cs.category}</span>}
                  {cs.date && <span className="text-muted small">{formatDate(cs.date)}</span>}
                </div>

                <h1 className="display-5 fw-bold text-primary mb-3">{cs.title}</h1>
                {(cs.challengeSummary || cs.resultsSummary) && (
                  <p className="lead text-muted mb-4">{cs.resultsSummary || cs.challengeSummary}</p>
                )}

                {cs.coverImage?.src && (
                  <div className="position-relative ratio ratio-16x9 rounded-4 overflow-hidden border bg-light mb-4">
                    <Image
                      src={cs.coverImage.src}
                      alt={cs.coverImage.alt || cs.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 900px"
                      className="object-fit-cover"
                    />
                  </div>
                )}

                {cs.keyMetrics && cs.keyMetrics.length > 0 && (
                  <div className="bg-light rounded-4 border p-4 mb-4">
                    <div className="text-primary fw-bold mb-2">Kluczowe metryki</div>
                    <div className="text-muted">
                      {cs.keyMetrics.map(m => (
                        <div key={m.label} className="mb-2">
                          <span className="text-primary fw-semibold">{m.label}:</span> {m.before} →{' '}
                          <span className="text-dark fw-semibold">{m.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cs.testimonial?.quote && (
                  <div className="bg-white rounded-4 border p-4 mb-4 shadow-sm">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-orange-subtle rounded-circle d-inline-flex p-3">
                        <RiQuoteText className="text-orange" />
                      </div>
                      <div>
                        <div className="text-primary fw-bold mb-2">Opinia</div>
                        <div className="text-muted fst-italic">“{cs.testimonial.quote}”</div>
                        {(cs.testimonial.author || cs.testimonial.role) && (
                          <div className="text-muted small mt-2">
                            {cs.testimonial.author || '—'}
                            {cs.testimonial.role ? `, ${cs.testimonial.role}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="case-study-content text-muted lh-lg" dangerouslySetInnerHTML={{ __html: cs.contentHtml || '' }} />

                <hr className="my-5" />

                <div className="bg-light p-4 p-lg-5 rounded-4 text-center border shadow-sm">
                  <h3 className="text-primary fw-bold mb-2">Chcesz podobny efekt u siebie?</h3>
                  <p className="text-muted mb-4">
                    Uruchom darmowy audyt w SiteSpector i zobacz 3-fazowy raport + Execution Plan z konkretnymi zadaniami.
                  </p>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Rozpocznij darmowy audyt
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

