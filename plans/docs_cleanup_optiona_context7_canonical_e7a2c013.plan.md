---
name: docs_cleanup_optionA_context7_canonical
overview: "Uporządkowanie dokumentacji: `.context7/` jako canonical dla wszystkiego (w tym marketingu w wydzielonej sekcji), `docs/` jako publiczny wycinek bez technikaliów. Usunięcie duplikatów, artefaktów po KiloCode oraz pilne usunięcie sekretów/credentiali z repo i ujednolicenie zasad pracy w Cursor."
todos:
  - id: security-sanitize-rotate
    content: Usunąć sekrety/credentials z dokumentacji w repo + zaplanować rotację ujawnionych kluczy.
    status: completed
  - id: context7-index-public-section
    content: Dodać indeks `.context7/INDEX.md` i wydzielić `.context7/public/` na canonical marketing/LP/pricing.
    status: completed
  - id: migrate-docs-to-context7
    content: Przenieść/scalić techniczne pliki z `docs/` do `.context7/` i odchudzić `docs/` do publicznych materiałów.
    status: completed
  - id: normalize-context7-project
    content: Ujednolicić `.context7/project/*` (OVERVIEW/ARCHITECTURE/STACK/DEPLOYMENT) pod aktualny stan i Cursor-only.
    status: completed
  - id: cleanup-cursor-rules
    content: Uprościć `.cursor/rules/global.mdc` i doprowadzić `user-preferences.md` do zgodności z zasadami repo; usunąć credentiale.
    status: completed
  - id: remove-kilocode-artifacts
    content: Usunąć lub zarchiwizować `.kilocode/` (artefakty po migracji).
    status: completed
  - id: standardize-plans-archive
    content: "Ustalić jeden standard dla planów: `plans/` aktywne, `.archive/` historyczne; przenieść materiały z `.cursor/plans/`."
    status: in_progress
  - id: final-audit-no-secrets
    content: Końcowy audyt repo pod kątem sekretów i duplikatów + poprawki linkowania (README/agents/docs index).
    status: pending
isProject: false
---

# Porządek w dokumentacji (Opcja A: canonical w `.context7/`)

## Cel i zasady

- **Canonical**: cała wiedza o projekcie (techniczna + marketingowa) ma żyć w `.context7/`.
- `**docs/**`: zostaje jako **publiczny wycinek** dla agentów (marketing, LP/pricing copy, FAQ, onboarding w 5 minut), **bez szczegółów technicznych** i bez sekretów.
- **Cursor**: repo i zasady są pod Cursor (KiloCode traktujemy jako artefakt historyczny do archiwizacji/usunięcia).

## Krytyczne ryzyko (SECURITY) — do zrobienia jako pierwsze

W repo są wprost **sekrety/credentials w dokumentach** (np. `.context7/project/DEPLOYMENT.md` zawiera realne wartości zmiennych, a część plików zawiera dane logowania testowego). To oznacza wyciek w gicie.

### Akcje bezpieczeństwa (kolejność)

- **Usunąć sekrety z plików w repo** (zastąpić placeholderami i wskazać, że prawdziwe wartości są na VPS w `/opt/sitespector/.env`).
- **Zrotować** wszystkie ujawnione wartości po stronie usług (minimum: JWT/sekrety aplikacji, Gemini key, ScreamingFrog licencja, ewent. Supabase/Stripe jeśli kiedykolwiek wpadły do gita).
- **Ocena ryzyka historii gita**:
  - jeśli repo jest **publiczne / współdzielone szeroko**: rozważyć rewrite historii (np. `git filter-repo`) + force-push na zdalnym.
  - jeśli repo jest **prywatne**: i tak rotacja jest konieczna, a rewrite historii jest opcjonalne (mniejsza presja operacyjna).

## Docelowa struktura

### `.context7/` (canonical)

- Zostaje obecny podział (`project/`, `backend/`, `frontend/`, `infrastructure/`, `decisions/`).
- Dodajemy wydzieloną sekcję na public/marketing bez “śmiecenia” technikaliów:
  - `**.context7/public/**`
    - `OVERVIEW_PUBLIC.md` (krótki opis produktu, pozycjonowanie)
    - `LANDING_COPY.md` (sekcje LP, claimy, hero, CTA, trust)
    - `PRICING_COPY.md` (plany, limity, USP, FAQ do pricingu)
    - `FAQ_PUBLIC.md` (FAQ pod marketing / sprzedaż)

### `docs/` (publiczny wycinek)

- `docs/README.md` jako indeks.
- Docelowo 3–6 plików **tylko marketingowych** (mogą być skrótami treści z `.context7/public/`).
- Żadnych: deploymentów, checklist testów, opisów architektury, endpointów, workerów.

### Root

- `README.md`: skrócony, bez workflow technicznego i bez credentiali; linkuje do `docs/README.md` i `.context7/project/OVERVIEW.md`.
- `agents.md`: minimalny “entrypoint” (scan‑friendly) z zasadami: gdzie jest canonical, jak zaczynać taski, jakie są twarde reguły (Cursor, Context7-first, no secrets). Zero duplikacji treści — tylko linki.

## Migracja/porządki — mapowanie istniejących plików

### 1) Przenieść/scalać treść z `docs/` do `.context7/`

