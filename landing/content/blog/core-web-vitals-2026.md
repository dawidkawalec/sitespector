---
title: "Core Web Vitals w 2026: co się zmieniło i jak to poprawić"
date: "2026-03-18"
excerpt: "INP zamiast FID, zaostrzone progi, Engagement Reliability — Google zmienił zasady gry. Sprawdź co się zmieniło w CWV w 2025–2026 i jak dostosować swoją stronę."
author: "Zespół SiteSpector"
slug: "core-web-vitals-2026"
category: "Wydajność (Core Web Vitals)"
tags: ["core-web-vitals", "lighthouse", "wydajnosc", "google", "inp", "lcp", "cls"]
reading_time: 11
cover_image:
  src: "/images/blog/core-web-vitals-2026.png"
  alt: "Core Web Vitals 2026 - metryki LCP, CLS, INP"
  placeholder: "PLACEHOLDER: Ilustracja metryk Core Web Vitals z ikonami LCP, CLS, INP — 1200x630px"
---

## Core Web Vitals w 2026 — dlaczego wciąż tracisz na nich pozycje

Jeśli myślisz, że Core Web Vitals to temat z 2021 roku, który można zignorować — masz problem. Google w ciągu ostatnich dwóch lat poważnie podkręcił wagę metryk wydajności. Po grudniowej aktualizacji algorytmu w 2025 strony z LCP powyżej 3 sekund traciły średnio 23% więcej ruchu niż szybsi konkurenci z porównywalną jakością treści. Strony z INP powyżej 300 ms odczuły spadki pozycji szczególnie na mobile.

A statystyki są bezlitosne: według danych HTTP Archive za 2025 rok tylko **48% stron mobilnych** przechodzi ocenę Core Web Vitals. Ponad połowa mobilnego internetu nie spełnia wymagań Google. To oznacza jedno — jeśli zoptymalizujesz swoje CWV, od razu wyprzedzisz większość konkurencji.

W tym artykule pokażę Ci dokładnie, co się zmieniło w metrykach CWV w okresie 2024–2026, jakie są aktualne progi i co konkretnie zrobić, żeby Twoja strona je spełniała. Jeśli szukasz podstawowego wprowadzenia do tematu, przeczytaj najpierw nasz [przewodnik po Core Web Vitals](/blog/core-web-vitals-przewodnik).

## Największe zmiany w CWV: 2024–2026

Ostatnie dwa lata przyniosły cztery kluczowe zmiany, które wpływają na to, jak Google ocenia wydajność Twojej strony.

### 1. INP oficjalnie zastąpił FID (marzec 2024)

To największa zmiana od momentu wprowadzenia CWV. W marcu 2024 Google oficjalnie wycofał metrykę First Input Delay (FID) i zastąpił ją metryką **Interaction to Next Paint (INP)**.

Dlaczego to ważne? FID mierzył tylko opóźnienie *pierwszej* interakcji użytkownika na stronie — jednego kliknięcia, jednego dotknięcia. INP jest znacznie bardziej wymagający: mierzy responsywność **wszystkich interakcji** podczas całej wizyty i raportuje najgorszą z nich. Jeśli Twoja strona reaguje szybko na pierwsze kliknięcie, ale zamiera przy trzecim — FID tego nie łapał. INP łapie.

INP obejmuje pełny cykl życia interakcji: opóźnienie wejściowe (input delay), czas przetwarzania (processing time) i opóźnienie prezentacji (presentation delay). To kompleksowa miara, która ujawnia problemy ukryte przed FID.

### 2. Zaostrzenie oczekiwań wobec progów

Oficjalne progi CWV nie zmieniły się drastycznie, ale Google wyraźnie sygnalizuje, że samo „przejście" progu to za mało. Aktualizacja z grudnia 2025 pokazała, że strony z wynikami bliżej dolnej granicy „Good" tracą na rzecz tych, które są znacząco poniżej progu.

### 3. Engagement Reliability — nowy sygnał w testach

Google zaczął testować w 2025 roku nową metrykę: **Engagement Reliability (ER)**. Mierzy, jak konsekwentnie użytkownicy mogą wchodzić w interakcje z Twoją stroną bez napotkania przeszkód. Czy przyciski działają? Czy formularze się wysyłają? Czy elementy interaktywne reagują niezawodnie na różnych urządzeniach i połączeniach?

ER nie jest jeszcze oficjalnym Core Web Vital, ale Google uwzględnia sygnały behawioralne — wzorce zaangażowania, bounce-back rates, czas spędzony na stronie — w ocenie jakości witryny. Strony, na których użytkownicy „odbijają się" od niedziaływających elementów, tracą pozycje.

### 4. Mobile-first indexing — 100% wdrożone

