---
title: "Raporty PDF"
slug: "raporty-pdf"
icon: "RiFilePdfLine"
order: 3
---

## Generowanie raportu

Kliknij przycisk **"Pobierz PDF"** w panelu audytu (dostępny po zakończeniu analizy).

## Zawartość raportu (9 sekcji)

1. **Executive Summary** — ogólna ocena strony, score'y, wykryte problemy
2. **Spis treści** — dynamiczny, na bazie dostępnych danych
3. **Analiza SEO Techniczna** — crawl, meta tagi, nagłówki, linki, technikalia
4. **Analiza Wydajności** — Core Web Vitals desktop i mobile, rekomendacje
5. **Analiza Treści** — jakość contentu, czytelność, ocena AI
6. **Local SEO** (warunkowa) — jeśli wykryto firmę lokalną: NAP, Schema
7. **Analiza Konkurencji** (warunkowa) — porównanie z konkurentami
8. **Action Plan** — priorytetyzowane zadania na bazie wyników
9. **Załączniki** — kod, szczegóły techniczne

## White-label

W planach Pro i Enterprise raporty mogą być generowane bez brandingu SiteSpector.

## Eksport surowych danych

Opcja **"Pobierz RAW"** eksportuje ZIP z plikami JSON:
- `audit.json` — pełny obiekt audytu
- `crawl.json` — dane Screaming Frog
- `lighthouse_desktop.json` / `lighthouse_mobile.json`
- `ai_analysis.json` — rekomendacje AI
- `senuto/` — dane widoczności, backlinków, AI Overviews
