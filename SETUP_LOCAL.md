# SiteSpector - Local Development Setup

Kompletny przewodnik uruchomienia projektu SiteSpector lokalnie.

---

## 📋 Wymagania

### Niezbędne

- **Python 3.11+** (backend)
- **Node.js 20.x LTS** (frontend)
- **Docker + Docker Compose** (kontenery)
- **PostgreSQL 16** (baza danych)
- **Git** (kontrola wersji)

### Opcjonalne

- **Make** (uproszczone komendy)
- **ngrok** (testowanie webhooks)

---

## 🚀 Quick Start (5 minut)

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/dawidkawalec/sitespector.git
cd sitespector
```

### 2. Utworzenie pliku `.env`

```bash
cp .env.example .env
```

Edytuj `.env` i uzupełnij:
```bash
DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@localhost:5432/sitespector_db
JWT_SECRET=twoj-super-tajny-klucz-minimum-32-znaki-1234567890
CLAUDE_API_KEY=sk-ant-twoj-klucz-api  # Opcjonalne na start
```

### 3. Uruchomienie z Docker Compose

```bash
make up
# LUB bez Make:
docker-compose up -d
```

### 4. Migracja bazy danych

```bash
make migrate
# LUB bez Make:
docker-compose exec backend alembic upgrade head
```

### 5. Otwórz aplikację

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📦 Setup Manualny (bez Docker)

### Backend

```bash
cd backend

# Utwórz virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Zainstaluj zależności
pip install -r requirements.txt

# Uruchom migracje
alembic upgrade head

# Uruchom serwer
uvicorn app.main:app --reload
```

Backend dostępny na: http://localhost:8000

### Frontend

```bash
cd frontend

# Zainstaluj zależności
npm install

# Utwórz plik .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Uruchom serwer deweloperski
npm run dev
```

Frontend dostępny na: http://localhost:3000

### Worker (opcjonalnie)

```bash
cd backend
source venv/bin/activate
python worker.py
```

---

## 🗄️ Setup Bazy Danych

### PostgreSQL Lokalnie

```bash
# Zainstaluj PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Utwórz bazę danych
createdb sitespector_db

# Utwórz użytkownika
psql -c "CREATE USER sitespector_user WITH PASSWORD 'sitespector_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE sitespector_db TO sitespector_user;"
```

### Migracje Alembic

```bash
# Upgrade do najnowszej wersji
alembic upgrade head

# Utwórz nową migrację
alembic revision --autogenerate -m "Opis zmian"

# Downgrade o jeden krok
alembic downgrade -1

# Historia migracji
alembic history
```

---

## 🧪 Uruchamianie Testów

### Backend Tests

```bash
cd backend

# Wszystkie testy
pytest

# Testy z coverage
pytest --cov=app --cov-report=html

# Tylko konkretny plik
pytest app/tests/test_auth.py

# Z verbose output
pytest -v
```

Coverage report: `backend/htmlcov/index.html`

### Frontend Tests

```bash
cd frontend

# Unit tests (jeśli są)
npm test

# E2E tests z Playwright
npx playwright test

# E2E w trybie UI
npx playwright test --ui

# Konkretny test
npx playwright test e2e/auth.spec.ts
```

---

## 🔧 Makefile Commands

```bash
# Docker
make up              # Start wszystkie serwisy
make down            # Stop wszystkie serwisy
make logs            # Pokaż logi
make restart         # Restart serwisów
make build           # Zbuduj kontenery
make clean           # Usuń wszystko (containers, volumes)

# Development
make install         # Zainstaluj zależności (backend + frontend)
make migrate         # Uruchom migracje
make shell           # Otwórz Python shell z modelami
make db-shell        # Otwórz PostgreSQL shell

# Testing
make test            # Wszystkie testy
make backend-test    # Tylko backend
make frontend-test   # Tylko frontend

# Code Quality
make format          # Formatuj kod (Black + isort + Prettier)
make lint            # Uruchom lintery
```

---

## 🐛 Troubleshooting

### Problem: Port 8000 zajęty

```bash
# Znajdź proces na porcie 8000
lsof -ti:8000

# Zabij proces
kill -9 $(lsof -ti:8000)
```

### Problem: PostgreSQL connection refused

```bash
# Sprawdź czy PostgreSQL działa
pg_isready

# Sprawdź status serwisu (macOS)
brew services list

# Restart PostgreSQL
brew services restart postgresql@16
```

### Problem: Docker kontenery nie startują

```bash
# Sprawdź logi
docker-compose logs backend

# Restart kontenera
docker-compose restart backend

# Zbuduj od nowa
docker-compose build --no-cache backend
```

### Problem: Frontend nie łączy się z backend

Sprawdź `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Upewnij się, że backend działa:
```bash
curl http://localhost:8000/health
```

### Problem: Alembic migration fails

```bash
# Sprawdź aktualną wersję
alembic current

# Reset do bazy wersji
alembic downgrade base

# Uruchom ponownie
alembic upgrade head
```

---

## 🔑 Zdobywanie API Keys

### Claude API (Anthropic)

1. Załóż konto: https://console.anthropic.com/
2. Wejdź w **API Keys**
3. Utwórz nowy klucz
4. Skopiuj i dodaj do `.env`:
   ```
   CLAUDE_API_KEY=sk-ant-twoj-klucz
   ```

### Railway (Deployment)

1. Załóż konto: https://railway.app/
2. Połącz z GitHub
3. Utwórz nowy projekt
4. Dodaj PostgreSQL database
5. Skopiuj DATABASE_URL

---

## 📚 Przydatne Komendy

### Backend

```bash
# Uruchom w trybie debug
uvicorn app.main:app --reload --log-level debug

# Sprawdź wersję pakietów
pip list

# Zaktualizuj requirements.txt
pip freeze > requirements.txt

# Formatuj kod
black app/
isort app/
```

### Frontend

```bash
# Zbuduj produkcyjnie
npm run build

# Uruchom produkcyjną wersję
npm start

# Sprawdź linting
npm run lint

# Formatuj kod
npm run format
```

### Docker

```bash
# Zobacz działające kontenery
docker ps

# Zobacz użycie zasobów
docker stats

# Wejdź do kontenera
docker-compose exec backend bash

# Usuń nieużywane obrazy
docker system prune
```

---

## 🎯 Następne Kroki

Po udanym setupie lokalnym:

1. **Zapoznaj się z dokumentacją:**
   - `docs/API_ENDPOINTS.md` - specyfikacja API
   - `docs/DATABASE_SCHEMA.md` - schemat bazy
   - `docs/BACKLOG.md` - zadania do wykonania

2. **Utwórz konto testowe:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234"}'
   ```

3. **Utwórz pierwszy audyt:**
   - Zaloguj się na http://localhost:3000/login
   - Kliknij "Nowy audyt"
   - Wprowadź URL: `https://example.com`
   - Poczekaj na wyniki

4. **Sprawdź API docs:**
   - Otwórz http://localhost:8000/docs
   - Przetestuj endpointy interaktywnie

---

## 📞 Pomoc

- **Issues:** https://github.com/dawidkawalec/sitespector/issues
- **Dokumentacja:** `docs/FAQ.md`
- **Email:** kontakt@sitespector.app

---

**Last Updated:** 2025-12-05

