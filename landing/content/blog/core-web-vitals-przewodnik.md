---
title: "Core Web Vitals – co to jest i dlaczego Google je mierzy"
date: "2026-03-18"
excerpt: "LCP, CLS, INP – trzy metryki, które decydują o pozycji Twojej strony w Google. Poznaj aktualne progi, statystyki i konkretne techniki optymalizacji na 2026 rok."
author: "Zespół SiteSpector"
slug: "core-web-vitals-przewodnik"
category: "Wydajność (Core Web Vitals)"
reading_time: 10
cover_image:
  src: "/images/blog/core-web-vitals-przewodnik.png"
  alt: "Core Web Vitals - przewodnik po metrykach LCP, CLS, INP"
  placeholder: "PLACEHOLDER: Okładka CWV (LCP/CLS/INP) — 1200x630px"
---

## Czym są Core Web Vitals i dlaczego musisz je znać?

Core Web Vitals (CWV) to zestaw trzech metryk wydajności, które Google traktuje jako oficjalny sygnał rankingowy od czerwca 2021 roku. Nie chodzi tu o kolejny techniczny żargon — to konkretne liczby, które mówią Google, czy Twoja strona zapewnia użytkownikom dobre doświadczenie.

Trzy metryki to:

- **LCP (Largest Contentful Paint)** — szybkość ładowania
- **INP (Interaction to Next Paint)** — responsywność na interakcje
- **CLS (Cumulative Layout Shift)** — stabilność wizualna

Dane z HTTP Archive za 2025 rok nie pozostawiają złudzeń: tylko **48% stron mobilnych** i **56% stron desktopowych** przechodzi ocenę Core Web Vitals. Ponad połowa mobilnego internetu nie spełnia wymagań Google. Jeśli Twoja strona jest w tej lepszej połowie — masz przewagę. Jeśli nie — tracisz pozycje.

## Aktualne progi CWV na 2026 rok

Google stosuje trzy przedziały oceny: Good (dobry), Needs Improvement (wymaga poprawy) i Poor (słaby). Żeby zaliczyć test, **co najmniej 75% wizyt** na Twojej stronie musi mieścić się w progu „Good".

| Metryka | Good (dobry) | Needs Improvement | Poor (słaby) |
|---------|-------------|-------------------|--------------|
| **LCP** | ≤ 2,5 s | 2,5 – 4,0 s | > 4,0 s |
| **INP** | ≤ 200 ms | 200 – 500 ms | > 500 ms |
| **CLS** | ≤ 0,1 | 0,1 – 0,25 | > 0,25 |

Te progi nie zmieniły się od ich wprowadzenia i Google na razie nie zapowiada ich zaostrzenia. Ale uwaga — to, że próg LCP wynosi 2,5 sekundy, nie znaczy, że powinieneś się na nim zatrzymać. Strony ładujące się w 1,2 s wygrywają z tymi ładującymi się w 2,4 s, nawet jeśli obie technicznie „przechodzą" test.

## Jak CWV wpływają na pozycje w Google?

Bądźmy szczerzy: Core Web Vitals nie zastąpią dobrego contentu. Jeśli Twoja treść nie odpowiada na zapytanie użytkownika, nawet idealne wyniki CWV Cię nie uratują. Ale w praktyce sytuacja wygląda tak: w konkurencyjnych niszach, gdzie kilka stron ma podobnej jakości treść i porównywalny profil linków, **CWV działają jako czynnik rozstrzygający** (tie-breaker).

Różnica między pozycją 3 a 8 to przepaść w CTR — pozycja 3 generuje około 10% kliknięć, pozycja 8 niecałe 3%. Przy 10 000 wyszukiwań miesięcznie to różnica 700 wizyt. Przez rok — 8 400 potencjalnych klientów, których tracisz, bo Twoja strona ładuje się o sekundę dłużej.

Google od 2023 roku stosuje mobile-first indexing — to mobilna wersja Twojej strony jest indeksowana i oceniana. Dlatego mobilne CWV mają większe znaczenie niż desktopowe. A statystyki pokazują, że właśnie na mobile wyniki są gorsze: 48% vs 56% na desktopie.

