# 🚀 SZYBKI START - Instrukcja Instalacji SiteSpector Docs

**Czas instalacji**: ~15 minut  
**Data**: 2025-02-02  
**Język**: Polski (kod i docs w EN)

---

## 📦 CO POBIERASZ

Folder `sitespector-docs-final/` zawiera 11 plików:

```
sitespector-docs-final/
│
├── .cursorrules                    ← Główne zasady projektu
│
├── .cursor/
│   └── rules/
│       └── user-preferences.md     ← Twoje osobiste preferencje
│
├── .context7/                      ← Dokumentacja Context7 (pamięć AI)
│   ├── project/
│   │   ├── OVERVIEW.md            ← Przegląd projektu
│   │   └── ARCHITECTURE.md        ← Architektura (7 kontenerów)
│   ├── frontend/
│   │   └── MISSING_FEATURES.md    ← TODO lista (3 funkcje do zrobienia)
│   ├── backend/                   ← (puste, wypełnisz podczas pracy)
│   ├── infrastructure/            ← (puste, wypełnisz podczas pracy)
│   └── decisions/                 ← (puste, wypełnisz podczas pracy)
│
├── docs/
│   ├── 00-STARTUP-PROMPT.md       ← Inicjalizacja AI (skopiuj do Claude)
│   ├── CONTEXT7_SETUP.md          ← Instrukcja instalacji Context7
│   ├── CONTEXT7_UPDATE_WORKFLOW.md ← JAK aktualizować Context7 (WAŻNE!)
│   └── README.md                  ← Kompletny przewodnik
│
├── INSTALLATION_CHECKLIST.md      ← Krok po kroku (po angielsku)
├── PACKAGE_SUMMARY.txt            ← Podsumowanie pakietu
└── INSTRUKCJA_INSTALACJI_PL.md    ← TEN PLIK (po polsku)
```

---

## ⚡ INSTALACJA - 5 KROKÓW

### KROK 1: Skopiuj Pliki do Projektu

Otwórz Terminal (macOS):

```bash
# 1. Przejdź do pobranego folderu
cd ~/Downloads/sitespector-docs-final

# 2. Przejdź do projektu SiteSpector
cd "/Users/dawid/Desktop/projekty nowe/sitespector"

# 3. Skopiuj wszystkie pliki
cp ~/Downloads/sitespector-docs-final/.cursorrules .
cp -r ~/Downloads/sitespector-docs-final/.cursor .
cp -r ~/Downloads/sitespector-docs-final/.context7 .
cp -r ~/Downloads/sitespector-docs-final/docs .

# 4. Zweryfikuj, że pliki zostały skopiowane
ls -la .cursorrules
ls -la .cursor/rules/user-preferences.md
ls -la .context7/project/
ls -la docs/
```

**✅ Powinieneś zobaczyć**: Wszystkie pliki w odpowiednich lokalizacjach

---

### KROK 2: Zainstaluj Context7 MCP

```bash
# 1. Zainstaluj Context7 globalnie (wymaga Node.js)
npm install -g @context7/mcp-server

# 2. Zweryfikuj instalację
context7 --version
# Powinno pokazać: @context7/mcp-server v1.x.x (lub podobne)
```

**❌ Jeśli "npm: command not found"**:
```bash
# Zainstaluj Node.js przez Homebrew
brew install node

# Potem ponów instalację Context7
npm install -g @context7/mcp-server
```

---

### KROK 3: Skonfiguruj Cursor dla Context7

**Opcja A: Konfiguracja Globalna (ZALECANE)**

```bash
# 1. Otwórz lub stwórz plik konfiguracyjny
nano ~/.cursor/mcp.json

# 2. Wklej poniższą zawartość:
```

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7",
      "args": ["server"],
      "env": {
        "CONTEXT7_ROOT": "${HOME}/.context7"
      }
    }
  }
}
```

```bash
# 3. Zapisz plik (Ctrl+O, Enter, Ctrl+X)

# 4. Zweryfikuj, że plik został utworzony
cat ~/.cursor/mcp.json
```

**Opcja B: Konfiguracja dla Pojedynczego Projektu**

```bash
# W katalogu projektu SiteSpector
nano .cursor/mcp.json

# Wklej:
```

```json
{
  "mcpServers": {
    "context7": {
      "command": "context7",
      "args": ["server"],
      "env": {
        "CONTEXT7_ROOT": "${workspaceFolder}/.context7"
      }
    }
  }
}
```

---

### KROK 4: Zrestartuj Cursor

1. **Zamknij Cursor CAŁKOWICIE** (Cmd+Q)
2. **Otwórz Cursor ponownie**
3. **Otwórz projekt SiteSpector**

---

### KROK 5: Przetestuj Context7

**W Cursor**, otwórz nowy chat i napisz:

```
query-docs project overview
```

**✅ Jeśli działa**: Claude użyje narzędzia `query-docs` i odpowie informacjami o projekcie

**❌ Jeśli nie działa**:
1. Sprawdź Cursor Settings → MCP Servers
2. Poszukaj "context7" na liście
3. Kliknij "View Logs" aby zobaczyć błędy
4. Najczęstszy problem: błąd składni JSON w mcp.json (użyj JSONLint.com do sprawdzenia)

---

## 🎯 CO DALEJ - PIERWSZE UŻYCIE

### 1. Zainicjalizuj AI Agenta

**WAŻNE**: Za każdym razem gdy rozpoczynasz nową sesję w Cursor:

```bash
# 1. Otwórz plik
open docs/00-STARTUP-PROMPT.md

