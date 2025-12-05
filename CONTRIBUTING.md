# Contributing to SiteSpector

Dziękujemy za zainteresowanie wkładem w SiteSpector! 🎉

---

## 📋 Przed Rozpoczęciem

1. Przeczytaj [README.md](README.md) i [SETUP_LOCAL.md](SETUP_LOCAL.md)
2. Zapoznaj się z [docs/BACKLOG.md](docs/BACKLOG.md) - lista zadań
3. Sprawdź [Issues](https://github.com/dawidkawalec/sitespector/issues) - może ktoś już pracuje nad tym samym

---

## 🔧 Development Workflow

### 1. Fork & Clone

```bash
# Fork repo na GitHub
# Sklonuj swój fork
git clone https://github.com/TWOJ-USERNAME/sitespector.git
cd sitespector

# Dodaj upstream
git remote add upstream https://github.com/dawidkawalec/sitespector.git
```

### 2. Utwórz Branch

```bash
# Zawsze twórz nowy branch z main
git checkout main
git pull upstream main
git checkout -b feature/nazwa-featurea

# Konwencja nazewnictwa:
# feature/nazwa  - nowa funkcjonalność
# fix/nazwa      - naprawa buga
# docs/nazwa     - dokumentacja
# test/nazwa     - testy
```

### 3. Rozwój

```bash
# Setup środowiska
make install
make up

# Uruchom testy przed zmianami
make test

# Wprowadź zmiany...
# Uruchom testy po zmianach
make test

# Formatuj kod
make format
```

### 4. Commit

```bash
# Użyj Conventional Commits
git commit -m "feat: dodaj export do Excel"
git commit -m "fix: napraw bug w PDF generation"
git commit -m "docs: aktualizuj API dokumentację"

# Typy commitów:
# feat:     Nowa funkcjonalność
# fix:      Naprawa buga
# docs:     Dokumentacja
# style:    Formatowanie (bez zmiany logiki)
# refactor: Refactoring kodu
# test:     Dodanie/modyfikacja testów
# chore:    Zmiany w build/CI
```

### 5. Push & Pull Request

```bash
# Push do swojego forka
git push origin feature/nazwa-featurea

# Otwórz Pull Request na GitHub
# Opisz co zostało zmienione i dlaczego
```

---

## ✅ Code Quality Standards

### Backend (Python)

```bash
# Formatowanie
black app/
isort app/

# Linting
flake8 app/

# Type checking
mypy app/

# Wszystko naraz:
make format
make lint
```

**Wymagania:**
- Type hints dla wszystkich funkcji
- Docstrings dla public API
- Testy dla nowej funkcjonalności
- Coverage >80%

### Frontend (TypeScript)

```bash
# Formatowanie
npm run format

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Wszystko naraz:
npm run lint && npm run format
```

**Wymagania:**
- Strict TypeScript (no `any`)
- Functional components + hooks
- Props typed z interfaces
- E2E testy dla krytycznych flow

---

## 🧪 Testing

### Backend

```bash
# Wszystkie testy
pytest

# Z coverage
pytest --cov=app

# Specific file
pytest app/tests/test_auth.py

# Verbose
pytest -v

# Wymagane:
- Coverage >80%
- Wszystkie testy przechodzą
- Nowe funkcje mają testy
```

### Frontend

```bash
# E2E tests
npx playwright test

# W trybie UI
npx playwright test --ui

# Specific test
npx playwright test e2e/auth.spec.ts

# Wymagane:
- E2E testy dla nowych stron
- Wszystkie testy przechodzą
```

---

## 📝 Documentation

- **API Changes:** Aktualizuj `docs/API_ENDPOINTS.md`
- **Database Changes:** Aktualizuj `docs/DATABASE_SCHEMA.md`
- **New Features:** Dodaj do `docs/BACKLOG.md`
- **README:** Aktualizuj jeśli zmienia się setup

---

## 🚫 Co NIE Robić

❌ Nie commituj do `main` bezpośrednio
❌ Nie pushuj secrets do repo (`.env`, keys)
❌ Nie commituj `node_modules/`, `__pycache__/`, etc.
❌ Nie łam istniejących testów
❌ Nie dodawaj dependencies bez konsultacji
❌ Nie używaj `any` w TypeScript
❌ Nie skipuj type hints w Pythonie

---

## 🔍 Code Review Process

1. **Automated Checks:**
   - GitHub Actions CI musi przejść (testy, linting)
   - Playwright E2E testy
   - Coverage >80%

2. **Manual Review:**
   - Code review przez maintainerów
   - Sprawdzenie dokumentacji
   - Testowanie lokalnie

3. **Merge:**
   - Squash & merge do `main`
   - Auto-deploy na Railway (jeśli production)

---

## 💡 Feature Requests & Bugs

### Bug Report

```markdown
**Opis buga:**
Krótki opis co nie działa

**Kroki do reprodukcji:**
1. Otwórz...
2. Kliknij...
3. Zobacz błąd...

**Oczekiwane zachowanie:**
Co powinno się stać

**Screenshoty:**
Jeśli applicable

**Środowisko:**
- OS: macOS 14
- Browser: Chrome 120
- Version: 0.1.0
```

### Feature Request

```markdown
**Problem:**
Jaki problem rozwiązuje ta funkcja?

**Proponowane rozwiązanie:**
Jak powinno działać?

**Alternatywy:**
Jakie inne rozwiązania rozważałeś?

**Dodatkowy kontekst:**
Screenshoty, mockupy, etc.
```

---

## 🎯 Priorytety

### Wysoki Priorytet
- 🐛 Krytyczne bugi
- 🔒 Security issues
- 📊 Performance problems

### Średni Priorytet
- ✨ Nowe funkcje (z BACKLOG.md)
- 📝 Dokumentacja
- 🧪 Zwiększenie coverage

### Niski Priorytet
- 💄 Style improvements
- ♻️ Refactoring (bez nowej funkcjonalności)
- 🧹 Cleanup

---

## 📞 Kontakt

- **Issues:** https://github.com/dawidkawalec/sitespector/issues
- **Discussions:** https://github.com/dawidkawalec/sitespector/discussions
- **Email:** kontakt@sitespector.app

---

**Dziękujemy za wkład w SiteSpector! 🚀**

