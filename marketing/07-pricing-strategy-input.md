# SiteSpector — Dane do Strategii Cenowej

> **Dla kogo:** Founder, strategia biznesowa, osoba finalizująca cennik.  
> **Po co:** Zebranie wszystkich faktów cenowych, kosztowych i rynkowych — jako input do decyzji o finalnym cenniku.  
> **Status:** Cennik w trybie placeholder (Marzec 2026) — decyzje cenowe OCZEKUJĄ na finalizację.

---

## 1. Obecna struktura planów (zaimplementowana w kodzie)

### Plany i limity (HARDCODED w kodzie)

| Plan | Audyty/msc | Chat/msc | Cena (docelowa) | Status UI |
|------|-----------|---------|-----------------|-----------|
| **Free** | 5 | 100 | $0 | Aktywny |
| **Pro** | 50 | 500 | $29/msc | Placeholder ("wkrótce") |
| **Enterprise** | Unlimited (999 999) | Unlimited | $99/msc | Placeholder ("wkrótce") |

### Co zawiera każdy plan (wg kodu i dokumentacji)

**Free:**
- 5 audytów miesięcznie
- 100 wiadomości chat/msc
- Podstawowy audyt (faza 1 + 2 + 3)
- Workspace osobisty
- Raporty PDF
- [DO UZUPEŁNIENIA: jakie limity funkcji vs Pro?]

**Pro:**
- 50 audytów miesięcznie
- 500 wiadomości chat/msc
- Wszystkie funkcje audytu
- Harmonogramy automatyczne
- Analiza konkurentów (do 3)
- Team workspace (role: owner, admin, member)
- White-label PDF [DO WERYFIKACJI]
- API [DO WERYFIKACJI status]

**Enterprise:**
- Unlimited audytów
- Unlimited chat
- Dedykowane wsparcie
- SLA
- [DO UZUPEŁNIENIA: wszystkie enterprise features]

---

## 2. Infrastruktura cenowa (Stripe)

**Stripe integration: GOTOWA do uruchomienia**
- `STRIPE_PRICE_ID_PRO` — ID ceny Pro w Stripe (do skonfigurowania)
- `STRIPE_PRICE_ID_ENTERPRISE` — ID ceny Enterprise w Stripe (do skonfigurowania)
- Checkout flow, webhook, Customer Portal — zaimplementowane
- Billing UI — w trybie placeholder, gotowe do aktywacji

**Jak włączyć cennik:**
1. Skonfigurować STRIPE_PRICE_ID_PRO i STRIPE_PRICE_ID_ENTERPRISE w Stripe Dashboard
2. Ustawić klucze w `.env` na VPS
3. Zmienić billing UI z trybu placeholder na aktywny checkout

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

### Break-even analysis (szacunkowa)

Przy założeniu $29/msc Pro i koszcie ~$0.20/audyt:
- 50 audytów Pro × $0.20 = $10 kosztów zmiennych
- + $2.50 przypadające koszty stałe na subskrybenta
- **Marża brutto: ~$29 - $12.50 = $16.50 (~57%)**

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
| **SiteSpector Pro** | $29/msc | — | $99/msc |

**Kluczowa obserwacja:** SiteSpector Pro ($29) jest porównywalny ceną z Mangools — ale zastępuje SF + Lighthouse + Senuto + AI. To silny argument wartości.

---

## 5. Modele cenowe do rozważenia

### Model A: Obecny — Per-workspace (rekomendowany)
- Free: 5/msc, Pro: $29/50/msc, Enterprise: $99/unlimited
- **Za:** Prosty, przewidywalny, nie penalizuje za dodawanie użytkowników
- **Przeciw:** Limit audytów może być za restrykcyjny dla większych agencji

### Model B: Per-audit (usage-based)
- Pay-as-you-go: $X za audyt
- **Za:** Idealne dla okazjonalnych użytkowników, zero ryzyka po stronie klienta
- **Przeciw:** Nieprzewidywalne przychody, trudna retencja, brak "sticky" efektu

### Model C: Per-seat + workspace
- $X/użytkownik/msc + workspace fee
- **Za:** Skaluje z rozmiarem agencji
- **Przeciw:** Penalizuje agencje za wzrost, skomplikowane wyceny

