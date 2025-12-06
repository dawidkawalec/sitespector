# Screaming Frog & Senuto Integration Setup

## Screaming Frog SEO Spider

### Wymagania
- Licencja Screaming Frog SEO Spider (wersja komercyjna)
- Dostęp do linku pobierania: https://www.screamingfrog.co.uk/seo-spider/

### Konfiguracja

1. **Zakup licencji:**
   - Przejdź na: https://www.screamingfrog.co.uk/seo-spider/#buy
   - Wybierz plan (Single User License recommended dla MVP)
   - Cena: ~£149/rok (około 750 PLN)

2. **Aktywacja w kontenerze:**
   - Po zakupie otrzymasz klucz licencyjny
   - Dodaj klucz do pliku `.env`:
     ```
     SCREAMINGFROG_LICENSE_KEY=twój-klucz-tutaj
     ```

3. **Weryfikacja instalacji:**
   ```bash
   docker-compose exec screaming-frog screamingfrogseospider --help
   ```

### Uwaga
- Wersja darmowa ma limit 500 URLi - wystarczająca do testów MVP
- Do produkcji zalecana jest licencja komercyjna (bez limitów)
- Instalacja w kontenerze Dockera jest już przygotowana

---

## Senuto Integration (Opcjonalne - przyszła funkcjonalność)

### Wymagania
- Konto Senuto API
- Plan z dostępem do API

### Konfiguracja

1. **Dostęp do API:**
   - Zaloguj się na https://www.senuto.com
   - Przejdź do Settings → API
   - Wygeneruj API key

2. **Dodaj do `.env`:**
   ```
   SENUTO_API_KEY=twój-api-key-tutaj
   SENUTO_API_URL=https://api.senuto.com/v1
   ```

3. **Plan działania:**
   - Wykorzystanie: analiza pozycji konkurencji w polskich wynikach Google
   - Integracja planowana w Etapie 2 rozwoju (po MVP)
   - Koszt: od 99 PLN/miesiąc (plan podstawowy)

---

## Podsumowanie kosztów MVP

| Usługa | Koszt | Wymagane? |
|--------|-------|-----------|
| Screaming Frog | £149/rok (~750 PLN) | Nie (wersja darmowa do testów) |
| Senuto | 99 PLN/miesiąc | Nie (na później) |
| Claude API | ~$0.12/audyt | TAK |
| Railway hosting | ~$20/miesiąc | TAK |

**Podsumowanie:** MVP można uruchomić bez dodatkowych kosztów licencji (używając darmowej wersji SF z limitem 500 URLi).

---

## Następne kroki

1. Przetestuj obecną konfigurację z darmową wersją SF
2. Jeśli wyniki są OK, zakup licencję SF przed wdrożeniem produkcyjnym
3. Senuto dodaj w przyszłości (po walidacji MVP z klientami)

