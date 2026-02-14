# Strona Dla e-commerce — Brief

Dokument kreatywny dla agenta AI. Strona kierowana do właścicieli sklepów online. Focus: typowe problemy SEO e-commerce, co SiteSpector sprawdza, Core Web Vitals, Senuto, AI Overviews, Execution Plan.

---

## Meta

- **title**: Audyt SEO dla sklepów internetowych | SiteSpector
- **description**: Audyt SEO Twojego sklepu w 3 minuty. Wolne strony produktowe, brakujące meta, duplikaty, CLS z bannerów — SiteSpector to sprawdza. Dane z Senuto, Execution Plan z kodem.
- **keywords**: audyt SEO e-commerce, SEO sklep internetowy, optymalizacja sklepu, Core Web Vitals sklep, audyt sklepu online

---

## Struktura strony

Layout: sekcje `<section className="section">`. Ton: praktyczny, konkretny. Hero z mocnym CTA (3 minuty). Sekcje: problemy → co sprawdzamy → CWV → Senuto → AI Overviews → konkurenci → weryfikacja agencji → Execution Plan → CTA.

---

## Sekcja 1: Hero

**Headline:**
> Audyt SEO Twojego sklepu w **3 minuty**

**Subheadline:**
> Wolne strony produktowe, brakujące meta tagi, duplikaty, obrazy bez ALT — SiteSpector sprawdza wszystko. Otrzymuj konkretny plan naprawy z gotowym kodem. Dane widoczności z Senuto. Bez skomplikowanych narzędzi.

**CTA Primary:** Audytuj mój sklep za darmo → `/login`

**CTA Secondary:** Zobacz co sprawdzamy → `#co-sprawdzamy`

**Grafika:** Screenshot dashboardu z audytem sklepu e-commerce — widoczne strony produktowe w tabeli SEO, meta tagi, kolumny status. Albo: ilustracja sklepu (ikony produktów, koszyk) + „3 min” badge. Kolory: #0b363d, #ff8945.

---

## Sekcja 2: Typowe problemy SEO e-commerce

**Label:** ZNAJOMY PROBLEM?

**Tytuł:** Typowe problemy SEO sklepów online

**Opis:**
> Sklepy mają specyficzne wyzwania: setki stron produktowych, kategorie, filtry, dynamiczne treści. Oto, co najczęściej psuje widoczność.

**6 kart problemów (ikona + tytuł + opis):**

1. **Wolne strony produktowe**
   > Obrazy bez optymalizacji, ciężkie skrypty. LCP powyżej 4 sekund — Google obniża pozycje, użytkownicy odchodzą.

2. **Brakujące meta na kategoriach**
   > Kategorie mają domyślne tytuły „Kategoria” albo duplikaty. Setki stron z identycznymi meta — kanibalizacja i marnowany potencjał.

3. **Zduplikowane tytuły**
   > Produkty w wielu wariantach (rozmiar, kolor) — ta sama strona, ten sam tytuł. Google nie wie, którą indeksować.

4. **Obrazy bez ALT**
   > Galerie produktowe bez opisów alternatywnych. Brak wsparcia dla accessibility i dla Google Images.

5. **CLS z bannerów i reklam**
   > Banery ładują się asynchronicznie — strony „skaczą”. Cumulative Layout Shift psuje UX i Core Web Vitals.

6. **Kanibalizacja słów kluczowych**
   > Kilka kategorii lub produktów konkuruje o tę samą frazę. Wzajemnie się osłabiają w rankingu.

**Design:** Grid 2x3 lub 3x2. Ikony RiErrorWarningLine lub podobne. Tło `bg-light`.

---

## Sekcja 3: Co SiteSpector sprawdza

**Label:** CO SPRAWDZAMY

**Tytuł:** Pełny audyt — technika, wydajność, widoczność, AI

**Opis:**
> SiteSpector łączy Screaming Frog, Lighthouse, Senuto i Google Gemini. Jedno narzędzie zamiast pięciu. Wyniki pogrupowane w logiczne moduły.

**4 bloki (narzędzie + co sprawdza):**

1. **Screaming Frog — struktura i SEO**
   - Meta tagi na wszystkich stronach (produkty, kategorie, landing pages)
   - Nagłówki H1, hierarchia
   - Linki wewnętrzne, broken links
   - Obrazy — ALT, rozmiary
   - Duplikaty tytułów i opisów
   - Redirecty, canonical

2. **Lighthouse — wydajność**
   - Core Web Vitals desktop + mobile
   - LCP, INP, CLS
   - Performance Score
   - Diagnostyka: co blokuje renderowanie, co opóźnia LCP

3. **Senuto — widoczność**
   - Pozycje słów kluczowych (produkty, kategorie)
   - Trendy — czy frazy rosną czy spadają
   - Kanibalizacja — które strony konkurują
   - Backlinki — skąd linki do sklepu

4. **Gemini AI — rekomendacje + Execution Plan**
   - Analiza treści (thin content na produktach)
   - UX (nawigacja, filtry)
   - Bezpieczeństwo
   - Konkretny plan zadań z gotowym kodem

**Grafika:** Screenshot dashboardu z zakładkami — SEO, Performance, Visibility — zawartość widoczna. Lub: 4 ikony (SF, LH, Senuto, AI) z krótkimi opisami.

---

## Sekcja 4: Core Web Vitals a konwersje

**Label:** WYDAJNOŚĆ = KONWERSJE

**Tytuł:** Core Web Vitals wpływają na sprzedaż

