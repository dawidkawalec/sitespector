'use client';

import React, { useState } from 'react';
import { RiMailLine } from 'react-icons/ri';

export default function NewsletterClient() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // UI-only for now.
    setStatus('success');
    setEmail('');
  };

  return (
    <div className="bg-light rounded-4 border p-4 p-lg-5 shadow-sm text-center">
      <div className="title-sm">
        <span>BĄDŹ NA BIEŻĄCO</span>
      </div>
      <h3 className="text-primary fw-bold mt-2 mb-2">Subskrybuj newsletter</h3>
      <p className="text-muted mb-4">
        Otrzymuj najnowsze artykuły, porady i informacje o nowych funkcjach SiteSpector. Bez spamu — wysyłamy 1–2 wiadomości miesięcznie.
      </p>

      {status === 'success' && (
        <div className="alert alert-success" role="alert">
          Dzięki! Jeśli włączymy newsletter, damy Ci znać jako pierwszym.
        </div>
      )}

      <form onSubmit={submit} className="d-flex justify-content-center flex-column flex-sm-row gap-2">
        <div className="input-group" style={{ maxWidth: 520 }}>
          <span className="input-group-text bg-white">
            <RiMailLine className="text-orange" />
          </span>
          <input
            type="email"
            className="form-control"
            placeholder="Twój e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary px-4 fw-bold">
          Zapisz się
        </button>
      </form>
    </div>
  );
}

