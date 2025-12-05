# SiteSpector.app

AI-powered website audit tool dla polskiego rynku. Audyty SEO, wydajności, contentu i analizy konkurencji z rekomendacjami AI.

## 🚀 Quick Start

### Wymagania

- Python 3.11+
- Node.js 20.x LTS
- Docker + Docker Compose
- PostgreSQL 16
- Git

### Instalacja Lokalna

1. **Klonowanie repozytorium**

```bash
git clone https://github.com/dawidkawalec/sitespector.git
cd sitespector
```

2. **Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**

```bash
cd frontend
npm install
```

4. **Environment Variables**

```bash
cp .env.example .env
# Edytuj .env i dodaj:
# - DATABASE_URL
# - CLAUDE_API_KEY
# - JWT_SECRET
```

5. **Database Migration**

```bash
cd backend
alembic upgrade head
```

6. **Uruchomienie (Docker)**

```bash
make up
```

Lub bez Docker:

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Worker
cd backend
python worker.py

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 📚 Dokumentacja

Cała dokumentacja znajduje się w folderze [`/docs`](docs/):

- **[PRD.md](docs/PRD.md)** - Product Requirements Document
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architektura systemu
- **[API_ENDPOINTS.md](docs/API_ENDPOINTS.md)** - Specyfikacja API
- **[BACKLOG.md](docs/BACKLOG.md)** - Zadania do wykonania
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Schemat bazy danych
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Szczegółowy guide instalacji

Pełna lista: [docs/TABLE_OF_CONTENTS.md](docs/TABLE_OF_CONTENTS.md)

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python 3.11)
- PostgreSQL 16
- SQLAlchemy 2.0 (async)
- Alembic (migrations)
- Claude Sonnet 4 (Anthropic API)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query

**Infrastructure:**
- Docker + Docker Compose
- Railway.app (hosting)
- Screaming Frog (SEO crawling)
- Lighthouse (performance)

## 🏗️ Struktura Projektu

```
sitespector/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection
│   │   ├── auth.py              # JWT authentication
│   │   ├── routers/             # API endpoints
│   │   │   ├── auth.py
│   │   │   └── audits.py
│   │   └── services/            # Business logic
│   │       ├── screaming_frog.py
│   │       ├── lighthouse.py
│   │       ├── ai_analysis.py
│   │       └── pdf_generator.py
│   ├── tests/                   # Pytest tests
│   ├── templates/               # Jinja2 templates (PDF)
│   ├── alembic/                 # Database migrations
│   ├── worker.py                # Background worker
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Next.js pages (App Router)
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   └── audits/[id]/
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── package.json
├── docker/
│   ├── screaming-frog/
│   └── lighthouse/
├── docs/                        # Dokumentacja projektu
└── docker-compose.yml
```

## 🔑 Zmienne Środowiskowe

Backend (`.env`):

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/sitespector

# Authentication
JWT_SECRET=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# AI
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514

# Environment
ENVIRONMENT=development
DEBUG=true
```

Frontend (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Testing

**Backend:**

```bash
cd backend
pytest --cov=app --cov-report=html
```

**Frontend:**

```bash
cd frontend
npm run test
npx playwright test
```

## 🚀 Deployment

Deployment na Railway.app:

1. Push code to GitHub main branch
2. Railway auto-deploy via webhook
3. Configure environment variables w Railway dashboard
4. Run migrations: `railway run alembic upgrade head`

Szczegóły: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

## 📊 API Documentation

Po uruchomieniu backendu, Swagger docs dostępne na:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🤝 Contributing

1. Przeczytaj [docs/BACKLOG.md](docs/BACKLOG.md) - znajdź task
2. Stwórz branch: `git checkout -b feature/nazwa`
3. Commit z dokładnym opisem zmian
4. **NIE PUSHUJ** do main bez review

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- **Production:** https://sitespector.app
- **API:** https://api.sitespector.app
- **Documentation:** [docs/](docs/)
- **GitHub:** https://github.com/dawidkawalec/sitespector

---

**Built with ❤️ for Polish SEO market**

**Last Updated:** 2025-12-05