**Opis:**
> Wolna strona to mniej konwersji. Google pokazuje dane: strony z dobrymi Core Web Vitals mają wyższy CTR i lepsze pozycje. SiteSpector mierzy LCP, INP i CLS na desktopie i mobile — dokładnie te metryki, które liczy Google.

**Statystyki (cytować z badań Google / branży):**
- Strony z LCP poniżej 2,5 s mają o 25% wyższe zaangażowanie
- Wzrost CLS o 0.1 może obniżyć konwersje o kilka procent
- Mobile-first — Google indeksuje głównie wersję mobilną

**CTA:** Sprawdź swoje Core Web Vitals → `/login`

**Grafika:** Wykres lub infografika — „LCP < 2,5 s = lepsze wyniki”. Prostota, kolory primary/orange.

---

## Sekcja 5: Monitoruj widoczność z Senuto

**Label:** WIDOCZNOŚĆ

**Tytuł:** Czy Twoje produkty i kategorie są widoczne w Google?

**Opis:**
> Senuto pokazuje pozycje dla słów kluczowych z Twojego rynku. Widzisz, które produkty i kategorie rankują, które tracą, które zyskują. Dane z Polski (lub wybranego kraju) — realny obraz Twojej widoczności.

**Co zobaczysz:**
- Ranking słów kluczowych (nazwy produktów, kategorie, frazy długiego ogona)
- Trendy — wzrost/spadek w czasie
- Wins i losses — które frazy zyskały, które straciły
- Kanibalizacja — strony konkurujące o tę samą frazę

**Grafika:** Screenshot zakładki Visibility — tabela z produktami/kategoriami, pozycjami, strzałkami. Dane przykładowe (np. „sukienka czerwona” – pozycja 12, trend ↑).

---

## Sekcja 6: AI Overviews — czy Twój sklep jest w AI?

**Label:** AI OVERVIEWS

**Tytuł:** Czy Google AI pokazuje Twój sklep w odpowiedziach?

**Opis:**
> AI Overviews to nowa rzeczywistość wyszukiwania. Gdy użytkownik pyta „jaki odkurzacz do sierści psa”, Google może wyświetlić odpowiedź AI z rekomendacjami. SiteSpector monitoruje, czy Twoje słowa kluczowe generują AI Overviews i czy Twoja strona się w nich pojawia.

**Dlaczego to ważne:**
- Coraz więcej zapytań ma odpowiedzi AI
- Brak w AI Overviews = stracone szanse na ruch
- Senuto + SiteSpector — jedyna platforma audytowa z tym modułem

**Grafika:** Mockup odpowiedzi AI Google z podświetleniem „Twoja strona może się tu pojawić” lub podobna ilustracja.

---

## Sekcja 7: Porównaj się z konkurencją

**Label:** KONKURENCJA

**Tytuł:** Benchmark z innymi sklepami

**Opis:**
> Dodaj do audytu do 3 konkurentów (plan Pro). SiteSpector porówna Twoją stronę z ich stronami — meta tagi, wydajność, widoczność. Wiesz, gdzie jesteś słabszy i co poprawić w pierwszej kolejności.

**Co porównujesz:**
- Meta tagi — czy konkurenci mają lepsze opisy?
- Core Web Vitals — kto ma szybsze strony?
- Visibility — kto rankuje wyżej na kluczowych frazach?
- AI Overviews — czy konkurenci pojawiają się w AI, a Ty nie?

**Grafika:** Screenshot widoku Competitors — tabela porównawcza (np. 4 kolumny: Ty vs Konkurent 1, 2, 3). Metryki w wierszach.

---

## Sekcja 8: Zweryfikuj agencję SEO

**Label:** PŁACISZ ZA SEO?

**Tytuł:** Sprawdź, czy agencja naprawdę pracuje

**Opis:**
> Płacisz agencji za SEO, a wyniki stoją w miejscu? Uruchom audyt SiteSpector i porównaj z raportem agencji. execution Plan z konkretnymi zadaniami i kodem pozwala zapytać: „Dlaczego tego nie zrobiliście?”

**CTA:** Sprawdź agencję → `/sprawdz-agencje-seo`

**Design:** Karta lub banner. Link do dedykowanej strony. Ikona RiShieldCheckLine.

---

## Sekcja 9: Execution Plan — konkretne zadania dla Twojego sklepu

**Label:** EXECUTION PLAN

**Tytuł:** Nie „popraw meta” — ale gotowy kod do wklejenia

**Opis:**
> AI generuje konkretne zadania. Zamiast „dodaj meta description na stronach produktowych” — „Oto gotowy meta description dla /produkt/sukienka-czerwona”. Zamiast „optymalizuj obrazy” — „Użyj tego formatu WebP i tych wymiarów”. Możesz przekazać zadania developerowi lub agencji — mają gotowy kod.

**Przykłady zadań dla e-commerce:**
- Meta title i description dla konkretnej strony produktowej
- Schema.org Product do wstrzyknięcia
- Optymalizacja obrazu (rozmiar, format, lazy load)
- Poprawka CLS — konkretna zmiana CSS dla bannera

**CTA:** Zobacz Execution Plan → `/login`

**Grafika:** Screenshot Execution Plan z zadaniami typowymi dla sklepu (meta product, schema, obraz).

---

## Sekcja 10: CTA końcowa

**Tytuł:** Audytuj swój sklep za darmo

**Opis:**
> Plan Free: 5 audytów miesięcznie. Wystarczy, żeby sprawdzić główne strony sklepu. Bez karty kredytowej. Wyniki w 1–3 minuty.

**CTA:** Rozpocznij darmowy audyt → `/login`

**Link:** Jak to działa? → `/jak-to-dziala`

**Link:** Pełna lista funkcji → `/funkcje`
