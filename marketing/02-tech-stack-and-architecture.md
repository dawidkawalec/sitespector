# SiteSpector — Stack Techniczny i Architektura

> **Dla kogo:** Osoby techniczne, dziennikarze tech, potencjalni klienci enterprise zadający pytania o bezpieczeństwo, partnerzy integracyjni.  
> **Po co:** Transparentny opis decyzji technicznych — dlaczego wybraliśmy dane narzędzia i co to oznacza dla klienta.

---

## 1. Filozofia techniczna

SiteSpector jest zbudowany na zasadzie **"najlepsze narzędzie do konkretnego zadania"** — zamiast budować własny crawler, własny silnik wydajności czy własną bazę linków, integrujemy wiodące specjalizowane narzędzia branżowe i łączymy je inteligencją AI.

**Efekt dla klienta:** Dane są tak samo wiarygodne jak Screaming Frog, Lighthouse i Senuto — bo to właśnie te narzędzia pracują pod spodem.

---

## 2. Pełny stack techniczny

### Frontend
| Technologia | Wersja | Dlaczego |
|-------------|--------|---------|
| **Next.js** | 14 (App Router) | SSR, routing, wydajność, ekosystem React |
| **TypeScript** | strict | Bezpieczeństwo typów, mniej błędów runtime |
| **Tailwind CSS** | 3.x | Szybki development, spójny design system |
| **shadcn/ui** | latest | Gotowe komponenty UI, pełna konfigurowalność |
| **TanStack Query** | v5 | Zarządzanie stanem serwera, cache, refetch |
| **Zustand** | latest | Lekki global state dla UI |
| **next-themes** | latest | Dark mode bez migotania |

### Backend
| Technologia | Wersja | Dlaczego |
|-------------|--------|---------|
| **FastAPI** | latest | Szybki async Python, auto-docs, type hints |
| **Python** | 3.11 | Najlepsza obsługa AI/ML bibliotek |
| **SQLAlchemy** | 2.0 async | Type-safe ORM z async I/O |
| **Pydantic** | v2 | Walidacja danych, serializacja |
| **Alembic** | latest | Migracje bazy danych |

### Bazy danych
| Baza | Zastosowanie | Dlaczego |
|------|-------------|---------|
| **Supabase (PostgreSQL)** | Użytkownicy, workspace, projekty, billing | Wbudowana auth, RLS, real-time, hosted |
| **VPS PostgreSQL** | Audyty, wyniki, chat, harmonogramy | Pełna kontrola, dane audytów mogą być duże |
| **Qdrant** | Wektory do RAG chat | Najlepsza wydajność dla vector search |

**Dlaczego dwie bazy?** Supabase jest idealne dla danych użytkowników (auth, RLS, polityki dostępu), ale wyniki audytów mogą zajmować dziesiątki MB na audyt — trzymamy je na własnym PostgreSQL gdzie mamy pełną kontrolę nad performance i backup.

### AI i analiza
| Technologia | Zastosowanie | Dlaczego |
|-------------|-------------|---------|
| **Google Gemini 3.0 Flash** | Analiza AI, chat, embeddings | Najlepsza cena/jakość dla długich kontekstów, multimodal |
| **Qdrant** | Vector store dla RAG | Open source, self-hosted, szybki |
| **Screaming Frog CLI** | Crawl SEO | Branżowy standard, komercyjna licencja |
| **Google Lighthouse** | Core Web Vitals | Oficjalny standard Google |
| **Senuto API** | Widoczność PL, backlinki, AI Overviews | Najlepsza baza danych dla polskiego rynku |

### Infrastruktura
| Komponent | Technologia | Dlaczego |
|-----------|-------------|---------|
| **VPS** | Hetzner CPX42 (8 vCPU, 16GB RAM) | Dane w EU, cena/jakość, lokalizacja Niemcy |
| **Orchestracja** | Docker Compose (10 kontenerów) | Prosta, deterministyczna, łatwe deploy |
| **Reverse proxy** | Nginx | SSL termination, routing, static files |
| **SSL** | Let's Encrypt | Darmowy, auto-renewal |
| **Płatności** | Stripe | Standard branżowy, PCI compliance |
| **Auth** | Supabase Auth | JWT, OAuth (Google, GitHub), Magic Links |