Od lipca 2024 Google indeksuje wyłącznie mobilną wersję Twojej strony. Nie ma już wyjątków. Jeśli optymalizujesz CWV tylko na desktopie, optymalizujesz coś, czego Google nawet nie ocenia. A różnica jest znacząca: 48% stron przechodzi CWV na mobile vs 56% na desktopie. Mobilna wersja jest prawie zawsze wolniejsza — i to ją Google bierze pod uwagę.

## Porównanie: przed i po zmianach

Poniższa tabela pokazuje, co się zmieniło w Core Web Vitals między 2023 a 2026 rokiem:

| Aspekt | Przed (2023) | Po (2025–2026) |
|--------|-------------|-----------------|
| **Metryka responsywności** | FID (First Input Delay) | **INP (Interaction to Next Paint)** |
| **Co mierzy responsywność** | Opóźnienie pierwszej interakcji | Najgorsza responsywność spośród wszystkich interakcji |
| **Próg responsywności „Good"** | ≤ 100 ms (FID) | **≤ 200 ms (INP)** |
| **Próg LCP „Good"** | ≤ 2,5 s | ≤ 2,5 s (ale strony < 2 s mają wyraźną przewagę) |
| **Próg CLS „Good"** | ≤ 0,1 | ≤ 0,1 |
| **Mobile-first indexing** | Stopniowy rollout | **100% — brak wyjątków od lipca 2024** |
| **Sygnały behawioralne** | Marginalne | **Engagement Reliability w testach** |
| **Waga CWV w rankingu** | Tie-breaker | **Wyraźnie wzmocniona (grudzień 2025)** |
| **% stron mobilnych przechodzących CWV** | ~44% | **~48%** |
| **Najtrudniejsza metryka** | LCP (65% pass rate) | **LCP (62% pass rate)** |

## LCP — wciąż najtrudniejsza metryka do opanowania

LCP (Largest Contentful Paint) mierzy czas potrzebny do wyrenderowania największego widocznego elementu na stronie. Próg to **2,5 sekundy**, ale w 2026 roku powinieneś celować w **1,5–2,0 s** — bo strony poniżej 2 sekund mają mierzalną przewagę rankingową.

Tylko **62% stron mobilnych** osiąga dobry LCP. To najgorzej wypadająca metryka i główny powód, dla którego strony nie przechodzą oceny CWV. Co gorsza, po grudniowej aktualizacji 2025 strony z LCP powyżej 3 s traciły pozycje wyraźniej niż wcześniej.

### Najczęstsze przyczyny wolnego LCP

1. **Wolny TTFB (Time to First Byte)** — serwer odpowiada za późno, zanim przeglądarka w ogóle zacznie renderować stronę. Dobry TTFB to poniżej 200 ms.
2. **Ciężkie hero image** — niezoptymalizowane zdjęcie w PNG lub JPEG o wadze 2–5 MB to gwarancja wolnego LCP.
3. **Render-blocking zasoby** — przeglądarka nie wyświetli strony, dopóki nie pobierze i nie przetworzy blokujących plików CSS i JS.
4. **Brak CDN** — użytkownik w Krakowie pobiera zasoby z serwera w innym kraju zamiast z lokalnego węzła.

### Jak poprawić LCP — konkretne kroki

- **Konwertuj obrazy do WebP/AVIF** — oszczędność 30–50% rozmiaru. Szczegóły znajdziesz w naszym poradniku o [optymalizacji obrazów dla SEO](/blog/optymalizacja-obrazow-seo).
- **Dodaj `fetchpriority="high"` na elemencie LCP** — mówisz przeglądarce: „to jest najważniejsze, załaduj to pierwsze".
- **Preloaduj kluczowe zasoby** — `<link rel="preload">` dla hero image, fontów i krytycznego CSS.
- **Wdróż CDN** — Cloudflare (darmowy plan) potrafi obniżyć latencję o setki milisekund.
- **Nie stosuj lazy loading na elemencie LCP** — obrazy poniżej foldu ładuj leniwie, ale hero image musi się załadować natychmiast.
- **Zminimalizuj łańcuchy requestów** — jeśli CSS importuje font, który importuje kolejny plik, masz kaskadę opóźnień. Eliminuj pośrednie zależności.

## INP — nowa metryka, nowe wyzwania

INP (Interaction to Next Paint) to metryka, która od marca 2024 zastąpiła FID. Próg to **200 ms** — użytkownik klika przycisk i w ciągu 200 milisekund powinien zobaczyć wizualną odpowiedź interfejsu.

Statystyki za 2025 rok: **77% stron mobilnych** przechodzi próg INP. To lepiej niż LCP, ale wciąż oznacza, że prawie co czwarta strona nie reaguje wystarczająco szybko na interakcje. Co ciekawe, wśród 1000 najpopularniejszych stron na świecie wynik jest gorszy — bo duże serwisy mają więcej JavaScriptu i więcej skryptów third-party.

