# SiteSpector — Projekty (Backlog)

> **Cel:** Lista zamkniętych projektów do realizacji. Każdy projekt to osobna sesja pracy — nie task, a pełny zakres.
> **Jak używać:** Iteruj, priorytetyzuj, rozpisuj szczegóły. Przy rozpoczęciu projektu przenieś do sekcji "W toku".

---

## Priorytetyzacja

| Priorytet | Projekty | Dlaczego |
|-----------|----------|----------|
| **P0 — Blokery launch** | P1, P2, P3 | Bez nich nie da się uruchomić nowego cennika |
| **P1 — Pre-launch** | P4, P9, P10 | Potrzebne przed kampaniami Meta Ads |
| **P2 — Post-launch** | P5, P6, P7, P8 | Wzmacniają konwersję i retention |
| **P3 — Skalowanie** | P11, P12, P13 | Długoterminowy growth |

---

## W toku

*(przenieś tu projekt gdy zaczynasz pracę)*

---

## Backlog

### P1: System Kredytowy (Backend + Frontend) — KRYTYCZNY

**Zakres:** Implementacja kompletnego systemu kredytów jako uniwersalnej waluty platformy.

**Co obejmuje:**
- Tabela `credits` w DB (balance, transactions, plan_id)
- Zużycie per akcja: audyt=30kr (20 tech + 10 AI), chat=1kr, competitor=3kr
- Limity per plan (Free: 50 jednorazowo, Solo: 100/msc, Agency: 400/msc, Enterprise: 2000/msc)
- Free: blokada dokupywania kredytów
- UI: widget salda kredytów, historia transakcji
- Alembic migracja + seedowanie istniejących userów

**Zależności:** Musi być przed P2 i P3.

**Status:** Backlog

---

### P2: Nowy Cennik Stripe (Backend + Frontend) — KRYTYCZNY

**Zakres:** Przebudowa z 3 planów na 5 + pakiety kredytów + annual billing.

**Co obejmuje:**
- Stripe Dashboard: 4 plany × 2 okresy (monthly/annual) + 4 pakiety kredytów (one-time)
- Backend: mapowanie plan → credit_limit, webhook obsługa pakietów
- Frontend /pricing: nowa strona cennika (4 karty + toggle monthly/annual + decoy effect na Agency)
- Frontend /settings/billing: nowy billing UI z upgradem/downgradem
- Gating: Solo/Agency/Enterprise features (harmonogramy, branding, white-label)
- Migracja istniejących Free/Pro/Enterprise userów na nowe plany

**Zależności:** P1 musi być gotowy.

**Status:** Backlog

---

### P3: Blurowanie Raportów Free (Frontend) — KRYTYCZNY

**Zakres:** Implementacja paywalla w Free tier — raport 80% zblurowany jako natural FOMO trigger.

**Co obejmuje:**
- Frontend: komponent blurowania (CSS blur + overlay z CTA "Odblokuj pełny raport")
- Logika: które sekcje widoczne (20%), które zblurowane (80%)
- CTA do upgrade na stronie wyników audytu
- Zblurowany Execution Plan (widać tytuły zadań, nie widać detali/kodu)

**Aha moment:** Częściowe dane tech + AI Chat + zblurowany Execution Plan.

**Status:** Backlog

---

### P4: Aktualizacja Landing Page (Frontend Landing) — WYSOKI

**Zakres:** Aktualizacja strony www pod nowe ustalenia biznesowe.

**Co obejmuje:**
- Hero: nowe plany i ceny ($9.99/$29.99/$99)
- Sekcja cennik: 4 karty z toggle annual/monthly
- Usunięcie placeholderów: telefon (+48 123 456 789), testimoniale, statystyki (200K, 98%, 1M)
- Ujednolicenie email: wybrać support@sitespector.app LUB kontakt@sitespector.pl
- Nowe sekcje segmentowe: Software House, Agencja marketingowa
- Aktualizacja /dla-freelancerow, /dla-agencji-seo pod nowe ceny
- Usunięcie "Nasze algorytmy analizują" → konkretne narzędzia (SF, Lighthouse, Senuto, Gemini)

**Zależności:** P2 (cennik Stripe) powinien być gotowy.

**Status:** Backlog

---

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
