---
title: "Core Web Vitals – co to jest i dlaczego Google je mierzy"
date: "2026-02-20"
excerpt: "LCP, FCP, CLS, TTFB – co znaczą te skróty i jak je poprawić, aby zadowolić Google."
author: "Zespół SiteSpector"
slug: "core-web-vitals-przewodnik"
---

## Czym są Core Web Vitals?
Core Web Vitals to zestaw trzech specyficznych metryk, które Google uważa za kluczowe dla ogólnego doświadczenia użytkownika na stronie internetowej. Od 2021 roku są one oficjalnym sygnałem rankingowym.

## LCP (Largest Contentful Paint)
Mierzy wydajność ładowania. Aby zapewnić dobre wrażenia użytkownika, LCP powinno wystąpić w ciągu **2,5 sekundy** od momentu rozpoczęcia ładowania strony.
- **Jak poprawić:** Optymalizacja obrazów, usunięcie niepotrzebnych skryptów JS, szybszy hosting.

## CLS (Cumulative Layout Shift)
Mierzy stabilność wizualną. Czy przyciski "uciekają" spod myszki podczas ładowania? CLS powinien wynosić mniej niż **0,1**.
- **Jak poprawić:** Rezerwowanie miejsca na obrazy i reklamy, unikanie dynamicznego wstawiania treści nad istniejącą zawartością.

## INP (Interaction to Next Paint)
Najnowsza metryka zastępująca FID. Mierzy responsywność strony na interakcje użytkownika (kliknięcia, dotknięcia).
- **Dobry wynik:** Poniżej 200ms.

## Jak mierzyć CWV w SiteSpector?
SiteSpector automatycznie przeprowadza testy Lighthouse dla każdej audytowanej strony, zarówno w wersji desktopowej, jak i mobilnej. Otrzymujesz gotowe wyniki wraz z technicznymi wskazówkami dla programistów.