---

## 3. Architektura — 10 kontenerów Docker

```
Internet
    │
    ▼
[nginx] — SSL (Let's Encrypt), reverse proxy
    ├── [frontend]     — Next.js 14 app (dashboard)
    ├── [landing]      — Next.js marketing (strona publiczna)
    └── [backend]      — FastAPI REST API
              │
              ├── [worker]         — Background audit processor
              ├── [postgres]       — VPS PostgreSQL (audyty)
              ├── [qdrant]         — Vector store (RAG)
              ├── [screaming-frog] — SEO crawler
              ├── [lighthouse]     — Performance audits
              └── [dozzle]         — Docker logs (admin only, SSH tunnel)
```

### Opis każdego kontenera

| # | Kontener | Rola | Sieć |
|---|----------|------|------|
| 1 | **nginx** | SSL, reverse proxy, routing domen | external |
| 2 | **frontend** | Next.js dashboard (zalogowani użytkownicy) | internal |
| 3 | **landing** | Next.js marketing (strona publiczna, 18+ stron) | internal |
| 4 | **backend** | FastAPI REST API | internal |
| 5 | **worker** | Background processor audytów (kolejka) | internal |
| 6 | **postgres** | Wyniki audytów, chat, harmonogramy | internal |
| 7 | **qdrant** | Embeddings dla RAG chat | internal |
| 8 | **screaming-frog** | Crawl SEO (licencja komercyjna) | external |
| 9 | **lighthouse** | Pomiar wydajności + CWV | external |
| 10 | **dozzle** | Podgląd logów Docker (tylko admin przez SSH) | internal |

**Dwie sieci Docker:**
- `sitespector-internal` — brak dostępu do internetu (backend, bazy)
- `sitespector-external` — dostęp do internetu (crawlery, lighthouse)

---

## 4. Dual Database — dlaczego dwie bazy?

### Supabase (PostgreSQL managed)
**Co trzymamy:** profile użytkowników, workspace, projekty, członkowie team, subskrypcje, faktury, role.

**Dlaczego Supabase:**
- Wbudowana autoryzacja (JWT, OAuth, Magic Links) bez pisania własnego auth
- Row Level Security (RLS) — polityki dostępu na poziomie bazy
- Real-time subscriptions
- Hostowane — zero operacji, auto-backup
- Darmowe do limitu, potem płatne

### VPS PostgreSQL (self-hosted)
**Co trzymamy:** audyty (wyniki w JSONB do kilkudziesięciu MB), zadania Execution Plan, konwersacje chat, wiadomości chat, harmonogramy.

**Dlaczego własny PostgreSQL:**
- Pełna kontrola nad rozmiarem i strukturą danych
- Wyniki audytu to JSONB o rozmiarze do kilkudziesięciu MB — taniej i wydajniej na własnym serwerze
- Backup zgodnie z własnymi potrzebami
- Brak limitów wierszy/rozmiaru jak w Supabase free tier

---

## 5. Dlaczego wybraliśmy dane narzędzia analizy?

### Screaming Frog — dlaczego nie własny crawler?
Screaming Frog to branżowy standard używany przez 98% profesjonalnych agencji SEO. Budowanie własnego crawlera zajęłoby lata i nie dałoby takiej samości wyników. **Klienci ufają danym ze Screaming Frog** — to dla nich certyfikat jakości. Używamy licencji komercyjnej CLI, co pozwala na działanie headless na serwerze.

### Google Lighthouse — dlaczego nie PageSpeed API?
Lighthouse uruchamiamy lokalnie (nie przez API Google), co daje:
- Brak limitów zapytań
- Brak opóźnień sieciowych do Google API
- Pełne dane zamiast uproszczonego skrótu z API
- Analiza desktop i mobile w jednym przebiegu

