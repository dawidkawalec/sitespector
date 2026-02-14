import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { RiArrowLeftLine, RiBookOpenLine } from 'react-icons/ri';
import { DOC_PAGES, getDocPage } from '@/lib/docs';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/schema';

export function generateStaticParams() {
  return DOC_PAGES.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return { title: 'Dokumentacja — SiteSpector' };

  return buildMetadata({
    title: `${page.title} — Dokumentacja`,
    description: page.description,
    path: `/docs/${page.slug}`,
    ogImageType: 'docs',
  });
}

export default async function DocsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={[
          buildArticleSchema({
            path: `/docs/${page.slug}`,
            title: page.title,
            description: page.description,
            authorName: 'SiteSpector',
            type: 'TechArticle',
          }),
          buildBreadcrumbSchema([
            { name: 'SiteSpector', path: '/' },
            { name: 'Dokumentacja', path: '/docs' },
            { name: page.title, path: `/docs/${page.slug}` },
          ]),
        ]}
      />
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <Link href="/docs" className="btn btn-sm btn-outline-primary mb-4">
                  <RiArrowLeftLine className="me-1" />
                  Wróć do kategorii
                </Link>

                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-orange-subtle rounded-circle d-inline-flex p-3">
                    <RiBookOpenLine size={22} className="text-orange" />
                  </div>
                  <h1 className="h2 text-primary fw-bold mb-0">{page.title}</h1>
                </div>

                <p className="text-muted lead">{page.description}</p>

                <div className="bg-light rounded-4 border p-4 mt-4">
                  <div className="text-primary fw-bold mb-2">Tematy w tej sekcji</div>
                  <div className="text-muted">
                    {page.bullets.map(b => (
                      <div key={b}>• {b}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-4 border p-4 mt-4 shadow-sm">
                  <div className="text-primary fw-bold mb-2">W przygotowaniu</div>
                  <div className="text-muted">
                    Ta dokumentacja jest rozwijana iteracyjnie. Jeśli potrzebujesz pomocy już teraz, napisz do nas lub uruchom pierwszy audyt i zobacz wyniki w panelu.
                  </div>
                  <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                    <Link href="/kontakt" className="btn btn-primary px-4 py-3 fw-bold">
                      Skontaktuj się z nami
                    </Link>
                    <Link href="/login" className="btn btn-outline-primary px-4 py-3 fw-bold">
                      Rozpocznij darmowy audyt
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

