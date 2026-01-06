# 🚀 SiteSpector.app - Status Projektu & Handover (06.01.2026)

## 📌 Podsumowanie Executive
Projekt jest w fazie **zaawansowanego MVP**, działającego **lokalnie** na środowisku Docker. Aplikacja posiada w pełni funkcjonalny frontend (Next.js), backend (FastAPI) oraz bazę danych (PostgreSQL). Kluczowe mechanizmy (logowanie, tworzenie audytów, generowanie PDF) działają.

Główne wyzwania leżą w stabilności i optymalizacji "workerów" (Screaming Frog i Lighthouse), które odpowiadają za zbieranie danych.

**Decyzja:** Zostajemy przy Screaming Frog i działamy lokalnie (nie wrzucamy tego na razie na Railway w tej architekturze).

---

## 🛠️ Stack Technologiczny
*   **Frontend:** Next.js 14, TypeScript, Tailwind, Shadcn/UI.
*   **Backend:** FastAPI (Python 3.11), SQLAlchemy Async, Pydantic.
*   **Baza Danych:** PostgreSQL 16.
*   **Infrastruktura:** Docker Compose (lokalnie).
*   **Silniki Audytu:**
    *   **Screaming Frog SEO Spider** (w kontenerze Docker).
    *   **Google Lighthouse** (w kontenerze Docker).
    *   **Claude Sonnet 4** (API do analizy treści - gotowe do podpięcia).

---

## 🕷️ Screaming Frog (Analiza SEO)
**Status:** Działa, ale wymaga pilnej optymalizacji konfiguracji.

### 🔴 Zidentyfikowane Problemy:
1.  **"Ubogie raporty":**
    *   Obecny parser w Pythonie czyta **tylko pierwszy wiersz** wygenerowanego pliku CSV (stronę główną).
    *   Wszystkie znalezione linki wewnętrzne, zasoby, błędy 404 na podstronach są ignorowane w raporcie końcowym, mimo że crawler je widzi.
2.  **"Turbo Gigabajty" (Rozmiar danych):**
    *   W skrypcie uruchamiającym użyta jest flaga `--save-crawl`.
    *   Powoduje to zrzucanie całej bazy danych projektu Screaming Froga na dysk przy każdym audycie. Przy większych stronach zajmuje to setki megabajtów niepotrzebnych danych- przy dev na testy ok, przy publikacji pamietac o optymlaizacji (potrzebujemy tylko eksportu CSV).
3.  **Zakres Crawlowania:**
    *   Crawler domyślnie próbuje chodzić po całej stronie ("crawl depth"), co trwa długo i generuje szum informacyjny, skoro w MVP chcemy analizować **tylko jedną stronę** (Homepage).

### ✅ Plan Naprawczy:
*   [ ] **Ograniczyć głębokość:** Ustawić flagę `--crawl-depth 0` lub `1`, aby skanować *wyłącznie* podany URL, ignorując resztę serwisu.
*   [ ] **Usunąć `--save-crawl`:** Wyłączyć zapisywanie plików `.seospider`, polegać wyłącznie na eksporcie CSV w locie (oszczędność miejsca).
*   [ ] **Poprawić Parser:** Zmodyfikować `screaming_frog.py`, aby poprawnie interpretował dane (nawet jeśli skanujemy 1 stronę, warto pobrać pełne dane o jej zasobach/linkach wychodzących).

---

## 💡 Google Lighthouse (Analiza Wydajności)
**Status:** Działa, ale jest niestabilny przy cięższych stronach.

### 🔴 Zidentyfikowane Problemy:
1.  **Parsowanie JSON:**
    *   Backend wywołuje Lighthouse i oczekuje czystego JSON-a na wyjściu (`stdout`).
    *   Często zdarza się, że Chrome "wypluwa" ostrzeżenia lub logi (np. "DevTools listening on..."), co psuje strukturę JSON i powoduje błąd parsowania w Pythonie (audyt kończy się błędem, mimo że dane zostały zebrane).
2.  **Timeouty & Pamięć:**
    *   Uruchamianie Chrome w kontenerze (Headless) jest bardzo zasobożerne.
    *   Brak ustawionych twardych timeoutów w kodzie Pythona powoduje, że przy zawieszeniu się Chrome'a, worker wisi w nieskończoność.
3.  **Docker-in-Docker:**
    *   Obecna architektura wymaga, aby kontener `backend` miał dostęp do `docker.sock` (sterowanie sąsiednimi kontenerami). To działa lokalnie, ale uniemożliwi proste wdrożenie na tanie chmury (Railway Hobby) w przyszłości - nalezy to zmienic

### ✅ Plan Naprawczy:
*   [ ] **Czyszczenie Outputu:** Dodać w Pythonie logikę, która wycina śmieci z `stdout` przed próbą parsowania JSON-a.
*   [ ] **Timeouty:** Dodać `asyncio.wait_for` z limitem np. 60-90 sekund na audyt.
*   [ ] **Obsługa Błędów:** Lepsze raportowanie błędów, gdy Chrome się wywali (OOM kill).

---

## 📋 Lista Zadań (To-Do) dla Developera
1.  **Screaming Frog:**
    *   Usunąć flagę `--save-crawl` z `docker/screaming-frog/crawl.sh`.
    *   Dodać ograniczenie głębokości crawlu (tylko 1 URL).
    *   Zaktualizować parser CSV w `backend/app/services/screaming_frog.py`.
2.  **Lighthouse:**
    *   Zabezpieczyć parsowanie JSON przed logami Chrome'a.
    *   Dodać timeout do wywołania procesu.
3.  **AI (Claude):**
    *   Odkomentować kod w `backend/app/services/ai_analysis.py` i podpiąć działający klucz API.
4.  **Testy:**
    *   Przetestować cały flow "End-to-End" lokalnie po wprowadzeniu poprawek.

