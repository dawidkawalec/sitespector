'use client';

// =============================================================
// PAGE SHELL: /integracje
// Content source: landing/content/pages/integracje.md
// =============================================================

import React from 'react';
import { Container } from 'react-bootstrap';

export default function IntegracjePage() {
  return (
    <section className="section py-5">
      <Container>
        <div className="text-center mb-5">
          <p className="title-sm text-orange">EKOSYSTEM</p>
          <h1 className="main-title">Integracje SiteSpector</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
            Screaming Frog, Lighthouse, Senuto, Gemini AI — najlepsze narzędzia SEO w jednej platformie.
          </p>
        </div>
        <div className="text-center py-5">
          <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: 800 }}>
            <p className="text-muted mb-3">Treść strony w przygotowaniu</p>
            <p className="text-muted small">
              Źródło treści: <code>landing/content/pages/integracje.md</code>
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