# 2. Zaznacz CAŁY plik (Cmd+A)
# 3. Skopiuj (Cmd+C)
# 4. W Cursor chat, wklej (Cmd+V)
# 5. Wyślij do Claude
```

**✅ Claude odpowie**: "Rozumiem, pracuję teraz nad SiteSpector..." i będzie miał pełny kontekst projektu.

---

### 2. Przetestuj Context7 Query

W Cursor chat:

```
query-docs missing frontend features
```

Claude powinien odpowiedzieć szczegółami o 3 brakujących funkcjach renderowania.

---

### 3. Commituj Dokumentację do Git

```bash
cd "/Users/dawid/Desktop/projekty nowe/sitespector"

# Sprawdź co się zmieniło
git status

# Dodaj wszystkie pliki dokumentacji
git add .cursorrules .cursor/ .context7/ docs/

# Commituj
git commit -m "docs: add complete documentation framework with Context7

- Main project rules (.cursorrules)
- User preferences (.cursor/rules/user-preferences.md)
- Context7 MCP documentation (.context7/)
- Startup prompt and guides (docs/)
- Context7 update workflow guide"

# NIE PUSHUJ jeszcze - agent zapyta Cię o to później
```

---

## 📚 PRZECZYTAJ TE PLIKI (PO INSTALACJI)

### 1. **docs/CONTEXT7_UPDATE_WORKFLOW.md** ⭐ KLUCZOWE
```bash
open docs/CONTEXT7_UPDATE_WORKFLOW.md
```

**Dlaczego ważne**: To jest KOMPLETNY przewodnik:
- KIEDY aktualizować Context7
- JAK pisać update'y
- KTÓRE pliki aktualizować
- 10-krokowy workflow (od kodu do deployment)
- Przykłady dobre vs złe

**Przeczytaj to PRZED rozpoczęciem kodowania!**

---

### 2. **docs/README.md** - Kompletny Przewodnik
```bash
open docs/README.md
```

**Co zawiera**:
- Jak używać wszystkich plików
- Daily workflow
- Maintenance tasks
- Troubleshooting

---

### 3. **.cursorrules** - Zasady Projektu
```bash
open .cursorrules
```

**Co zawiera**:
- VPS-only workflow (bez lokalnego Dockera)
- Git rules (auto-commit YES, auto-push ASK)
- Tech stack (FastAPI, Next.js, PostgreSQL)
- Current priorities

---

## 🎨 JAK PRACOWAĆ Z TYM FRAMEWORKIEM

### Codzienny Workflow:

```
1. Otwórz Cursor w projekcie SiteSpector

2. Zainicjalizuj agenta (skopiuj docs/00-STARTUP-PROMPT.md do chatu)

3. Zapytaj Claude o zadanie:
   "Implement renderSeoResults function"

4. Claude:
   - Query Context7 (sprawdzi co już istnieje)
   - Zaimplementuje funkcję
   - Auto-commit kodu
   - UPDATE CONTEXT7 (automatycznie!)
   - Commit Context7 updates
   - Zapyta: "Ready to push to origin/release?"

5. Ty: "Yes" lub "No, let me review first"

6. Deploy na VPS:
   ssh root@77.42.79.46
   cd /opt/sitespector
   git pull origin release
   docker compose -f docker-compose.prod.yml build --no-cache frontend
   docker compose -f docker-compose.prod.yml up -d frontend

