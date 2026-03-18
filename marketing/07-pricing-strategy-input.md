# SiteSpector — Dane do Strategii Cenowej

> **Dla kogo:** Founder, strategia biznesowa, osoba finalizująca cennik.
> **Po co:** Zebranie wszystkich faktów cenowych, kosztowych i rynkowych — jako input do decyzji o finalnym cenniku.
> **Status:** Model kredytowy sfinalizowany (Marzec 2026) — implementacja w kodzie i Stripe w toku.

---

## 1. Finalna struktura planów (model kredytowy v1.2)

### Plany i limity

| Plan | Cena/msc | Roczna | Kredyty/msc | Equiv. audytów | Status |
|------|----------|--------|-------------|----------------|--------|
| **Free** | $0 | — | 50 (jednorazowo, start) | 1 audyt demo + 20 chat | Do implementacji |
| **Solo** | $9.99 | $7.99 (20% rabat) | 100 | ~3 audyty | Do implementacji |
| **Agency** | $29.99 | $23.99 (20% rabat) | 400 | ~13 audytów | Do implementacji |
| **Enterprise** | $99 | $79 (20% rabat) | 2 000 | ~66 audytów | Do implementacji |
| **Custom** | Kontakt | Kontakt | Indywidualnie | API, integracje CRM | Faza 3 (2027+) |

### System kredytów — uniwersalna waluta

| Akcja | Koszt kredytów | Szacunkowy koszt rzeczywisty |
|-------|---------------|------------------------------|
| 1 pełny audyt SEO | 30 (20 tech + 10 AI) | ~$0.15–0.30 |
| 1 wiadomość Chat AI | 1 | ~$0.002–0.005 |
| 1 audyt konkurenta | 3 | ~$0.05 |
| Raporty PDF | 0 (wliczone) | — |

### Pakiety dokupywania kredytów (od planu Solo)

| Paczka | Kredyty | Cena | Cena/kredyt | Equiv. audytów |
|--------|---------|------|------------|----------------|
| Starter | 50 | $4.99 | $0.10 | ~1.5 |
| Standard | 150 | $12.99 | $0.087 | 5 |
| Pro | 500 | $34.99 | $0.070 | ~16 |
| Agency | 1 500 | $89.99 | $0.060 | 50 |

**WAŻNE:** W planie Free NIE można dokupować kredytów — wymaga upgrade do Solo.

### Co zawiera każdy plan

**Free:**
- 50 kredytów na start (jednorazowo, bez odnawiania)
- 1 audyt demo z 80% raportu zblurowanym (paywall)
- AI Chat (do wyczerpania kredytów)
- Workspace osobisty
- Brak harmonogramów, brak dokupywania kredytów

**Solo ($9.99/msc):**
- 100 kredytów/msc (~3 pełne audyty)
- Pełne raporty (bez blurowania)
- 1 harmonogram automatyczny
- Możliwość dokupywania kredytów
- Team workspace (role: owner, admin, member)

**Agency ($29.99/msc):**
- 400 kredytów/msc (~13 audytów) — 4x za 3x cenę (decoy effect)
- Branding raportów PDF (logo klienta)
- 5 harmonogramów automatycznych
- Analiza konkurentów (do 3)
- Wiele workspace'ów

**Enterprise ($99/msc):**
- 2 000 kredytów/msc (~66 audytów)
- White-label PDF (pełne brandowanie)
- Unlimited harmonogramy
- Dedykowane wsparcie + SLA
- Sprzedaż self-serve (PLG)

**Custom (kontakt handlowy):**
- Dostęp API
- Integracje CRM
- Indywidualny SLA
- Dedykowany onboarding

---

## 2. Infrastruktura cenowa (Stripe)

**Stripe integration: GOTOWA do uruchomienia**
- Potrzebne 4 price ID w Stripe: Solo, Agency, Enterprise (monthly + annual)
- Custom: bez Stripe, kontakt handlowy
- Checkout flow, webhook, Customer Portal — zaimplementowane
- Billing UI — w trybie placeholder, gotowe do aktywacji
- Pakiety kredytów: osobne produkty one-time w Stripe

**Jak włączyć cennik:**
1. Stworzyć produkty i price ID w Stripe Dashboard (4 plany × 2 billing periods + 4 pakiety kredytów)
2. Ustawić klucze w `.env` na VPS
3. Zmienić billing UI z trybu placeholder na aktywny checkout
4. Zaimplementować system kredytów w backendzie (tabela credits, zużycie per akcja)
5. Zaimplementować blurowanie raportów w Free

---

## 3. Koszty operacyjne (estymacja)

> Uwaga: To są szacunkowe dane — weryfikuj z rzeczywistymi rachunkami.

