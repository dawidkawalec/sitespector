import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { getPostData } from '@/lib/blog';
import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  return (
    <>
      <Topbar />
      <main className="pt-5 mt-5">
        <article className="section py-5">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8}>
                <Link href="/blog" className="text-orange text-decoration-none d-flex align-items-center mb-4">
                  <RiArrowLeftLine className="me-2" /> Powrót do listy wpisów
                </Link>
                
                <div className="mb-5">
                  <div className="text-muted small mb-2">{post.date} • {post.author}</div>
                  <h1 className="display-4 fw-bold text-primary mb-4">{post.title}</h1>
                  <p className="lead text-dark fw-medium">{post.excerpt}</p>
                </div>

                <div 
                  className="blog-content text-muted lh-lg"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
                />

                <hr className="my-5" />

                <div className="bg-light p-5 rounded-4 text-center">
                  <h3 className="text-primary mb-3">Chcesz sprawdzić swoją stronę?</h3>
                  <p className="mb-4">Uruchom darmowy audyt SEO i wydajności w SiteSpector. Wyniki w 3 minuty.</p>
                  <Link href="/login" passHref legacyBehavior>
                    <Button variant="orange" className="px-5 py-3 fw-bold text-white">
                      Rozpocznij darmowy audyt
                    </Button>
                  </Link>
                </div>
              </Col>
            </Row>
          </Container>
        </article>
      </main>
      <Footer />
    </>
  );
}
