# Strona Porównanie — Brief

Dokument kreatywny dla agenta AI budującego odświeżoną stronę porównania SiteSpector z konkurencją. Tabela funkcji, ceny, sekcja „Dlaczego SiteSpector wygrywa”.

---

## Meta

- **title**: Porównanie narzędzi SEO — SiteSpector vs Screaming Frog vs Ahrefs vs SEMrush
- **description**: Porównaj SiteSpector z Screaming Frog, Ahrefs i SEMrush. Execution Plan, AI Overviews, Senuto, 3-fazowy audyt. Od $29/mc — wszystko w jednym narzędziu.
- **keywords**: porównanie SEO, SiteSpector vs Screaming Frog, SiteSpector vs Ahrefs, narzędzie audytu SEO, cena SEO

---

## Sekcja: Hero

**Headline:**
> SiteSpector vs **konkurencja**

**Subheadline:**
> Jedno narzędzie zamiast pięciu. Execution Plan z kodem, AI Overviews, integracja Senuto i 3-fazowy audyt — w cenie jednej licencji Screaming Frog.

**CTA Primary:** Wypróbuj za darmo → `/login`

---

## Sekcja: Tabela porównawcza

**Label:** PORÓWNANIE FUNKCJI

**Tytuł:** Co oferuje każda **platforma**

**Tabela (4 kolumny: SiteSpector, Screaming Frog, Ahrefs, SEMrush):**

| Funkcja | SiteSpector | Screaming Frog | Ahrefs | SEMrush |
|---------|:-----------:|:--------------:|:------:|:-------:|
| **Cena** | $29/mc (Pro) | ~259 GBP/rok | $129/mc | $139/mc |
| Crawling SEO | ✓ (SF engine) | ✓ | ✓ | ✓ |
| Core Web Vitals (Lighthouse) | ✓ desktop + mobile | ✗ | ✗ | ✗ |
| Widoczność (Senuto) | ✓ | ✗ | ✓ (własne) | ✓ (własne) |
| AI Overviews monitoring | ✓ (Senuto) | ✗ | ✗ | ✗ |
| **Execution Plan z kodem** | ✓ | ✗ | ✗ | ✗ |
| **3-fazowy audyt** (technika → AI → plan) | ✓ | ✗ | ✗ | ✗ |
| Analiza AI (treść, UX, bezpieczeństwo) | ✓ (Gemini) | ✗ | ✗ | ✗ |
| Zaplanowane audyty | ✓ | ✗ | ✓ | ✓ |
| Konkurenci w audycie | ✓ (3 w Pro) | ✗ | ✓ | ✓ |
| Raporty PDF | ✓ (9 sekcji, white-label) | ✓ (podstawowe) | ✓ | ✓ |
| Zespoły / Workspace | ✓ | ✗ | ✓ | ✓ |
| Dane w UE | ✓ | ✓ | ✗ (USA) | ✗ (USA) |
| Plan Free | ✓ (5 audytów) | trial | ✗ | trial |

**Design:** Tabela responsywna. Na mobile: horizontal scroll lub uproszczone kartowe porównanie. SiteSpector kolumna wyróżniona (np. border-orange, badge „Rekomendowany”).

---

## Sekcja: Porównanie cen

**Label:** CENY

**Tytuł:** Ile **naprawdę** płacisz?

**4 karty cenowe (uproszczone):**

1. **SiteSpector Pro** — $29/mc
   - 50 audytów, Senuto, 3 konkurentów, Execution Plan, harmonogramy, white-label PDF, API

2. **Screaming Frog** — ~259 GBP/rok (~$330)
   - Tylko crawling. Bez Lighthouse, Senuto, AI, Execution Plan. Desktop app.

3. **Ahrefs** — od $129/mc
   - Pełne narzędzie, ale bez Execution Plan i 3-fazowego audytu. Dane w USA.

4. **SEMrush** — od $139/mc
   - Pełne narzędzie, ale bez Execution Plan i AI Overviews z Senuto. Dane w USA.

**Copy pod tabelą:**
> Aby uzyskać funkcje SiteSpector (crawl + Lighthouse + Senuto + AI + Execution Plan), musiałbyś łączyć kilka narzędzi — łącznie ponad $300 miesięcznie.

---

## Sekcja: Dlaczego SiteSpector wygrywa (Why SiteSpector Wins)

**Label:** DLACZEGO SITESPECTOR

**Tytuł:** 5 powodów, dla których **wybierają nas**

**5 punktów (karty lub lista):**

1. **Execution Plan** — Jedyna platforma oferująca konkretne zadania z gotowym kodem. Nie „popraw meta tagi”, ale „oto kod do wklejenia”. Innowacja, której brakuje u konkurencji.
2. **AI Overviews** — Monitoring, czy Twoje słowa kluczowe pojawiają się w odpowiedziach AI Google. Integracja z Senuto — unikalna na rynku.
3. **3-fazowy audyt** — Technika (SF + LH + Senuto) → Analiza AI (treść, UX, bezpieczeństwo) → Execution Plan. Wszystko w jednym flow, 1–3 minuty.
4. **Jedna cena, wszystko w pakiecie** — $29/mc vs $300+ za zestaw narzędzi. Bez ukrytych kosztów.
5. **Dane w UE** — Supabase + Hetzner DE. RODO. Nie wysyłamy danych do USA.

---

## Sekcja: CTA

**Label:** PRZEKONAJ SIĘ SAM

**Headline:** Wypróbuj SiteSpector **za darmo**

**Copy:**
> 5 audytów miesięcznie, plan Free. Zobacz Execution Plan, AI Overviews i pełny 3-fazowy audyt na własnych stronach.

**CTA Primary:** Rozpocznij darmowy audyt → `/login`

**CTA Secondary:** Zobacz cennik → `/` (#cennik)

---

## Grafiki

| Sekcja        | Opis | Rozmiar |
|---------------|------|---------|
| Hero          | Ilustracja „waga” lub „porównanie” (4 logo) | 800x400 px |
| Tabela        | Brak — tabela HTML | — |
| Why wins      | Ikony per punkt (RiCodeBoxLine, RiRobotLine, itd.) | 48x48 px |

---

## Uwagi designu

- Tabela: `table-responsive`, `table-bordered`, nagłówki `bg-light`. Kolumna SiteSpector: `border-left` pomarańczowy lub badge.
- Mobile: rozważyć accordion „SiteSpector vs X” zamiast pełnej tabeli na małych ekranach.
- Checkmark: ✓ zielony, ✗ szary. Ikony React Icons opcjonalnie.