Badania branżowe konsekwentnie pokazują, że nawet milisekundowe poprawy wydajności przekładają się na mierzalny wzrost zaangażowania i przychodów. Walmart odnotował 2% wzrost konwersji za każdą sekundę poprawy czasu ładowania. Pinterest skrócił czas oczekiwania o 40% i zanotował 15% wzrost rejestracji. To nie są teoretyczne rozważania — to twarde liczby z raportów finansowych.

Jeśli chcesz poznać pełny obraz kondycji technicznej swojej strony, zacznij od [kompleksowego audytu SEO](/blog/jak-przeprowadzic-audyt-seo) — Core Web Vitals to ważny element, ale nie jedyny.

## LCP — Largest Contentful Paint (szybkość ładowania)

LCP mierzy czas, po którym największy widoczny element na stronie (najczęściej hero image, nagłówek lub blok tekstu) zostaje w pełni wyrenderowany. Próg to **2,5 sekundy**, ale w praktyce powinieneś celować w 1,5–2,0 s.

Według Web Almanac 2025 tylko **62% stron mobilnych** osiąga dobry LCP. To najgorsza z trzech metryk — i główny powód, dla którego strony nie przechodzą całościowej oceny CWV.

### Co najczęściej psuje LCP?

1. **Wolny TTFB (Time to First Byte)** — serwer odpowiada za późno. Dobrze skonfigurowany cache potrafi obniżyć TTFB z 2 sekund do poniżej 100 ms.
2. **Ciężkie, niezoptymalizowane obrazy** — hero image w formacie PNG o wadze 3 MB to gwarantowany problem.
3. **Render-blocking JavaScript i CSS** — przeglądarka nie może wyświetlić strony, dopóki nie pobierze i nie przetworzy blokujących zasobów.
4. **Brak CDN** — użytkownik w Gdańsku pobiera zasoby z serwera w USA zamiast z węzła w Warszawie.

### Jak poprawić LCP?

- **Konwertuj obrazy do WebP/AVIF** — oszczędność 30–50% rozmiaru pliku przy tej samej jakości. Sprawdź nasz przewodnik po [optymalizacji obrazów dla SEO](/blog/optymalizacja-obrazow-seo).
- **Użyj `fetchpriority="high"` na elemencie LCP** — powiedz przeglądarce, że ten zasób jest najważniejszy.
- **Dodaj `<link rel="preload">` dla kluczowych zasobów** — fonty, hero image, krytyczny CSS.
- **Wdróż CDN** — Cloudflare (darmowy plan wystarczy dla większości stron) zmniejsza latencję o setki milisekund.
- **Zastosuj lazy loading — ale nie na elemencie LCP** — obrazy poniżej foldu ładuj leniwie, ale hero image musi się załadować natychmiast.
- **Zminimalizuj łańcuchy requestów** — jeśli CSS importuje font, który importuje kolejny plik, masz kaskadę opóźnień.

## INP — Interaction to Next Paint (responsywność)

INP zastąpił metrykę FID (First Input Delay) w marcu 2024 roku. O ile FID mierzył tylko opóźnienie *pierwszej* interakcji, INP ocenia responsywność **wszystkich interakcji** podczas całej wizyty — kliknięć, dotknięć, naciśnięć klawiszy.

Próg to **200 ms**. Użytkownik klika przycisk i w ciągu 200 milisekund powinien zobaczyć wizualną odpowiedź. Brzmi łatwo? Statystyki mówią co innego: **43% stron wciąż nie zalicza progu INP**. Co ciekawe, wśród 1000 najpopularniejszych stron na świecie tylko 53% przechodzi ten test — bo duże serwisy mają więcej JavaScriptu, więcej skryptów third-party i bardziej złożony DOM.

### Co najczęściej psuje INP?

1. **Long tasks na main thread** — każde zadanie JS trwające ponad 50 ms blokuje główny wątek przeglądarki.
2. **Ciężkie event handlery** — kliknięcie przycisku uruchamia rozbudowaną logikę, manipulację DOM lub synchroniczne obliczenia.
3. **Za dużo skryptów third-party** — każdy chat widget, analytics tracker i popup marketingowy dodaje JavaScript do przetworzenia.
4. **Duży, złożony DOM** — im więcej elementów w drzewie DOM, tym wolniejsze renderowanie po interakcji.