7. Test: https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df
```

---

## 🔑 KLUCZOWE ZASADY

### ✅ DO (Always):

1. **Query Context7 PRZED implementacją**
   ```
   query-docs "missing features"
   query-docs "API endpoints"
   query-docs "worker process"
   ```

2. **Update Context7 PO implementacji** (OBOWIĄZKOWE!)
   ```
   update-docs ".context7/frontend/MISSING_FEATURES.md" "✅ Completed: renderSeoResults"
   ```

3. **Commit Context7 osobno od kodu**
   ```bash
   git commit -m "feat: implement feature"
   git commit -m "docs: update Context7 after feature"
   ```

### ❌ NIE (Never):

1. **Auto-push bez pytania**
   - Agent ZAWSZE musi zapytać przed `git push`
   
2. **Skipować update Context7**
   - Każda implementacja = aktualizacja docs

3. **Próbować uruchomić Docker lokalnie**
   - Wszystko tylko na VPS (77.42.79.46)

---

## 🧪 TESTOWANIE SETUP

### Test 1: Context7 Działa
```
W Cursor chat: query-docs "project overview"
✅ Powinien: Użyć narzędzia query-docs i odpowiedzieć o projekcie
❌ Jeśli nie: Sprawdź ~/.cursor/mcp.json i restartuj Cursor
```

### Test 2: Agent Ma Kontekst
```
W Cursor chat: Wklej cały docs/00-STARTUP-PROMPT.md
✅ Powinien: Odpowiedzieć "Rozumiem kontekst projektu SiteSpector..."
```

### Test 3: Agent Zna Priorytety
```
W Cursor chat: "What should I implement first?"
✅ Powinien: Odpowiedzieć o 3 funkcjach renderowania (Priority 1)
```

### Test 4: Git Workflow Działa
```
W Cursor chat: "Make a small change and commit"
Agent: [robi commit]
Agent: "Ready to push?" ← Musi zapytać!
```

---

## 🆘 TROUBLESHOOTING

### Problem: "context7: command not found"

**Rozwiązanie**:
```bash
which context7  # Sprawdź czy zainstalowane
npm install -g @context7/mcp-server  # Reinstaluj
context7 --version  # Zweryfikuj
```

---

### Problem: Context7 nie działa w Cursor

**Rozwiązanie**:
1. Sprawdź `~/.cursor/mcp.json` istnieje
2. Zweryfikuj składnię JSON (JSONLint.com)
3. Zrestartuj Cursor **całkowicie** (Cmd+Q)
4. Cursor Settings → MCP Servers → context7 → View Logs

---

### Problem: Zmiany frontend nie widoczne po deploy

**Rozwiązanie**:
```bash
# Frontend WYMAGA rebuildu (nie tylko restart!)
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Zweryfikuj
docker logs sitespector-frontend --tail 50
```

---

### Problem: Agent nie aktualizuje Context7

**Rozwiązanie**:
```
W Cursor chat: "Did you update Context7 after implementing?"
Przypomnij: "Please update .context7/frontend/MISSING_FEATURES.md"
```

**Długoterminowe**: Przeczytaj `docs/CONTEXT7_UPDATE_WORKFLOW.md` i wyjaśnij agentowi workflow.

---

## 📞 GDZIE SZUKAĆ POMOCY

| Problem | Plik |
|---------|------|
| Instalacja Context7 | `docs/CONTEXT7_SETUP.md` |
| Jak aktualizować Context7 | `docs/CONTEXT7_UPDATE_WORKFLOW.md` ⭐ |
| Przegląd projektu | `.context7/project/OVERVIEW.md` |
| Co jest do zrobienia | `.context7/frontend/MISSING_FEATURES.md` |
| Zasady projektu | `.cursorrules` |
| Workflow development | `docs/README.md` |
| Agent initialization | `docs/00-STARTUP-PROMPT.md` |

---

## ✅ CHECKLIST INSTALACJI

Po zakończeniu, sprawdź:

- [ ] Pliki skopiowane do projektu SiteSpector
- [ ] Context7 MCP zainstalowany (`context7 --version`)
- [ ] Cursor skonfigurowany (`~/.cursor/mcp.json`)
- [ ] Cursor zrestartowany
- [ ] Context7 działa (`query-docs project overview`)
- [ ] Dokumentacja commitnięta do Git
- [ ] Przeczytane: `docs/CONTEXT7_UPDATE_WORKFLOW.md` ⭐
- [ ] Przeczytane: `docs/README.md`
- [ ] Agent zainicjalizowany (`docs/00-STARTUP-PROMPT.md`)
- [ ] Test: Agent zna priorytety projektu

---

## 🚀 GOTOWE! CO TERAZ?

### Dzisiaj:
1. ✅ Instalacja zakończona
2. 📖 Przeczytaj `docs/CONTEXT7_UPDATE_WORKFLOW.md` (15 min)
3. 📖 Przeczytaj `.context7/project/OVERVIEW.md` (10 min)
4. 🎯 Zrozum priorytety: `.context7/frontend/MISSING_FEATURES.md`

### Ten Tydzień:
5. 🔴 **Priority 1**: Implementuj 3 funkcje renderowania
   - `renderSeoResults()`
   - `renderPerformanceResults()`
   - `renderContentResults()`
   
6. 🧪 Testuj z audytem: `85d6ee6f-8c55-4c98-abd8-60dedfafa9df`

7. 📝 Aktualizuj Context7 po każdej funkcji

### Na Bieżąco:
- Query Context7 przed implementacją
- Update Context7 po implementacji
- Commit regularnie (docs + kod)
- Deploy na VPS i testuj

---

## 💡 PROTIP

**Context7 to Twoja pamięć projektu**. Im lepiej ją utrzymujesz, tym:
- Mniej musisz pamiętać
- Szybciej agent rozumie kontekst
- Łatwiej wrócić do projektu po przerwie
- Więcej czasu na kodowanie, mniej na wyjaśnianie

**Invest 2 minutes after each feature → Save hours later**

---

**Powodzenia!** 🚀

---

**Ostatnia aktualizacja**: 2025-02-02  
**Wersja**: 1.1 (dodano Context7 Update Workflow)  
**Język**: Polski (instrukcje), English (kod i docs)  
**Czas instalacji**: ~15 minut  
**Autor**: Dokumentacja wygenerowana przez Claude Sonnet 4.5