### Senuto — dlaczego akurat to?
Senuto to największa polska baza danych o widoczności w Google — obejmuje polski rynek lepiej niż Ahrefs czy SEMrush. Daje nam dostęp do:
- Pozycji i słów kluczowych dla polskich domen
- Backlinków
- AI Overviews (unikalny feature)
- Danych o konkurentach

### Google Gemini — dlaczego nie GPT-4 lub Claude?
- **Długi kontekst** — Gemini obsługuje bardzo długie konteksty (potrzebne do analizy pełnych danych audytu)
- **Multimodal** — obsługa obrazów i PDF w chat (drag & drop)
- **Embeddings** — `gemini-embedding-001` do RAG, zintegrowane z tym samym API
- **Cena** — Gemini Flash jest znacząco tańszy niż GPT-4 przy porównywalnej jakości dla naszego zastosowania
- **Streaming** — natywne SSE streaming do chat

---

## 6. Bezpieczeństwo

### Dane w Unii Europejskiej
**Wszystkie dane** przechowywane są w Niemczech (Hetzner VPS w Helsinkach / Niemczech, Supabase EU region). To kluczowe dla polskich firm B2B pod kątem GDPR.

### Izolacja danych
- Dane różnych workspace są logicznie izolowane przez Row Level Security w Supabase
- Backend weryfikuje `workspace_id` przy każdym zapytaniu (`verify_workspace_access()`)
- Brak możliwości dostępu do danych innego workspace przez API

### Szyfrowanie
- Wszystkie połączenia HTTPS (Let's Encrypt, auto-renewal)
- Hasła hashowane przez Supabase Auth
- JWT tokeny z krótkim TTL
- Stripe PCI DSS compliance dla płatności

### Dostęp administracyjny
- Dozzle (logi Docker) dostępny tylko przez SSH tunnel — nie wystawiony publicznie
- Super admin panel z osobnymi uprawnieniami
- Impersonacja (admin wchodzi jako klient) — tylko read-only

---

## 7. Skalowalność i niezawodność

### Architektura worker
- Worker uruchamia się co 10 sekund, sprawdza kolejkę
- Maksymalnie **3 audyty równolegle** (ograniczenie zasobów serwera)
- Audyty trwające >10 minut automatycznie oznaczane jako FAILED
- Harmonogramy (daily/weekly/monthly) realizowane automatycznie

### Resilience Gemini AI
- Trzy klucze API Gemini z fallbackiem (circuit breaker przy 429)
- Graceful degradation — jeśli AI niedostępne, wyniki techniczne są zapisywane
- GLOBAL_SNAPSHOT zapewnia spójność między modułami AI

### Monitoring
- Dozzle do podglądu logów wszystkich kontenerów (admin)
- Health check endpointy dla każdego serwisu
- Audyty w stanie PROCESSING > 10 min = alert + auto-FAILED

---

## 8. Deploy i ciągłe dostarczanie

```bash
# Typowy deploy (przykład dla frontendu)
ssh deploy@46.225.134.48
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

- **Git flow:** branch `release` → VPS
- **Zero downtime:** deploy pojedynczego kontenera nie wyłącza pozostałych
- **Rollback:** `git checkout` poprzedni commit + rebuild

---

## 9. Komunikaty dla odbiorców nietech

### Dla klientów B2B (na stronę / w pitchu)
> "SiteSpector działa na serwerach w Niemczech, w pełnej zgodności z GDPR. Twoje dane nigdy nie opuszczają Unii Europejskiej. Używamy tych samych narzędzi co największe agencje SEO na świecie — Screaming Frog i Google Lighthouse — więc wyniki są wiarygodne i porównywalne."

### Dla działów IT / security
> "Architektura mikroserwisów Docker, dual database (Supabase managed + VPS PostgreSQL), Row Level Security na poziomie bazy, JWT auth, wszystkie połączenia HTTPS, dane w EU. Audyt bezpieczeństwa dostępny na życzenie."

### Dla managerów
> "Narzędzie działa w przeglądarce — zero instalacji, zero IT. Dane są bezpieczne w Europie. Raporty PDF gotowe do wysłania klientowi lub zarządowi."

---

*Aktualizacja: Marzec 2026*
