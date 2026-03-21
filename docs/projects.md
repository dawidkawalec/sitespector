# SiteSpector — Projekty (Backlog)

> **Cel:** Lista zamkniętych projektów do realizacji. Każdy projekt to osobna sesja pracy — nie task, a pełny zakres.
> **Jak używać:** Iteruj, priorytetyzuj, rozpisuj szczegóły. Przy rozpoczęciu projektu przenieś do sekcji "W toku".

---

## Priorytetyzacja

| Priorytet | Projekty | Dlaczego |
|-----------|----------|----------|
| **P0 — Blokery launch** | ~~P1~~✅, ~~P2~~✅, ~~P3~~✅, ~~Stripe~~✅ | DONE — kredyty, cennik, paywall, Stripe live |
| **P1 — Pre-launch** | ~~P4~~✅, ~~P5~~✅, P9, ~~P10~~✅ | P4+P5+P10 done. P9 (pixel) jako ostatni pre-launch |
| **P2 — Post-launch** | P6, ~~P7~~✅, P8, ~~P11~~✅ | P7+P11 done. P6 (PQL) + P8 (pakiety) |
| **P3 — Skalowanie** | P12, P13 | Długoterminowy growth |

---

## BLOKER: Konfiguracja Stripe (Piotr)

**Konto Stripe musi założyć partner (Piotr).** Bez tego nie działają:
- Checkout (upgrade planów)
- Zakup pakietów kredytów
- Webhook (grant kredytów po płatności)

**Co trzeba zrobić:**
1. Założyć konto Stripe (lub aktywować istniejące)
2. Stworzyć 10 produktów/cen (skrypt gotowy — uruchomić po uzyskaniu klucza):
   - 3 subskrypcje × 2 okresy = 6 cen (Solo/Agency/Enterprise × monthly/annual)
   - 4 pakiety kredytów (Starter $4.99, Standard $12.99, Pro $34.99, Agency $89.99)
3. Wpisać klucze do .env na VPS:
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
   - 6 price ID subskrypcji + 4 price ID pakietów
4. Skonfigurować webhook w Stripe Dashboard: URL `https://sitespector.app/api/billing/webhook`
5. Restart backend: `docker compose -f docker-compose.prod.yml restart backend worker`

**Status:** Czeka na Piotra

---

## Ukończone

### P1: System Kredytowy ✅ (2026-03-18)
Commit: b9b1d4d + 37600ec. Tabele credit_balances + credit_transactions, credit_service.py, wiring do audits/chat/billing/worker.

### P2: Nowy Cennik Stripe ✅ (2026-03-18)
Commit: 8414221. 5 planów, dynamic pricing, purchase-credits, /plans API, landing pricing.

### P3: Blurowanie Raportów Free ✅ (2026-03-18)
Commit: 9d75efd. PaywallOverlay, usePlanGate, blur w AnalysisView/TaskListView/PDF.

### P4: Aktualizacja Landing Page ✅ (2026-03-18)
Commit: 0233cfd. Usunięto fake testimoniale/stats/telefon/dev notes. Prawdziwe ceny na /cennik, /dla-freelancerow, /dla-agencji-seo. Integracje zamiast testimoniali.

### P5: Statyczne Demo ✅ (2026-03-18)
Commit: 22dd9d2. /demo route w frontend (public), mock audit overview (156 stron, score 72), sidebar z zakładkami, CTA.

### P7: Branding & White-Label PDF ✅ (2026-03-18)
Commit: b9bebe5. Nowy router /api/branding (4 endpointy), Supabase Storage bucket branding-logos, /settings/branding UI. Agency: logo na PDF. Enterprise: full white-label (nazwa, kontakt, kolory). PDF templates dynamiczne (cover, base, quick_wins, roadmap, keywords).

### Dodatkowe: Audit Techniczny Dashboardu ✅ (2026-03-18)
Commit: d7393b4. 13 poprawek UX: puste stany, brakujące dane schema/links/quick-wins, usunięte dev remnants (Przelicz/Wygeneruj), opisy Content Quality grades, nowa zakładka Linki Zewnętrzne.

