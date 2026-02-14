'use client';

// =============================================================
// PAGE SHELL: /jak-to-dziala
// Content source: landing/content/pages/jak-to-dziala.md
// =============================================================

import React from 'react';
import { Container } from 'react-bootstrap';

export default function JakToDzialaPage() {
  return (
    <section className="section py-5">
      <Container>
        <div className="text-center mb-5">
          <p className="title-sm text-orange">JAK TO DZIAŁA</p>
          <h1 className="main-title">Jak działa SiteSpector</h1>
          <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
            Od URL do profesjonalnego raportu w 3 minuty — krok po kroku.
          </p>
        </div>
        <div className="text-center py-5">
          <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: 800 }}>
            <p className="text-muted mb-3">Treść strony w przygotowaniu</p>
            <p className="text-muted small">
              Źródło treści: <code>landing/content/pages/jak-to-dziala.md</code>
            </p>
            <a href="/login" className="btn btn-primary mt-3">
              Wypróbuj teraz
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