### Dlaczego INP jest trudniejszy niż FID?

FID mierzył tylko pierwszą interakcję i tylko opóźnienie wejściowe. Wystarczyło, żeby strona szybko zareagowała na pierwsze kliknięcie. INP ocenia **każdą interakcję** — kliknięcia, dotknięcia, naciśnięcia klawiszy — i raportuje najgorszą z nich. Jeśli Twój formularz kontaktowy zamiera na 400 ms przy wysyłaniu, INP to zarejestruje, nawet jeśli reszta strony jest błyskawiczna.

### Najczęstsze przyczyny wysokiego INP

1. **Long tasks na main thread** — każde zadanie JavaScript dłuższe niż 50 ms blokuje przeglądarkę i opóźnia reakcję na kliknięcie.
2. **Ciężkie event handlery** — kliknięcie uruchamia rozbudowaną logikę, manipulację DOM lub synchroniczne obliczenia.
3. **Za dużo third-party scripts** — każdy chat widget, tracker, popup marketingowy i analytics to dodatkowy JS na main thread.
4. **Duży DOM** — im więcej elementów w drzewie DOM, tym wolniejsze renderowanie po interakcji.

### Jak poprawić INP — konkretne kroki

- **Rozbij long tasks** — podziel zadania JS dłuższe niż 50 ms na mniejsze fragmenty. Użyj `scheduler.yield()` lub `requestIdleCallback` do oddawania kontroli przeglądarce.
- **Odrocz niekrytyczny JS** — skrypty niepotrzebne przy pierwszej interakcji załaduj z atrybutem `defer` lub dynamicznie.
- **Ogranicz third-party scripts** — zrób audyt załadowanych skryptów. Czy naprawdę potrzebujesz pięciu trackerów, dwóch chat widgetów i trzech popupów?
- **Użyj Web Workers** — przenieś ciężkie obliczenia poza główny wątek.
- **Debounce i throttle** — nie reaguj na każdy event scroll czy mousemove. Ogranicz częstotliwość wywołań.
- **Wirtualizuj długie listy** — jeśli renderujesz katalog produktów, użyj wirtualizacji (react-window, TanStack Virtual), żeby renderować tylko widoczne elementy.

## CLS — najłatwiejszy do naprawienia, ale wciąż irytujący

CLS (Cumulative Layout Shift) mierzy przeskoki layoutu — te momenty, gdy chcesz kliknąć link, a nagle pojawia się baner i trafiasz w coś innego. Próg to **0,1** i dobra wiadomość: **81% stron mobilnych** go przechodzi.

Ale to nie znaczy, że możesz ignorować CLS. Kiedy jest zły, użytkownicy to *czują* natychmiast — i odbijają się od strony. A Google coraz mocniej uwzględnia te sygnały behawioralne.

### Najczęstsze przyczyny wysokiego CLS

1. **Obrazy bez zadeklarowanych wymiarów** — przeglądarka nie wie, ile miejsca zarezerwować, więc layout przeskakuje po załadowaniu.
2. **Dynamicznie wstawiane reklamy i banery** — pojawiają się po załadowaniu strony i przesuwają całą treść w dół.
3. **Fonty powodujące FOUT/FOIT** — tekst zmienia rozmiar po załadowaniu docelowego fontu.
4. **Treść wstawiana nad istniejący content** — banery cookie, powiadomienia, CTA na górze strony.

### Jak poprawić CLS — konkretne kroki

- **Zawsze podawaj width i height obrazów** — pozwól przeglądarce zarezerwować miejsce przed załadowaniem. Obrazy odpowiadają za około 60% problemów z CLS.
- **Używaj `aspect-ratio` w CSS** — nowoczesny, elastyczny sposób na kontrolę proporcji elementów.
- **Rezerwuj miejsce na reklamy** — zdefiniuj stały rozmiar kontenera dla dynamicznie wstawianych banerów.
- **Kontroluj ładowanie fontów** — `font-display: swap` + `size-adjust` sprawią, że fallback font będzie zbliżony rozmiarem do docelowego.
- **Preloaduj krytyczne fonty** — `<link rel="preload" as="font" crossorigin>` eliminuje migotanie tekstu.
- **Nie wstawiaj treści nad istniejący content** — jeśli dodajesz baner na górze, użyj `position: sticky` lub zarezerwuj na niego miejsce w layoucie od początku.

## Engagement Reliability — sygnał, który warto śledzić

Engagement Reliability (ER) to nowy sygnał, który Google testuje od 2025 roku. Nie jest jeszcze oficjalnym Core Web Vital, ale warto go mieć na radarze, bo wpisuje się w szerszy trend: Google coraz bardziej polega na sygnałach behawioralnych.