- `[docs/00-STARTUP-PROMPT.md](docs/00-STARTUP-PROMPT.md)` → przenieść do `.context7/project/AGENT_STARTUP.md` i zaktualizować (Cursor, aktualne daty, bez rozjazdów).
- `[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)` → scalić do `[.context7/project/DEPLOYMENT.md](.context7/project/DEPLOYMENT.md)` jako **workflow bez sekretów**.
- `[docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)` → przenieść do `.context7/project/TESTING.md` (lub `QUALITY.md`).
- `[docs/ADMIN_UPGRADE_USER_TO_PRO.md](docs/ADMIN_UPGRADE_USER_TO_PRO.md)` → przenieść do `.context7/project/OPERATIONS.md` (sekcja “Admin runbooks”).
- `[docs/SAAS_TRANSFORMATION_SUMMARY.md](docs/SAAS_TRANSFORMATION_SUMMARY.md)` → przenieść do `.context7/project/HISTORY.md` (historyczne, ale canonical w kontekście).
- `[docs/DOCS_UPDATE_SUMMARY.md](docs/DOCS_UPDATE_SUMMARY.md)` → wchłonąć do `.context7/decisions/DECISIONS_LOG.md` (jako wpis “docs reorg”), a sam plik docelowo usunąć.

Po migracji `docs/` zostaje “odchudzone” do marketingu i indeksu.

### 2) Ujednolicić `.context7/project/*` (spójność)

- `[.context7/project/OVERVIEW.md](.context7/project/OVERVIEW.md)`:
  - usunąć/wyjaśnić wątek “migrated to KiloCode” (albo przenieść do `HISTORY.md`).
  - usunąć wszelkie credentials (test user/hasła).
- `[.context7/project/ARCHITECTURE.md](.context7/project/ARCHITECTURE.md)` i `[.context7/project/STACK.md](.context7/project/STACK.md)`:
  - zaktualizować do aktualnego stanu (domena/Let’s Encrypt, Supabase auth, dual‑DB, brak JWT jeśli już nieaktualne).
  - ujednolicić “Last Updated” i nazewnictwo.
- `[.context7/project/DEPLOYMENT.md](.context7/project/DEPLOYMENT.md)`:
  - usunąć realne wartości zmiennych i zastąpić je przykładowymi placeholderami.

### 3) Cursor rules: skrócić i odduplikować

- `[.cursor/rules/global.mdc](.cursor/rules/global.mdc)`:
  - skrócić do: workflow (Context7-first, update after), git policy (no auto-push), bezpieczeństwo (no secrets), link do indeksu `.context7`.
  - usunąć dane logowania i inne wrażliwe rzeczy.
- `[.cursor/rules/user-preferences.md](.cursor/rules/user-preferences.md)`:
  - zostawić jako preferencje, ale usunąć “Auto-commit YES” jeśli kłóci się z bieżącymi zasadami w tym repo (u Ciebie teraz: commit tylko na komendę “commituj”).

### 4) Usunąć/wyczyścić artefakty po KiloCode

- `[.kilocode/rules/project.md](.kilocode/rules/project.md)` wygląda na artefakt/uszkodzony plik; jeśli nieużywany:
  - przenieść do `.archive/` lub usunąć.
- `[.kilocode/mcp.json](.kilocode/mcp.json)`:
  - jeśli Cursor ma własną konfigurację MCP i to nie jest używane → archiwizacja/usunięcie.

### 5) Plany i archiwum: jeden standard

- `plans/` traktować jako miejsce na aktywne plany.
- `.archive/` zostaje jako historyczne (nie jest “dokumentacją operacyjną”).
- Plany z `.cursor/plans/`:
  - przenieść do `plans/` (aktywnie używane) albo do `.archive/old-plans/` (historyczne).
  - docelowo uniknąć trzymania “dokumentacji” w `.cursor/` poza rules.

## Checklist wykonania (kolejność prac)

1. Security: sanitizacja dokumentów + rotacja sekretów.
2. Stworzenie indeksu w `.context7/`:
  - `.context7/INDEX.md` (linki do wszystkich sekcji + “gdzie co jest”).
3. Migracja treści z `docs/` → `.context7/` + odchudzenie `docs/` do marketingu.
4. Ujednolicenie `.context7/project/*` (ARCHITECTURE/STACK/DEPLOYMENT/OVERVIEW).
5. Uporządkowanie `.cursor/rules/*` pod Cursor + bez credentiali.
6. Usunięcie/archiwizacja `.kilocode/`.
7. Standard dla planów (`plans/` + `.archive/`).
8. Finalny przegląd: brak duplikatów, brak sekretów, spójne linkowanie z root.

## Weryfikacja (Definition of Done)

- `docs/` zawiera wyłącznie publiczny/marketingowy wycinek.
- `.context7/` zawiera canonical dla: projektu, deploy, testów, operacji admina, architektury, API.
- Brak haseł/kluczy/tokenów w repo (również w `.context7`, `.cursor/rules`, `README.md`).
- `agents.md` istnieje i prowadzi do właściwych indeksów.
- `.kilocode/` nie wprowadza zamieszania (usunięte albo jasno zarchiwizowane).

## Uwagi

- W trakcie sprzątania będę **przenosił treść** (merge), a nie tylko usuwał pliki, żeby nie utracić wiedzy.
- Każde usunięcie pliku będzie poprzedzone potwierdzeniem, że jego treść jest w `.context7/` albo jest zbędna/historii w `.archive/`.

