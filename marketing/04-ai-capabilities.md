# SiteSpector — Możliwości AI: Co Robi Sztuczna Inteligencja, a Co Nie

> **Dla kogo:** Specjaliści SEO, potencjalni klienci pytający o AI, copywriterzy tworzący materiały o funkcjach AI.  
> **Po co:** Precyzyjny opis roli AI w platformie — bez przesady ani niedopowiedzenia. Transparentność buduje zaufanie.

---

## 1. Model AI i konfiguracja

**Model:** Google Gemini 3.0 Flash (`gemini-3-flash-preview`)

**Dlaczego Gemini Flash:**
- Obsługuje bardzo długie konteksty — potrzebne do analizy pełnych wyników audytu (dziesiątki MB danych)
- Multimodal — obsługuje obrazy i PDF w chacie
- Natywne API do embeddings (`gemini-embedding-001`) — jeden ekosystem
- SSE streaming — odpowiedzi w czasie rzeczywistym jak ChatGPT
- Najlepsza cena/jakość dla naszego zastosowania vs GPT-4 czy Claude

**Resilience:**
- 3 klucze API Gemini z automatycznym failover
- Circuit breaker przy błędach 429 (rate limiting)
- Graceful degradation — jeśli AI jest niedostępne, wyniki fazy technicznej są zapisywane, a AI uruchomi się później

---

## 2. Czego AI NIE robi (ważna klaryfikacja)

Zanim opiszemy co AI robi — kluczowe jest co AI **nie robi**, bo to odróżnia nas od narzędzi które "udają" że AI robi wszystko:

| Zadanie | Kto to robi | Dlaczego nie AI |
|---------|------------|-----------------|
| Crawl stron | Screaming Frog | Specjalizowany crawler z 20-letnim doświadczeniem |
| Pomiar wydajności | Google Lighthouse | Oficjalny standard Google, obiektywny pomiar |
| Pobieranie danych o widoczności | Senuto API | Baza danych polskich rankingów, backlinków, AI Overviews |
| Analiza backlinków | Senuto API | Ogromna baza danych linków, niemożliwa do odtworzenia przez AI |
| Generowanie raportów PDF | WeasyPrint + matplotlib | Deterministyczne, przewidywalne outputy |
| Obliczanie scoringu | Algorytm deterministyczny | Obiektywne, powtarzalne wyniki bez "halucynacji" |

**Filozofia:** AI jest mózgiem analitycznym — interpretuje i syntezuje dane zebrane przez specjalizowane narzędzia. Nie zastępuje narzędzi, bo byłoby gorsze od nich. **AI jest warstwą sensu na wierzchu warstwy danych.**

---

## 3. Co AI robi — szczegółowy opis

### 3.1 Analiza treści (Content Analysis)

**Wejście:** Tytuł, meta description, H1, liczba słów, obrazy z ALT, wyniki czytelności

**Co Gemini analizuje:**
- Jakość treści — czy tytuł i meta są atrakcyjne, unikalne, keyword-rich?
- Czytelność — ton, poziom zaawansowania, dostosowanie do grupy docelowej
- Kompletność — czy strona odpowiada na pytania użytkowników w tym temacie?
- Rekomendacje konkretnych zmian (z przykładami)
- ROI Action Plan — co zmienić żeby treść lepiej konwertowała

**Zwraca:** summary, tone_voice, content_score (0–100), roi_action_plan, konkretne rekomendacje

---

### 3.2 Analizy równoległe (Parallel AI Analysis)

Gemini uruchamia jednocześnie kilka analiz specjalistycznych:

#### Analiza wydajności
- Interpretacja wyników Lighthouse (CWV)
- Wyjaśnienie przyczyn problemów (np. "duży LCP często wynika z niezoptymalizowanych obrazów hero")
- Porównanie desktop vs mobile
- Powiązanie wydajności z rankingiem (Google Page Experience)

#### Analiza tech stack
- Wykrycie CMS (WordPress, Shopify, custom) na podstawie kodu strony
- Typowe problemy wydajnościowe dla wykrytego CMS
- Rekomendacje specyficzne dla platformy

#### Analiza UX
- Semantyka HTML (czy struktura jest zrozumiała dla crawlerów?)
- Dostępność (WCAG guidelines)
- Mobile usability
- Navigation i user flow

#### Analiza bezpieczeństwa
- Nagłówki bezpieczeństwa (HSTS, CSP, X-Frame-Options)
- HTTPS konfiguracja
- Potencjalne ryzyka z poziomu frontendu

#### Local SEO
- Wykrycie czy strona to lokalny biznes
- Ocena NAP (Name, Address, Phone) spójności
- Schema.org LocalBusiness — czy jest i czy jest poprawna
- Rekomendacje dla lokalnego SEO

