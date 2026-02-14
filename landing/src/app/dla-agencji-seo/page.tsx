'use client';

// =============================================================
// PAGE SHELL: /dla-agencji-seo
// Content source: landing/content/pages/dla-agencji-seo.md
// =============================================================

import React from 'react';
import { Container } from 'react-bootstrap';

export default function DlaAgencjiSeoPage() {
  return (
    <section className="section py-5">
      <Container>
        <div className="text-center mb-5">
          <p className="title-sm text-orange">DLA AGENCJI SEO</p>
          <h1 className="main-title">SiteSpector dla Agencji SEO</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
            Jeden panel dla wszystkich klientów — oszczędź czas i pieniądze swojej agencji.
          </p>
        </div>
        <div className="text-center py-5">
          <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: 800 }}>
            <p className="text-muted mb-3">Treść strony w przygotowaniu</p>
            <p className="text-muted small">
              Źródło treści: <code>landing/content/pages/dla-agencji-seo.md</code>
            </p>
            <a href="/login" className="btn btn-primary mt-3">
              Wypróbuj za darmo
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
