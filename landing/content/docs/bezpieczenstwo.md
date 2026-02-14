---
title: "Bezpieczeństwo i prywatność"
slug: "bezpieczenstwo"
icon: "RiShieldLine"
order: 6
---

## Lokalizacja danych

- **Użytkownicy i zespoły**: Supabase (AWS EU)
- **Audyty i wyniki**: VPS w Niemczech (Hetzner)
- **Płatności**: Stripe (PCI DSS Level 1)
- Wszystkie dane w Unii Europejskiej

## RODO

Pełna zgodność z RODO:
- Prawo do dostępu, sprostowania, usunięcia danych
- Prawo do przenoszenia danych
- Kontakt: kontakt@sitespector.pl

## Dane przesyłane do AI Gemini

Do Google Gemini przesyłamy wyłącznie dane techniczne analizowanej strony:
- Tytuł strony, meta opis, nagłówki
- Liczba słów, struktura linków
- **NIE** przesyłamy: danych osobowych, informacji o koncie, treści poufnych

## Dane przesyłane do Senuto

Do Senuto API przesyłamy wyłącznie:
- URL analizowanej domeny
- Konfigurację (kraj, tryb)
- **NIE** przesyłamy danych użytkownika ani konta

## Szyfrowanie

- HTTPS (SSL/TLS) — certyfikat Let's Encrypt
- Protokoły TLS 1.2 i 1.3

## Izolacja danych

Row Level Security (RLS) — każdy workspace jest całkowicie oddzielony na poziomie bazy danych.