### Jak poprawić INP?

- **Rozbij long tasks** — podziel zadania JS dłuższe niż 50 ms na mniejsze fragmenty. Użyj `scheduler.yield()` lub `setTimeout` do oddawania kontroli przeglądarce.
- **Odrocz niekrytyczny JS** — skrypty, które nie są potrzebne przy pierwszej interakcji, załaduj z atrybutem `defer` lub dynamicznie.
- **Ogranicz third-party scripts** — każdy dodany skrypt to potencjalne ms na main thread. Czy naprawdę potrzebujesz pięciu różnych trackerów?
- **Minifikuj i tree-shake** — usuń nieużywany kod. Mniejszy bundle = szybsze przetwarzanie.
- **Użyj Web Workers** — przenieś ciężkie obliczenia poza main thread.
- **Debounce i throttle** — nie odpowiadaj na każdy event scroll czy mousemove.
- **Virtualizing** — jeśli renderujesz długie listy (np. katalog produktów), użyj wirtualizacji (react-window, TanStack Virtual), żeby renderować tylko widoczne elementy.

## CLS — Cumulative Layout Shift (stabilność wizualna)

CLS mierzy, jak bardzo elementy strony „przeskakują" podczas ładowania. Znasz ten moment, gdy chcesz kliknąć link, a nagle pojawia się reklama i klikasz coś innego? To właśnie wysoki CLS.

Próg to **0,1**. Dobra wiadomość: **81% stron mobilnych** przechodzi ten test, więc CLS to najłatwiejsza metryka do opanowania. Ale to nie znaczy, że możesz ją ignorować — bo gdy CLS jest zły, użytkownicy to *czują* natychmiast.

Obrazy odpowiadają za około **60% problemów z CLS**. To najczęstszy winowajca.

### Jak poprawić CLS?

- **Zawsze podawaj width i height obrazów** — pozwól przeglądarce zarezerwować miejsce jeszcze przed załadowaniem.
- **Używaj `aspect-ratio` w CSS** — nowoczesny sposób na kontrolę proporcji elementów.
- **Rezerwuj miejsce na reklamy** — dynamicznie wstawiane bannery to jeden z najczęstszych powodów przeskoków layoutu. Zdefiniuj stały rozmiar kontenera.
- **Kontroluj ładowanie fontów** — użyj `font-display: swap` i `size-adjust`/`ascent-override` żeby fallback font miał zbliżone wymiary do docelowego.
- **Preloaduj krytyczne fonty** — `<link rel="preload" as="font">` eliminuje migotanie tekstu.
- **Nie wstawiaj treści nad istniejący content** — dynamicznie dodawane banery, powiadomienia czy CTA na górze strony przesuwają wszystko w dół.
- **Użyj CSS Containment** — `contain: layout size` na kontenerach mówi przeglądarce, że zmiany wewnątrz nie wpłyną na layout zewnętrznych elementów.

## Jak mierzyć Core Web Vitals?

Masz dwa rodzaje danych:

**Dane laboratoryjne (Lab data)** — symulowane testy w kontrolowanych warunkach. Narzędzia: Lighthouse, PageSpeed Insights, WebPageTest. Dają powtarzalne wyniki i pomagają diagnozować problemy. Nie odzwierciedlają doświadczenia realnych użytkowników.

**Dane polowe (Field data)** — dane od prawdziwych użytkowników zbierane przez Chrome UX Report (CrUX). To te dane Google używa do oceny rankingowej. Żeby je zobaczyć, Twoja strona musi mieć wystarczający ruch (minimum ok. 1000 odwiedzin z Chrome w ciągu 28 dni).

Popularne narzędzia do pomiaru CWV:

| Narzędzie | Typ danych | Koszt | Uwagi |
|-----------|-----------|-------|-------|
| PageSpeed Insights | Lab + Field | Bezpłatne | Najszybszy sposób na sprawdzenie pojedynczego URL-a |
| Google Search Console | Field | Bezpłatne | Raport CWV dla całej witryny |
| Lighthouse (Chrome DevTools) | Lab | Bezpłatne | Wbudowane w przeglądarkę, szczegółowa diagnostyka |
| SiteSpector | Lab | Free tier | Automatyczne testy Lighthouse dla wielu stron |
| web-vitals (biblioteka JS) | Field | Bezpłatne | Do monitorowania RUM na własnej stronie |
| DebugBear | Lab + Field | Płatne | Ciągły monitoring z alertami |

Najskuteczniejsze podejście? Używaj danych laboratoryjnych do diagnozowania i naprawiania problemów, a danych polowych do monitorowania efektów.

### Mierz CWV automatycznie w SiteSpector

SiteSpector przeprowadza pełne testy Lighthouse dla każdej audytowanej strony — zarówno w wersji desktopowej, jak i mobilnej. Dostajesz wyniki LCP, INP i CLS wraz z konkretnymi wskazówkami do poprawy. Nie musisz ręcznie testować każdego URL-a — system robi to automatycznie i pokazuje, które strony wymagają natychmiastowej uwagi.

**[Sprawdź Core Web Vitals swojej strony w SiteSpector →](https://sitespector.app)**

## Co się zmienia w CWV w 2026 roku?

Google nie stoi w miejscu. Oto najważniejsze zmiany i trendy, które warto śledzić w 2026 roku:

1. **INP dojrzał** — po zastąpieniu FID w marcu 2024, INP stał się stabilną metryką. Narzędzia i frameworki coraz lepiej wspierają jego optymalizację, ale wciąż 43% stron go nie zalicza.

2. **LCP pozostaje najtrudniejszy** — z zaledwie 62% stron mobilnych w progu „Good", LCP to wąskie gardło CWV. Google sugeruje skupienie się na optymalizacji TTFB i priorytetyzacji zasobów.

3. **Mobile-first to standard** — Google indeksuje mobilną wersję Twojej strony. Jeśli optymalizujesz tylko desktop, robisz to źle.

4. **Engagement Reliability (ER)** — nowy sygnał, który Google zaczął testować w 2025 roku. Mierzy, jak konsekwentnie użytkownicy mogą wchodzić w interakcje z Twoją stroną — czy przyciski działają, czy formularze się wysyłają, czy elementy interaktywne reagują niezawodnie na różnych urządzeniach.

Więcej o nadchodzących zmianach przeczytasz w naszym artykule o [zmianach w Core Web Vitals w 2026 roku](/blog/core-web-vitals-2026).

## Podsumowanie — od czego zacząć?

Nie musisz poprawiać wszystkiego naraz. Oto priorytetyzacja:

1. **Zmierz aktualny stan** — uruchom test w SiteSpector lub PageSpeed Insights. Poznaj swoje liczby.
2. **Zacznij od LCP** — to najczęstsza przyczyna niepowodzenia CWV. Optymalizacja obrazów i TTFB da najszybsze efekty.
3. **Sprawdź INP** — jeśli masz dużo JavaScriptu (SPA, React, dynamiczne elementy), INP będzie Twoim wyzwaniem.
4. **Dopracuj CLS** — zwykle najłatwiejszy do naprawienia. Dodaj wymiary obrazów, zarezerwuj miejsce na reklamy.
5. **Monitoruj regularnie** — CWV to nie jednorazowa poprawka. Nowy deploy, dodany skrypt third-party czy zmiana layoutu mogą zepsuć wyniki z dnia na dzień.

Pamiętaj: poprawa Core Web Vitals to nie jednorazowy projekt, a ciągły proces. Każda zmiana na stronie — nowy feature, aktualizacja CMS, dodany widget — może wpłynąć na wyniki. Dlatego regularne monitorowanie jest tak samo ważne jak początkowa optymalizacja.

Core Web Vitals to nie abstrakcyjne metryki — to realne pieniądze. Szybsza strona = wyższe pozycje = więcej ruchu = więcej konwersji. W 2026 roku ignorowanie CWV to ignorowanie darmowego ruchu organicznego.

**[Zrób audyt Core Web Vitals w SiteSpector — za darmo →](https://sitespector.app)**