### Model D: Tiered by features (nie audyty)
- Wszystkie plany mają unlimited audytów, ale różne funkcje (PDF, AI, konkurenci)
- **Za:** Usuwa główną obiekcję "za mało audytów"
- **Przeciw:** Trudniej kontrolować koszty operacyjne (Senuto API, Gemini)

### Model E: Annual vs Monthly
- Roczna subskrypcja z rabatem 20–30%
- **Za:** Cash flow, retencja, commitment
- **Przeciw:** Bariera wejścia dla nowych klientów

**Rekomendacja do przemyślenia:** Model A (obecny) + opcja roczna z 20% rabatem + "Agencja pack" (wyższy limit audytów bez full Enterprise).

---

## 6. Potencjalne dodatkowe źródła przychodów

| Źródło | Opis | Trudność |
|--------|------|---------|
| **Add-on: dodatkowe audyty** | +10 audytów/msc za $X | Łatwy |
| **Add-on: white-label** | Własne logo na PDF | Łatwy |
| **Add-on: priorytetowe wsparcie** | SLA, dedykowany opiekun | Średni |
| **Agencja pack** | Workspace per klient w jednym pakiecie | Średni |
| **API access** | Dostęp do API dla developerów | Trudny |
| **Custom integrations** | Integracja z CRM, Slack, etc. | Trudny |
| **White-label platform** | Platforma pod marką agencji | Bardzo trudny |

---

## 7. Psychologia cenowa — obserwacje

### Anchoring
- Enterprise ($99) sprawia że Pro ($29) wygląda tanio
- "5 narzędzi za cenę jednego" — porównanie do sumy osobnych subskrypcji

### Free tier strategy
- 5 audytów/msc to wystarczająco żeby zobaczyć wartość (1-2 strony)
- Za mało dla freelancera z 10 klientami → naturalna presja do upgrade
- Pytanie: czy Free powinno mieć AI Overviews? Execution Plan?

### Annual commitment
- $29 × 12 = $348/rok → roczna za $250–280 = oszczędność widoczna
- Dla agencji roczna umowa = budżet zapisany w planie finansowym

### Trial vs Freemium
- Obecny model: Freemium (Free tier zawsze dostępny)
- Alternatywa: 14-dniowy trial Pro bez karty kredytowej → presja konwersji
- [DO DECYZJI: czy zostawiamy Freemium czy dodajemy trial?]

---

## 8. Obiekcje cenowe i odpowiedzi

### "Za drogo"
> "Pro za $29 zastępuje: Screaming Frog (17 GBP/msc), Senuto (~300 PLN/msc), ChatGPT ($20/msc). Oszczędzasz 400–600 PLN miesięcznie i masz wszystko w jednym miejscu."

### "Nie wiem czy tego potrzebuję"
> "Zacznij za darmo — 5 audytów miesięcznie, bez karty kredytowej. Zrób audyt swojej strony i jednej strony konkurenta. Jeśli znajdziesz 3 rzeczy do poprawy, narzędzie już się zwróciło."

### "Mamy już Ahrefs/SEMrush"
> "SiteSpector robi inną rzecz — kompleksowy audyt techniczny z Execution Plan. Ahrefs jest świetny do backlinków i słów kluczowych; SiteSpector mówi ci co zrobić żeby strona technicznie i contentowo była gotowa na TOP3. Wiele agencji używa obu."

### "Cennik nie jest dostępny"
> "Masz rację, finalizujemy szczegóły oferty. Napisz do nas — przygotujemy indywidualną propozycję."

---

## 9. Rekomendacje do finalizacji cennika

**Do ustalenia:**
1. Finalne ceny PLN vs USD (czy lokalizujemy?)
2. Limity funcji per plan (co Free, co Pro, co Enterprise?)
3. White-label: od którego planu?
4. API: od którego planu?
5. "Agencja pack" — czy warto?
6. Roczna subskrypcja z rabatem — tak/nie?
7. Trial 14 dni Pro — tak/nie?

**Do weryfikacji:**
- Rzeczywiste koszty Senuto API (per zapytanie)
- Rzeczywiste koszty Gemini API (per audyt i per wiadomość chat)
- Break-even przy różnych wolumenach

---

*Aktualizacja: Marzec 2026 | Status: cennik w trybie placeholder*
