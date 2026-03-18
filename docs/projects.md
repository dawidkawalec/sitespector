# SiteSpector — Projekty (Backlog)

> **Cel:** Lista zamkniętych projektów do realizacji. Każdy projekt to osobna sesja pracy — nie task, a pełny zakres.
> **Jak używać:** Iteruj, priorytetyzuj, rozpisuj szczegóły. Przy rozpoczęciu projektu przenieś do sekcji "W toku".

---

## Priorytetyzacja

| Priorytet | Projekty | Dlaczego |
|-----------|----------|----------|
| **P0 — Blokery launch** | ~~P1~~✅, ~~P2~~✅, ~~P3~~✅ | DONE — kredyty, cennik, paywall |
| **BLOKER** | Stripe setup (Piotr) | Założyć konto, stworzyć produkty, wpisać klucze |
| **P1 — Pre-launch** | ~~P4~~✅, P9, P10 | P4 done. P9 (pixel) + P10 (blog) przed Meta Ads |
| **P2 — Post-launch** | P5, P6, P7, P8 | Wzmacniają konwersję i retention |
| **P3 — Skalowanie** | P11, P12, P13 | Długoterminowy growth |

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

---

## W toku

*(przenieś tu projekt gdy zaczynasz pracę)*

---

## Backlog

### P5: Statyczne Demo (Frontend) — ŚREDNI

**Zakres:** "Wydmuszka" bez logowania — pokazuje przykładowy raport audytu.

**Co obejmuje:**
- Strona /demo z przykładowym audytem (prerendered, bez API)
- Nawigacja po zakładkach jak w prawdziwym audycie
- Blurowane sekcje z CTA "Zacznij za darmo"
- Link z landing page i cold outreach

**Status:** Backlog

---

### P6: PQL Scoring & Automatyzacja Email (Backend) — ŚREDNI

**Zakres:** Product-Qualified Lead scoring i automatyczne sekwencje emailowe.

**Co obejmuje:**
- PQL scoring: Level 1 (≥2 audyty + PDF) → Level 2 (≥3 audyty + chat) → Level 3 (≥2 members + ≥5 audytów)
- Email sequences: onboarding (dzień 0/2/14), upgrade nudge, reactivation
- Integracja z CRM (Twenty CRM?)
- Dashboard admin: lista PQL z scoringiem

**Status:** Backlog

---

### P7: Branding & White-Label PDF (Frontend + Backend) — ŚREDNI

**Zakres:** Branding raportów od Agency, full white-label od Enterprise.

**Co obejmuje:**
- Agency: upload logo klienta, logo na raportach PDF
- Enterprise: pełne brandowanie (kolory, logo, nazwa firmy, usunięcie "SiteSpector")
- UI: /settings/branding z uploadem logo i wyborem kolorów
- Backend: template PDF z dynamicznym brandingiem

**Status:** Backlog

---

### P8: Pakiety Kredytów Ad-hoc (Frontend + Backend) — ŚREDNI

**Zakres:** Dokupywanie kredytów poza subskrypcją.

**Co obejmuje:**
- Stripe: 4 produkty one-time (Starter $4.99, Standard $12.99, Pro $34.99, Agency $89.99)
- UI: "Kup kredyty" button w dashboardzie + modal z wyborem paczki
- Backend: webhook Stripe → dodanie kredytów do salda
- Gating: zablokowane w Free (wymaga upgrade do Solo)

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

### P10: Blog — Pierwsze Artykuły (Landing) — WYSOKI

**Zakres:** Uruchomienie bloga z pierwszymi 4-6 artykułami SEO.

**Co obejmuje:**
- CMS / MDX setup w landing (jeśli nie ma)
- 4-6 artykułów: "Audyt SEO — kompletny przewodnik", "Screaming Frog alternatywa", "Core Web Vitals 2026", "AI Overviews — co to?"
- SEO optimization: meta, schema, internal linking
- Newsletter signup form

**Status:** Backlog

---

### P11: Strona /porownanie (Landing) — ŚREDNI

**Zakres:** Strona porównawcza SiteSpector vs konkurencja.

**Co obejmuje:**
- Feature matrix: SiteSpector vs Ahrefs vs SEMrush vs SE Ranking vs Mangools vs Screaming Frog
- Cennik porównawczy
- "Dlaczego SiteSpector" sekcja
- SEO: target "Screaming Frog alternatywa", "Ahrefs zamiennik"

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

## Ukończone

*(przenieś tu projekt gdy zakończysz)*

---

*Utworzono: 2026-03-18 | Źródło: businessdocs-marczec-2026*