#### Content Deep Dive
- Głębsza analiza struktury treści
- Identyfikacja tematycznych luk (content gaps)
- Sugestie nowych tematów / rozwinięć

---

### 3.3 Analiza strategiczna (9 kontekstów)

Po analizach równoległych Gemini robi **kontekstowe analizy per-area** — każda bierze dane z odpowiedniego modułu i zwraca strukturowane outputy:

#### SEO Context
- **Wejście:** dane Screaming Frog + Technical Extras + Schema.org
- **Output:** key_findings, recommendations, quick_wins, priority_issues, technical_story_for_client (wyjaśnienie dla klienta bez technikaliów), schema_recommendations, render_recommendations

#### Performance Context
- **Wejście:** Lighthouse desktop + mobile
- **Output:** recommendations, desktop_vs_mobile_comparison, priority_issues, quick_wins

#### Visibility Context
- **Wejście:** Senuto (pozycje, wzrosty, straty, sezonowość, competitors)
- **Output:** keyword_opportunities, competitor_gaps, seasonality_strategy, non_technical_summary (dla zarządu), next_steps_for_management, metrics_legend (słownik metryk)

#### AI Overviews Context
- **Wejście:** Senuto AI Overviews data
- **Output:** aio_opportunities (jak dostać się do AI Overviews), content_rewrite_targets (co przepisać pod AI)

#### Backlinks Context
- **Wejście:** Senuto backlinks (statystyki, anchory, referring domains)
- **Output:** toxic_risk_assessment, anchor_diversity_score, link_building_suggestions

#### Links Context (wewnętrzne)
- **Wejście:** Screaming Frog links data
- **Output:** orphan_pages (strony bez linków wewnętrznych), link_juice_distribution, silo_suggestions

#### Images Context
- **Wejście:** Screaming Frog images data
- **Output:** missing_alt_count, oversized_images, format_suggestions (WebP, AVIF)

#### Security Context
- **Wejście:** Lighthouse best practices + nagłówki
- **Output:** key_findings, recommendations, priority_issues

#### UX Context
- **Wejście:** Lighthouse accessibility + semantyka HTML
- **Output:** key_findings, recommendations, quick_wins, priority_issues

---

### 3.4 Analiza Cross-Tool (korelacje)

**To jest gdzie AI błyszczy:** Gemini łączy wyniki ze wszystkich modułów i szuka zależności, których żadne narzędzie osobno nie widzi.

**Przykładowe korelacje:**
- "Wolny TTFB + słaba widoczność organiczna → prawdopodobnie problem serwera wpływa na crawl budget Google"
- "Brak Schema.org + brak AI Overviews → powiązana szansa: dodanie Schema może zwiększyć widoczność w AI"
- "Dużo backlinków nofollow + słaba widoczność → profil linków jest słaby, nie zasili rankingów"
- "Wysoki CLS mobile + wysoki bounce rate → prawdopodobnie elementy skaczą i frustrują użytkowników"

**Output cross-tool:**
- `correlations` — lista powiązań między modułami
- `synergies` — działania które poprają wiele metryk jednocześnie
- `conflicts` — gdzie rekomendacje mogą być sprzeczne (np. lazy loading vs CWV)
- `unified_recommendations` — 5–10 najważniejszych działań

---

### 3.5 Roadmap (4 horyzonty)

Gemini generuje konkretny plan działania w czasie:

| Horyzont | Timeframe | Co zawiera |
|----------|-----------|-----------|
| **Natychmiastowe** | 1–7 dni | Quick wins, krytyczne błędy blokujące indeksowanie |
| **Krótkoterminowe** | 1–4 tygodnie | Optymalizacje SEO on-page, meta, Schema |
| **Średnioterminowe** | 1–3 miesiące | Content marketing, link building, performance |
| **Długoterminowe** | 3+ miesięcy | Strategia słów kluczowych, przebudowy, AI Overviews |

Roadmap jest spersonalizowany dla konkretnej strony — nie jest generycznym "rób content marketing".

---

### 3.6 Executive Summary

Raport dla zarządu generowany przez AI:

- **Overall health score** — ocena od 0 do 100 z wyjaśnieniem
- **Summary** — 3–5 zdań co jest dobrze, co jest źle
- **Strengths** — mocne strony strony (dosłownie)
- **Critical issues** — problemy które natychmiast wpływają na wyniki
- **Growth potential** — szansa na wzrost jeśli problemy zostaną naprawione
- **Estimated impact** — AI szacuje potencjalny wzrost widoczności po naprawie

Format: zrozumiały dla CEO który nie zna SEO.

---

### 3.7 Quick Wins

