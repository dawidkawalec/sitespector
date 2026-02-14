import type { Metadata } from 'next';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { getPostData, getSortedPostsData } from '@/lib/blog';
import Link from 'next/link';
import Image from 'next/image';
import { RiArrowLeftLine } from 'react-icons/ri';

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostData(slug);
    return {
      title: `${post.title} — Blog | SiteSpector`,
      description: post.excerpt || 'Artykuł na blogu SiteSpector.',
    };
  } catch {
    return { title: 'Blog | SiteSpector' };
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <article className="section py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <Link href="/blog" className="text-orange text-decoration-none d-flex align-items-center mb-4">
                  <RiArrowLeftLine className="me-2" /> Powrót do listy wpisów
                </Link>

                <header className="mb-4">
                  <div className="d-flex align-items-center gap-2 flex-wrap text-muted small mb-2">
                    {post.category && <span className="badge bg-light text-primary border">{post.category}</span>}
                    <span>
                      {post.date} • {post.author}
                    </span>
                    {post.readingTimeMinutes ? <span>• {post.readingTimeMinutes} min</span> : null}
                  </div>
                  <h1 className="display-5 fw-bold text-primary mb-3">{post.title}</h1>
                  {post.excerpt ? <p className="lead text-dark fw-medium mb-0">{post.excerpt}</p> : null}
                </header>

                {post.coverImage?.src ? (
                  <div className="position-relative ratio ratio-16x9 rounded-4 overflow-hidden border bg-light mb-4">
                    <Image
                      src={post.coverImage.src}
                      alt={post.coverImage.alt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-fit-cover"
                    />
                  </div>
                ) : null}

                <div className="blog-content text-muted lh-lg" dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }} />

                <hr className="my-5" />

                <div className="bg-light p-4 p-lg-5 rounded-4 text-center border shadow-sm">
                  <h3 className="text-primary fw-bold mb-2">Chcesz sprawdzić swoją stronę?</h3>
                  <p className="text-muted mb-4">Uruchom darmowy audyt SEO i wydajności w SiteSpector. Wyniki w 3 minuty.</p>
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
