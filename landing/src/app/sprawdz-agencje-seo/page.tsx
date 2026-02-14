'use client';

// =============================================================
// PAGE SHELL: /sprawdz-agencje-seo
// Content source: landing/content/pages/sprawdz-agencje-seo.md
// =============================================================
// This is a content-driven page shell.
// During Phase 2 (component refactor), this will read from the
// markdown content file. For now it serves as a route placeholder.

import React from 'react';
import { Container } from 'react-bootstrap';

export default function SprawdzAgencjeSeoPage() {
  return (
    <section className="section py-5">
      <Container>
        <div className="text-center mb-5">
          <p className="title-sm text-orange">WERYFIKACJA AGENCJI</p>
          <h1 className="main-title">Sprawdź swoją agencję SEO</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
            Nie wiesz, czy Twoja agencja SEO naprawdę pracuje? Zweryfikuj efekty w 3 minuty.
          </p>
        </div>
        <div className="text-center py-5">
          <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: 800 }}>
            <p className="text-muted mb-3">Treść strony w przygotowaniu</p>
            <p className="text-muted small">
              Źródło treści: <code>landing/content/pages/sprawdz-agencje-seo.md</code>
            </p>
            <a href="/login" className="btn btn-primary mt-3">
              Sprawdź za darmo
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
