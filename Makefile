.PHONY: help up down logs restart build clean test backend-test frontend-test migrate shell db-shell install format lint

# Default target
help:
	@echo "SiteSpector - Makefile Commands"
	@echo "================================"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Show logs (all services)"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Rebuild all containers"
	@echo "  make clean       - Remove all containers, volumes, and temp files"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install     - Install all dependencies (backend + frontend)"
	@echo "  make migrate     - Run database migrations"
	@echo "  make shell       - Open backend Python shell"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test        - Run all tests (backend + frontend)"
	@echo "  make backend-test    - Run backend tests"
	@echo "  make frontend-test   - Run frontend tests"
	@echo ""
	@echo "Code Quality Commands:"
	@echo "  make format      - Format code (black + isort)"
	@echo "  make lint        - Run linters (flake8 + mypy)"
	@echo ""

# ============================================
# Docker Commands
# ============================================

up:
	@echo "🚀 Starting SiteSpector services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API Docs: http://localhost:8000/docs"

down:
	@echo "🛑 Stopping SiteSpector services..."
	docker-compose down
	@echo "✅ Services stopped!"

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-worker:
	docker-compose logs -f worker

logs-frontend:
	docker-compose logs -f frontend

restart:
	@echo "🔄 Restarting services..."
	docker-compose restart
	@echo "✅ Services restarted!"

build:
	@echo "🔨 Building containers..."
	docker-compose build
	@echo "✅ Build complete!"

rebuild:
	@echo "🔨 Rebuilding containers from scratch..."
	docker-compose build --no-cache
	@echo "✅ Rebuild complete!"

clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	rm -rf tmp/
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	@echo "✅ Cleanup complete!"

# ============================================
# Development Commands
# ============================================

install:
	@echo "📦 Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

install-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "✅ Backend dependencies installed!"

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed!"

migrate:
	@echo "🗄️  Running database migrations..."
	cd backend && alembic upgrade head
	@echo "✅ Migrations complete!"

migrate-create:
	@echo "📝 Creating new migration..."
	@read -p "Migration message: " message; \
	cd backend && alembic revision --autogenerate -m "$$message"
	@echo "✅ Migration created!"

shell:
	@echo "🐍 Opening Python shell..."
	cd backend && python -i -c "from app.database import SessionLocal; from app.models import *; db = SessionLocal()"

db-shell:
	@echo "🗄️  Opening PostgreSQL shell..."
	docker-compose exec postgres psql -U sitespector_user -d sitespector_db

# ============================================
# Testing Commands
# ============================================

test:
	@echo "🧪 Running all tests..."
	make backend-test
	make frontend-test
	@echo "✅ All tests passed!"

backend-test:
	@echo "🧪 Running backend tests..."
	cd backend && pytest --cov=app --cov-report=html --cov-report=term
	@echo "✅ Backend tests complete!"
	@echo "   Coverage report: backend/htmlcov/index.html"

backend-test-verbose:
	@echo "🧪 Running backend tests (verbose)..."
	cd backend && pytest -v --cov=app --cov-report=html --cov-report=term

frontend-test:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test
	@echo "✅ Frontend tests complete!"

frontend-e2e:
	@echo "🧪 Running frontend E2E tests..."
	cd frontend && npx playwright test
	@echo "✅ E2E tests complete!"

# ============================================
# Code Quality Commands
# ============================================

format:
	@echo "✨ Formatting code..."
	cd backend && black . && isort .
	cd frontend && npm run format
	@echo "✅ Code formatted!"

format-backend:
	@echo "✨ Formatting backend code..."
	cd backend && black . && isort .
	@echo "✅ Backend code formatted!"

format-frontend:
	@echo "✨ Formatting frontend code..."
	cd frontend && npm run format
	@echo "✅ Frontend code formatted!"

lint:
	@echo "🔍 Running linters..."
	cd backend && flake8 app/ && mypy app/
	cd frontend && npm run lint
	@echo "✅ Linting complete!"

lint-backend:
	@echo "🔍 Running backend linters..."
	cd backend && flake8 app/ && mypy app/
	@echo "✅ Backend linting complete!"

lint-frontend:
	@echo "🔍 Running frontend linters..."
	cd frontend && npm run lint
	@echo "✅ Frontend linting complete!"

# ============================================
# Utility Commands
# ============================================

ps:
	@echo "📋 Service status:"
	docker-compose ps

stats:
	docker stats

prune:
	@echo "🧹 Pruning Docker system..."
	docker system prune -f
	@echo "✅ Prune complete!"

