import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { getSortedPostsData } from '@/lib/blog';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterClient from './NewsletterClient';

export const metadata: Metadata = {
  title: 'Blog — SiteSpector | Artykuły o SEO, audytach i widoczności',
  description:
    'Artykuły o audytach SEO, Core Web Vitals, Execution Plan, AI Overviews i optymalizacji stron. Porady, case studies i poradniki od zespołu SiteSpector.',
  keywords: ['blog SEO', 'audyt strony', 'poradniki SEO', 'SiteSpector blog'],
};

const FILTER_CATEGORIES = [
  'Wszystkie',
  'Audyty SEO',
  'Wydajność (Core Web Vitals)',
  'AI i widoczność',
  'Poradniki',
  'Case studies',
  'Aktualności',
] as const;

type FilterCategory = (typeof FILTER_CATEGORIES)[number];

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function buildHref(category: FilterCategory, page?: number) {
  const params = new URLSearchParams();
  if (category !== 'Wszystkie') params.set('category', category);
  if (page && page > 1) params.set('page', String(page));
  const q = params.toString();
  return q ? `/blog?${q}` : '/blog';
}

function getPaginationItems(totalPages: number, currentPage: number): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const delta = 2;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let p = currentPage - delta; p <= currentPage + delta; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push('ellipsis');
    items.push(p);
    prev = p;
  }
  return items;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const posts = await getSortedPostsData();

  const selected = (sp.category || '').trim();
  const selectedCategory = (FILTER_CATEGORIES.includes(selected as FilterCategory) ? selected : 'Wszystkie') as FilterCategory;

  const postsWithCategory = posts.map(p => {
    const cat = (p.category || '').trim();
    const displayCategory = (FILTER_CATEGORIES.includes(cat as FilterCategory) ? cat : 'Poradniki') as Exclude<FilterCategory, 'Wszystkie'>;
    return { ...p, displayCategory };
  });

  const filtered =
    selectedCategory === 'Wszystkie'
      ? postsWithCategory
      : postsWithCategory.filter(p => p.displayCategory === selectedCategory);

  const pageSize = 9;
  const page = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5 bg-light">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-8 text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">
                  Blog <span className="text-gradient text-line">SiteSpector</span>
                </h1>
                <p className="lead text-muted mb-0">
                  Artykuły o audytach SEO, wydajności stron, AI w wyszukiwarkach i praktycznych poradach dla agencji i właścicieli witryn.
                </p>
              </div>
            </div>

            <div className="row justify-content-center mb-4">
              <div className="col-lg-10 text-center">
                <div className="title-sm">
                  <span>KATEGORIE</span>
                </div>
                <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
                  {FILTER_CATEGORIES.map(cat => (
                    <Link
                      key={cat}
                      href={buildHref(cat)}
                      className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-primary'}`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="row g-4">
              {paged.map((post) => (
                <div className="col-md-6 col-lg-4" key={post.slug}>
                  <article className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift transition-all card">
                    <div className="position-relative">
                      {post.coverImage?.src ? (
                        <div className="ratio ratio-16x9 bg-white">
                          <Image
                            src={post.coverImage.src}
                            alt={post.coverImage.alt || post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-fit-cover"
                          />
                        </div>
                      ) : (
                        <div className="ratio ratio-16x9 bg-white d-flex align-items-center justify-content-center">
                          <div className="text-muted small">Okładka (placeholder)</div>
                        </div>
                      )}
                      <div className="position-absolute top-0 start-0 p-3">
                        <span className="badge bg-white text-primary border">{post.displayCategory}</span>
                      </div>
                    </div>

                    <div className="p-4 d-flex flex-column card-body">
                      <div className="text-muted small mb-2">
                        {formatDate(post.date)} • {post.author}
                        {post.readingTimeMinutes ? ` • ${post.readingTimeMinutes} min` : ''}
                      </div>
                      <h2 className="h5 fw-bold text-primary mb-3">
                        <Link href={`/blog/${post.slug}`} className="text-decoration-none text-primary">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-muted mb-4 flex-grow-1">
                        {(post.excerpt || '').length > 120 ? `${post.excerpt.slice(0, 117)}...` : post.excerpt}
                      </p>
                      <Link href={`/blog/${post.slug}`} className="btn btn-outline-primary mt-auto align-self-start fw-bold">
                        Czytaj dalej
                      </Link>
                    </div>
                  </article>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-12 text-center py-5">
                  <p className="text-muted mb-0">Wkrótce pojawią się tutaj pierwsze wpisy.</p>
                </div>
              )}
            </div>

            {filtered.length > 0 && totalPages > 1 && (
              <div className="row justify-content-center mt-5">
                <div className="col-lg-10">
                  <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                    <Link
                      href={buildHref(selectedCategory, pageSafe - 1)}
                      className={`btn btn-sm btn-outline-primary ${pageSafe <= 1 ? 'disabled' : ''}`}
                      aria-disabled={pageSafe <= 1}
                    >
                      Poprzednia
                    </Link>

                    {getPaginationItems(totalPages, pageSafe).map((item, idx) => {
                      if (item === 'ellipsis') {
                        return (
                          <span key={`e-${idx}`} className="px-2 text-muted">
                            …
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={item}
                          href={buildHref(selectedCategory, item)}
                          className={`btn btn-sm ${item === pageSafe ? 'btn-primary' : 'btn-outline-primary'}`}
                        >
                          {item}
                        </Link>
                      );
                    })}

                    <Link
                      href={buildHref(selectedCategory, pageSafe + 1)}
                      className={`btn btn-sm btn-outline-primary ${pageSafe >= totalPages ? 'disabled' : ''}`}
                      aria-disabled={pageSafe >= totalPages}
                    >
                      Następna
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="row justify-content-center mt-5">
              <div className="col-lg-10">
                <NewsletterClient />
              </div>
            </div>

            <div className="row justify-content-center mt-5">
              <div className="col-lg-10">
                <div className="bg-white rounded-4 border p-4 p-lg-5 shadow-sm text-center">
                  <div className="title-sm">
                    <span>GOTOWY NA PRAKTYKĘ?</span>
                  </div>
                  <h3 className="text-primary fw-bold mt-2 mb-2">Nie tylko czytaj — wypróbuj SiteSpector</h3>
                  <p className="text-muted mb-4">
                    Wiele porad z naszego bloga możesz od razu wdrożyć w audycie. Plan Free — 5 audytów miesięcznie.
                  </p>
                  <Link href="/login" className="btn btn-primary px-5 py-3 fw-bold">
                    Rozpocznij darmowy audyt
                  </Link>
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