### Infrastruktura stała (miesięczna)

| Koszt | Szacunek | Uwagi |
|-------|---------|-------|
| Hetzner VPS CPX42 | ~50–80 EUR/msc | 8 vCPU, 16GB RAM |
| Supabase | 0–25 USD/msc | Free tier lub Pro |
| Screaming Frog licencja | ~16 GBP/msc | 199 GBP/rok / 12 |
| Domena + SSL | ~2–5 USD/msc | Let's Encrypt free SSL |
| **Łącznie stałe** | ~70–120 EUR/msc | |

### Koszty zmienne (per audyt)

| Koszt | Szacunek | Uwagi |
|-------|---------|-------|
| Senuto API | [DO UZUPEŁNIENIA PLN/zapytanie] | ~20 endpointów per audyt |
| Gemini API (analiza) | ~$0.05–0.20/audyt | Zależy od rozmiaru strony |
| Gemini API (embeddings) | ~$0.01–0.03/audyt | RAG indexing |
| Gemini API (chat) | ~$0.002/wiadomość | Free: 100, Pro: 500 |
| Lighthouse (CPU) | koszt serwera | Brak opłaty per API |
| **Łącznie zmienne** | ~$0.10–0.30/audyt | Szacunek |

### Break-even analysis (per plan, nowy model kredytowy)

**Solo ($9.99/msc, ~3 audyty):**
- 3 audyty × $0.20 + 70 chat × $0.003 = $0.81 kosztów zmiennych
- + ~$2.50 koszty stałe na subskrybenta
- **Marża brutto: ~$9.99 - $3.31 = $6.68 (~67%)**

**Agency ($29.99/msc, ~13 audytów):**
- 13 audytów × $0.20 + 270 chat × $0.003 = $3.41 kosztów zmiennych
- + ~$2.50 koszty stałe na subskrybenta
- **Marża brutto: ~$29.99 - $5.91 = $24.08 (~80%)**

**Enterprise ($99/msc, ~66 audytów):**
- 66 audytów × $0.20 + 1680 chat × $0.003 = $18.24 kosztów zmiennych
- + ~$2.50 koszty stałe na subskrybenta
- **Marża brutto: ~$99 - $20.74 = $78.26 (~79%)**

Marże 67–80% — zdrowe dla SaaS. Agency to "sweet spot" (decoy effect działa).

[DO WERYFIKACJI z rzeczywistymi rachunkami Senuto API i Gemini API]

---

## 4. Benchmarki cenowe konkurencji

| Narzędzie | Najtańszy plan | Główny plan | Enterprise |
|-----------|---------------|------------|-----------|
| **Ahrefs** | $99/msc (Lite) | $199/msc (Standard) | Custom |
| **SEMrush** | $129/msc (Pro) | $249/msc (Guru) | Custom |
| **SE Ranking** | $44/msc | $87/msc | Custom |
| **Surfer SEO** | $89/msc | $219/msc | Custom |
| **Mangools** | $29/msc | $44/msc | $89/msc |
| **Screaming Frog** | 199 GBP/rok (~17 GBP/msc) | — | — |
| **Senuto** | ~299 PLN/msc | ~599 PLN/msc | Custom |
| **SiteSpector Solo** | $9.99/msc | $29.99/msc (Agency) | $99/msc |

**Kluczowa obserwacja:** SiteSpector Solo ($9.99) jest najtańszy na rynku. Agency ($29.99) jest porównywalny z Mangools — ale zastępuje SF + Lighthouse + Senuto + AI. Brak opłat per-seat to najważniejszy differentiator vs Ahrefs/SEMrush.

---

## 5. Wybrany model cenowy — Hybrid: Subskrypcja + Kredyty

**DECYZJA (Marzec 2026):** Model hybrydowy — subskrypcja z limitem kredytów + dokupywanie ad-hoc.

### Dlaczego ten model
- **Subskrypcja** = przewidywalny MRR, sticky
- **Kredyty** = elastyczność, usage-based element, natural upsell
- **Brak per-seat** = najważniejszy differentiator (agencje nie karane za wzrost)
- **Annual 20% rabat** = cash flow + retention
- **Decoy effect:** Agency ($29.99) to "best value" — 4x kredytów za 3x cenę Solo

### Price jumps (psychologia)
- Solo → Agency: 3x cena, 4x kredytów
- Agency → Enterprise: 3.3x cena, 5x kredytów
- Każdy kolejny plan daje lepszą wartość per kredyt

---

## 6. Źródła przychodów