Agregat najlepszych natychmiastowych wygranych ze wszystkich 9 modułów:
- Maksymalnie 24 quick wins
- Każdy: tytuł, opis, moduł źródłowy, szacowany efekt
- Sortowane wg: wysoki impact + niski wysiłek
- Format: gotowy do wdrożenia "lista rzeczy do zrobienia"

---

### 3.8 Execution Plan — generowanie zadań z kodem

**To jest kluczowa innowacja SiteSpector.**

Gemini analizuje wyniki techniczne i AI i generuje **konkretne zadania implementacyjne**:

**Przykład zadania dla SEO:**
```
Tytuł: Popraw meta description strony głównej
Priorytet: HIGH
Impact: 8/10
Effort: EASY
Quick Win: TAK

Opis: Obecna meta description ma 95 znaków i nie zawiera głównego słowa kluczowego.
Google traktuje meta description jako signal CTR.

Fix: Zastąp obecną (wyświetloną poniżej) na:
"[sugerowany przykład 145-160 znaków z głównym keyword i CTA]"
```

**Przykład zadania dla Schema.org:**
```json
Tytuł: Dodaj Schema.org Organization
Priorytet: HIGH
Fix (gotowy kod do wdrożenia):
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Nazwa firmy]",
  "url": "[URL]",
  "logo": "[URL logo]",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "[telefon]",
    "contactType": "customer service"
  }
}
```

8 modułów generuje zadania: SEO, performance, visibility, AI Overviews, linki, obrazy, UX, security.

---

### 3.9 RAG Chat

**Retrieval Augmented Generation** — AI "wie" wszystko o konkretnym audycie:

**Jak działa:**
1. Po audycie wszystkie wyniki AI są "chunked" (podzielone na fragmenty)
2. Fragmenty są wektoryzowane (`gemini-embedding-001`) i zapisane w Qdrant
3. Gdy użytkownik zadaje pytanie, system pobiera top-12 najrelewantniejszych fragmentów
4. Gemini dostaje pytanie + kontekst i odpowiada

**Przykładowe pytania które można zadać:**
- "Dlaczego moja strona ma niski wynik wydajności na mobile?"
- "Które słowa kluczowe powinienem priorytetyzować w pierwszej kolejności?"
- "Jak dodać Schema.org do mojego WordPressa?"
- "Porównaj moje wyniki z konkurentem X"
- "Wyjaśnij co to jest CLS i jak to naprawić"
- "Jakie są 5 najważniejszych rzeczy do zrobienia w tym tygodniu?"

**Multimodal:** Można wrzucić screenshot, PDF, CSV do rozmowy — Gemini przeanalizuje w kontekście audytu.

**Follow-up:** Po każdej odpowiedzi AI sugeruje 3 kolejne pytania.

**Streaming:** Odpowiedzi wyświetlają się w czasie rzeczywistym (SSE), nie trzeba czekać.

---

## 4. GLOBAL_SNAPSHOT — spójność AI

**Problem:** Gdy AI analizuje 9 obszarów osobno, może dawać sprzeczne rekomendacje.

**Rozwiązanie — GLOBAL_SNAPSHOT:**
- Przed każdą analizą kontekstową Gemini dostaje "snapshot" kluczowych metryk z wszystkich narzędzi
- Pozwala to unikać sytuacji gdzie analiza SEO mówi jedno, a analiza visibility drugie
- Wszystkie analizy "wiedzą" o sobie nawzajem

To jest architektoniczne rozwiązanie zapewniające spójność wyników AI.

---

## 5. Jak mówić o AI (dla marketingu)

### Co mówić (precyzyjne, wiarygodne)
- "AI analizuje dane zebrane przez Screaming Frog, Lighthouse i Senuto — i wyciąga wnioski których żadne narzędzie osobno nie widzi"
- "Gemini generuje konkretne zadania z gotowym kodem do wdrożenia"
- "Chat AI odpowiada na pytania o twój audyt — nie ogólne pytania o SEO, ale o twoje konkretne wyniki"
- "AI koreluje dane z różnych narzędzi — jak wolny serwer wpływa na widoczność organiczną"

### Czego nie mówić (przesada, która podkopuje zaufanie)
- ❌ "AI zrobi za ciebie SEO" — nie, AI daje plan, human musi wdrożyć
- ❌ "AI crawluje twoją stronę" — nie, to robi Screaming Frog
- ❌ "AI zna pozycje twojej strony" — nie, to robi Senuto
- ❌ "AI zastąpi specjalistę SEO" — nie, to narzędzie które specjalistę wspiera

### Tone of voice dla AI
- Transparentny (mówimy co AI robi i czego nie robi)
- Konkretny (zadania z kodem, nie ogólne rekomendacje)
- Pomocny (AI tłumaczy co znaczą liczby, nie tylko je pokazuje)

---

*Aktualizacja: Marzec 2026*
