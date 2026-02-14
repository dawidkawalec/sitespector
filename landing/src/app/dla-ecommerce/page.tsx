'use client';

// =============================================================
// PAGE SHELL: /dla-ecommerce
// Content source: landing/content/pages/dla-ecommerce.md
// =============================================================

import React from 'react';
import { Container } from 'react-bootstrap';

export default function DlaEcommercePage() {
  return (
    <section className="section py-5">
      <Container>
        <div className="text-center mb-5">
          <p className="title-sm text-orange">DLA E-COMMERCE</p>
          <h1 className="main-title">SiteSpector dla sklepów internetowych</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
            Audyt SEO Twojego sklepu w 3 minuty — sprawdź co blokuje Twój ruch i sprzedaż.
          </p>
        </div>
        <div className="text-center py-5">
          <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: 800 }}>
            <p className="text-muted mb-3">Treść strony w przygotowaniu</p>
            <p className="text-muted small">
              Źródło treści: <code>landing/content/pages/dla-ecommerce.md</code>
            </p>
            <a href="/login" className="btn btn-primary mt-3">
              Sprawdź swój sklep za darmo
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