| Źródło | Opis | Status | Faza |
|--------|------|--------|------|
| **Subskrypcja MRR** | 4 plany (Solo/Agency/Enterprise/Custom) | Główne (90%+) | 1 |
| **Pakiety kredytów** | Dokupywanie ad-hoc od planu Solo | Upsell | 1 |
| **Branding PDF** | Logo klienta na raportach (od Agency) | Wliczone | 1 |
| **White-label PDF** | Pełne brandowanie (od Enterprise) | Wliczone | 1 |
| **API access** | Integracja z CRM/własnymi systemami (Custom) | Kontakt | 3 |
| **Platforma rozszerzeń** | Płatne upselle/wtyczki (np. Content Optimization) | Planowane | 3 |
| **Affiliate/referral** | 20% prowizji za poleconych klientów | Planowane | 2 |

---

## 7. Psychologia cenowa — decyzje

### Anchoring
- Enterprise ($99) sprawia że Agency ($29.99) wygląda tanio
- "5 narzędzi za cenę jednego" — porównanie do sumy osobnych subskrypcji (~580–700 zł)

### Decoy effect (kluczowe)
- Agency ($29.99) = "best value" — 4x kredytów za 3x cenę Solo
- Większość agencji i freelancerów powinna wybierać Agency

### Free tier strategy (DECYZJA: Freemium z blurowanym raportem)
- 50 kredytów na start (starcza na 1 audyt + 20 chat)
- Raport 80% zblurowany = naturalny paywall (buduje FOMO)
- W Free NIE MOŻNA dokupować kredytów → wymaga upgrade do Solo
- **Aha moment:** Zobaczenie częściowych danych tech + AI Chat + zblurowany Execution Plan
- **Trigger do upgrade:** Chęć odblurowania raportu + wyczerpanie 50 kredytów

### Annual commitment
- 20% rabat na roczną: Solo $7.99, Agency $23.99, Enterprise $79
- Dla agencji roczna umowa = budżet zapisany w planie finansowym

### Statyczne Demo (planowane)
- "Wydmuszka" bez logowania — pokazuje przykładowy raport
- Agencje mogą ocenić jakość przed założeniem konta

---

## 8. Obiekcje cenowe i odpowiedzi

### "Za drogo"
> "Agency za $29.99 zastępuje: Screaming Frog (17 GBP/msc), Senuto (~300 PLN/msc), ChatGPT ($20/msc). Oszczędzasz 400–600 PLN miesięcznie i masz wszystko w jednym miejscu. A jeśli potrzebujesz mniej — Solo za $9.99."

### "Nie wiem czy tego potrzebuję"
> "Zacznij za darmo — bez karty kredytowej. Zrób darmowy audyt swojej strony. Zobaczysz częściowe wyniki i możesz porozmawiać z AI o nich. Jeśli znajdziesz wartość — odblokujesz pełny raport od $9.99/msc."

### "Mamy już Ahrefs/SEMrush"
> "SiteSpector robi inną rzecz — kompleksowy audyt techniczny z Execution Plan z kodem. Ahrefs jest świetny do backlinków i słów kluczowych; SiteSpector mówi ci co zrobić żeby strona technicznie i contentowo była gotowa na TOP3. Wiele agencji używa obu."

### "5 audytów mi nie wystarczy" (stara obiekcja — nieaktualna)
> Model zmieniony na kredytowy. Free = 1 audyt demo. Solo = ~3/msc. Agency = ~13/msc. Dokupywanie kredytów ad-hoc od Solo.

---

## 9. Decyzje podjęte i do implementacji

**PODJĘTE (Marzec 2026):**
1. ✅ Ceny w USD (globalnie)
2. ✅ 4 plany + Custom: Free / Solo $9.99 / Agency $29.99 / Enterprise $99
3. ✅ White-label: Enterprise (branding: Agency)
4. ✅ API: wyłącznie Custom (kontakt handlowy)
5. ✅ Roczna subskrypcja: 20% rabat
6. ✅ Model: Freemium z blurowanym raportem (nie trial)
7. ✅ Brak per-seat — per-workspace
8. ✅ System kredytów jako uniwersalna waluta
9. ✅ Free bez dokupywania — upgrade wymagany

**DO IMPLEMENTACJI (w kodzie):**
- System kredytów (tabela, zużycie per akcja, limity per plan)
- Blurowanie raportów w Free (80%)
- Stripe: 4 plany × 2 okresy + 4 pakiety kredytów
- UI: nowa strona cennika (4 plany + toggle annual/monthly)
- Gating: dokupywanie kredytów zablokowane w Free

**DO WERYFIKACJI:**
- Rzeczywiste koszty Senuto API (per zapytanie)
- Rzeczywiste koszty Gemini API (per audyt i per wiadomość chat)

---

*Aktualizacja: Marzec 2026 | Status: model kredytowy sfinalizowany, implementacja w toku*