### Dodatkowe: Aktualizacja Dokumentacji Marketingowej ✅ (2026-03-18)
12 plików marketing/*.md zaktualizowanych pod nowe businessdocs: cennik (3 plany → 4+Custom), segmenty (5→7), Meta Ads jako primary paid channel, PQL model, nowy sales process.

### Dodatkowe: Nav fix + Client Report rozbudowa ✅ (2026-03-18)
Commit: 3a7e168. UserMenu dropdown sync (Automatyzacja + Branding), Breadcrumbs fix, Client Report z 3→11 sekcji (CWV, Widoczność, Techniczne, CQI, Roadmap, Executive Summary), branding logo, cross-linki PDF↔Client Report.

### P10: Blog — 23 artykuły + cover images ✅ (2026-03-19)
Commit: ab56b35 + 646804b. 23 artykuły SEO przepisane z placeholderów (~50k słów), 23 AI-generated cover images (Gemini, teal+orange brandbook). 5 batchy: filary, poradniki, produkt, edukacja, niszowe.

### P11: Strona /porownanie ✅ (2026-03-19)
Commit: 56c05ae. Pełna strona porównawcza: 6 narzędzi × 14 kryteriów, ceny 2026, 5 wyróżników, 4 scenariusze per persona, FAQ (6 pytań), CTA. Usunięte wszystkie "wkrótce".

### Stripe Setup ✅ (2026-03-20)
Stripe LIVE skonfigurowany: 3 produkty subskrypcyjne (Solo/Agency/Enterprise) × 2 ceny (monthly+annual) = 6 price IDs. 4 pakiety kredytów (Starter/Standard/Pro/Agency). Webhook na sitespector.app/api/billing/webhook. Klucze + price IDs w .env na VPS.

---

## W toku

*(przenieś tu projekt gdy zaczynasz pracę)*

---

## Backlog

### P6: PQL Scoring & Automatyzacja Email (Backend) — ŚREDNI

**Zakres:** Product-Qualified Lead scoring i automatyczne sekwencje emailowe.

**Co obejmuje:**
- PQL scoring: Level 1 (≥2 audyty + PDF) → Level 2 (≥3 audyty + chat) → Level 3 (≥2 members + ≥5 audytów)
- Email sequences: onboarding (dzień 0/2/14), upgrade nudge, reactivation
- Integracja z CRM (Twenty CRM?)
- Dashboard admin: lista PQL z scoringiem

**Status:** Backlog

---

### P8: Pakiety Kredytów Ad-hoc (Frontend + Backend) — ŚREDNI

**Zakres:** Dokupywanie kredytów poza subskrypcją.

**Co obejmuje:**
- Stripe: 4 produkty one-time (Starter $4.99, Standard $12.99, Pro $34.99, Agency $89.99)
- UI: "Kup kredyty" button w dashboardzie + modal z wyborem paczki
- Backend: webhook Stripe → dodanie kredytów do salda
- Gating: zablokowane w Free (wymaga upgrade do Solo)

**Zależności:** Wymaga Stripe setup (BLOKER).

**Status:** Backlog

---

### P9: Meta Ads Pixel & Tracking (Landing + Frontend) — WYSOKI

**Zakres:** Konfiguracja Meta Pixel do kampanii płatnych.

**Co obejmuje:**
- Instalacja Meta Pixel na landing i app
- Eventy: PageView, CompleteRegistration, StartAudit, ViewResults, Upgrade
- Custom conversions: signup, first_audit, upgrade
- Przygotowanie pod Lookalike audiences

**Status:** Backlog

---

### P12: Referral / Affiliate Program (Backend + Frontend) — NISKI

**Zakres:** Program poleceń: 20% prowizji lub miesiące gratis.

**Co obejmuje:**
- System referral kodów / linków
- Dashboard partnera: ile osób poleciło, ile zarobiło
- Automatyczne naliczanie prowizji / kredytów
- Landing page /partnerzy

**Status:** Backlog

---

### P13: Platforma Rozszerzeń — Roadmapa (Docs) — NISKI

**Zakres:** Zaprojektowanie modelu płatnych wtyczek/upselli (wzorem Senuto).

**Co obejmuje:**
- PRD modułu Content Optimization (pierwszy plugin)
- Architektura pluginów: jak wpinają się w audyt, jak rozliczane (kredyty vs osobna sub)
- UI: marketplace rozszerzeń
- Faza 3 (2027+)

**Status:** Backlog

---

*Utworzono: 2026-03-18 | Źródło: businessdocs-marczec-2026*