ER mierzy, jak konsekwentnie użytkownicy mogą wchodzić w interakcje z Twoją stroną bez przeszkód. Obejmuje:

- **Niezawodność elementów interaktywnych** — czy przyciski działają, czy formularze się wysyłają
- **Spójność między urządzeniami** — czy strona działa tak samo na telefonie, tablecie i desktopie
- **Wzorce zaangażowania** — czas na stronie, liczba interakcji, bounce-back rate

Aktualizacja algorytmu z grudnia 2025 wyraźnie wzmocniła wagę sygnałów behawioralnych. Strony z wyższym dwell time, większą liczbą interakcji (kliknięcia, scrole, odtwarzanie wideo) i niższym bounce-back rate zyskały w rankingach.

Co to oznacza w praktyce? Optymalizacja CWV i niezawodność techniczna to dwie strony tej samej monety. Szybka, stabilna strona z działającymi elementami interaktywnymi = dłuższy czas na stronie = lepsze sygnały behawioralne = wyższe pozycje.

## Jak SiteSpector pomaga z Core Web Vitals

SiteSpector przeprowadza pełne testy Lighthouse dla każdej audytowanej strony — zarówno w wersji desktopowej, jak i mobilnej. W raporcie dostajesz:

- **Wyniki LCP, INP i CLS** z konkretnymi wartościami i oceną (Good / Needs Improvement / Poor)
- **TTFB i inne metryki wspierające** — żebyś wiedział, co dokładnie spowalnia Twoją stronę
- **Konkretne rekomendacje do poprawy** — nie ogólniki, ale wskazówki dopasowane do Twojej strony
- **Porównanie desktop vs mobile** — bo to mobilne wyniki decydują o rankingu

Nie musisz ręcznie testować każdego URL-a. System robi to automatycznie i pokazuje, które strony wymagają natychmiastowej uwagi. Jeśli chcesz zrozumieć cały proces audytu SEO, nie tylko CWV, przeczytaj nasz [kompletny przewodnik po audycie SEO](/blog/jak-przeprowadzic-audyt-seo).

**[Sprawdź Core Web Vitals swojej strony za darmo w SiteSpector →](https://sitespector.app)**

## Checklist CWV na 2026 rok

Oto konkretna lista rzeczy do sprawdzenia i poprawienia. Wydrukuj ją, zapisz, wróć do niej po każdym większym deployu.

### LCP (cel: < 2,0 s)
- [ ] Hero image w formacie WebP/AVIF z `fetchpriority="high"`
- [ ] `<link rel="preload">` dla kluczowych zasobów (fonty, hero image, krytyczny CSS)
- [ ] CDN wdrożony i aktywny
- [ ] TTFB poniżej 200 ms (sprawdź hosting, cache serwera, konfigurację bazy danych)
- [ ] Brak render-blocking JS/CSS na ścieżce krytycznej

### INP (cel: < 200 ms)
- [ ] Brak long tasks > 50 ms na main thread
- [ ] Third-party scripts ograniczone do niezbędnego minimum
- [ ] Event handlery zoptymalizowane (debounce, throttle, Web Workers)
- [ ] Bundle JS zminifikowany i tree-shaked
- [ ] Długie listy zwirtualizowane

### CLS (cel: < 0,1)
- [ ] Wszystkie obrazy i wideo mają width/height lub aspect-ratio
- [ ] Miejsce na reklamy i dynamiczne elementy zarezerwowane
- [ ] Fonty preloadowane z `font-display: swap`
- [ ] Brak treści wstawianej nad istniejący content

### Ogólne
- [ ] Mobilna wersja strony zoptymalizowana (bo Google indeksuje tylko ją)
- [ ] Regularne testy CWV po każdym deployu i większej zmianie
- [ ] Monitoring wyników w czasie — nowy skrypt czy wtyczka może zepsuć CWV z dnia na dzień

## Podsumowanie

Core Web Vitals w 2026 roku to nie abstrakcyjne metryki — to realne pieniądze. INP zastąpił FID i jest znacznie bardziej wymagający. LCP wciąż jest najtrudniejszą metryką do opanowania. Mobile-first indexing działa w 100%. Google coraz mocniej waży sygnały behawioralne. Strony, które ignorują te zmiany, tracą ruch, pozycje i klientów.

Dobra wiadomość? Ponad połowa stron w internecie nie przechodzi oceny CWV. Każdy punkt, który poprawisz, daje Ci przewagę nad konkurencją. Zacznij od zmierzenia aktualnego stanu — i systematycznie poprawiaj metrykę po metryce.

**[Zrób darmowy audyt CWV w SiteSpector i sprawdź, gdzie tracisz pozycje →](https://sitespector.app)**
