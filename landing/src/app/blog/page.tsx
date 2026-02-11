import React from 'react';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { getSortedPostsData } from '@/lib/blog';
import Link from 'next/link';

export default async function BlogPage() {
  const posts = await getSortedPostsData();

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <section className="section py-5">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-lg-8 text-center">
                <h1 className="display-4 fw-bold text-primary mb-3">Blog SiteSpector</h1>
                <p className="lead text-muted">Wiedza o SEO, wydajności i automatyzacji audytów w jednym miejscu.</p>
              </div>
            </div>

            <div className="row g-4">
              {posts.map((post) => (
                <div className="col-md-6 col-lg-4" key={post.slug}>
                  <div className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift transition-all card">
                    <div className="p-4 d-flex flex-column card-body">
                      <div className="text-muted small mb-2">
                        {post.date} • {post.author}
                      </div>
                      <h2 className="h4 fw-bold text-primary mb-3">{post.title}</h2>
                      <p className="text-muted mb-4 flex-grow-1">{post.excerpt}</p>
                      <Link href={`/blog/${post.slug}`} passHref legacyBehavior>
                        <a className="btn btn-outline-orange mt-auto align-self-start">
                          Czytaj dalej
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">Wkrótce pojawią się tutaj pierwsze wpisy.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
