# SiteSpector - Bugs & Fixes Log

## Overview

This document tracks bugs found, their fixes, and known issues in SiteSpector.

---

## Resolved Bugs

### BUG-072: Brak szybkich akcji rerun i narzedzi audytu w AI Readiness/Architecture

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: MEDIUM

**Description**:
- Uzytkownik nie mial jasnej sciezki "co dalej" przy widokach `ai-readiness` i `architecture`.
- Dla przypadku `link_graph=0` brakowalo lokalnych CTA do rerunu analizy i planu.
- Sidebar audytu nie eksponowal stron diagnostycznych (`crawl-data`, `debug`), przez co utrudnial obsluge incydentow.

**Root cause**:
- Brak warstwy operacyjnej UX (status + akcje) na poziomie poszczegolnych modulow.
- Brak dedykowanej grupy narzedzi audytu w nawigacji bocznej.

**Fix**:
- Frontend:
  - `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`:
    - dodano panel `Stan i szybkie akcje`,
    - podlaczono `run-ai-context(area=ai_readiness)` i `run-execution-plan`,
    - dodano CTA do projektu na pelny rerun (nowy audyt).
  - `frontend/app/(app)/audits/[id]/architecture/page.tsx`:
    - dodano panel `Stan i szybkie akcje`,
    - podlaczono `run-ai-context(area=architecture)` i `run-execution-plan`,
    - dodano kontekstowe CTA przy pustym `link_graph`.
  - `frontend/components/layout/AuditSidebar.tsx`:
    - dodano sekcje `Ustawienia audytu` (`crawl-data`, `debug`).

**Verification**:
- `npm run lint -- --file app/(app)/audits/[id]/ai-readiness/page.tsx --file app/(app)/audits/[id]/architecture/page.tsx --file components/layout/AuditSidebar.tsx`: ✅.
- `ReadLints` dla zmienionych plikow frontend: ✅ brak nowych bledow.

**Related**:
- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`
- `frontend/app/(app)/audits/[id]/architecture/page.tsx`
- `frontend/components/layout/AuditSidebar.tsx`

---

### BUG-071: Brak 3-trybowego workflow dla AI Readiness/Architecture + pusty widok grafu Architecture

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- `ai-readiness` i `architecture` byly niespojne z glownymi modulami audytu - brakowalo trybow `Analiza` i `Plan`.
- `architecture` mogla wyswietlac pusty obszar bez bledow runtime, co utrudnialo diagnoze.
- Dla istniejacych audytow brakowalo latwej regeneracji nowych contextow AI per-module.

**Root cause**:
- Brak dedykowanych contextow AI (`ai_contexts.ai_readiness`, `ai_contexts.architecture`) oraz generatorow taskow (`module=ai_readiness`, `module=architecture`) w pipeline.
- `POST /run-ai-context` mial nieaktualne `valid_areas`.
- Pomiar kontenera force-graph byl inicjalizowany zbyt wczesnie i mogl zostawic `graphSize.width=0`.

**Fix**:
- Frontend:
  - `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`:
    - dodano `ModeSwitcher` + flow `Dane/Analiza/Plan`,
    - `AnalysisView` oparty o `results.ai_contexts.ai_readiness`,
    - `TaskListView` oparty o `module=ai_readiness`.
  - `frontend/app/(app)/audits/[id]/architecture/page.tsx`:
    - dodano `ModeSwitcher` + flow `Dane/Analiza/Plan`,
    - `AnalysisView` oparty o `results.ai_contexts.architecture`,
    - `TaskListView` oparty o `module=architecture`,
    - hardening renderu grafu: poprawiony lifecycle `ResizeObserver`, fallback `width=0`, czytelne empty-state.
- Backend:
  - `backend/app/services/ai_analysis.py`:
    - dodano `analyze_ai_readiness_context()` i `analyze_architecture_context()`.
  - `backend/app/services/ai_execution_plan.py`:
    - dodano `generate_ai_readiness_tasks()` i `generate_architecture_tasks()`.
  - `backend/worker.py`:
    - podlaczono nowe contexty i task generation do pipeline.
  - `backend/app/routers/audits.py`:
    - rozszerzono `run-ai-context` o: `schema`, `content_quality`, `ai_readiness`, `architecture`.

**Verification**:
- `npm run lint -- --file app/(app)/audits/[id]/ai-readiness/page.tsx --file app/(app)/audits/[id]/architecture/page.tsx`: ✅.
- `python3 -m py_compile backend/app/services/ai_analysis.py backend/app/services/ai_execution_plan.py backend/worker.py backend/app/routers/audits.py`: ✅.
- `ReadLints` dla zmienionych plikow: ✅ brak nowych bledow.

**Related**:
- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`
- `frontend/app/(app)/audits/[id]/architecture/page.tsx`
- `backend/app/services/ai_analysis.py`
- `backend/app/services/ai_execution_plan.py`
- `backend/worker.py`
- `backend/app/routers/audits.py`

---

### BUG-070: AI Readiness crash + brak 3-trybowego workflow dla Schema/Content Quality

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- `/audits/[id]/ai-readiness` potrafil losowo crashowac na produkcji (React #310 + fallback na browser navigation).
- `schema` i `content-quality` byly niespojne z kluczowymi modulami audytu (`seo`, `links`, `images`) - brakowalo trybow `Analiza` i `Plan`.
- Plan wykonania nie mial dedykowanych taskow backendowych dla tych dwoch obszarow.

**Root cause**:
- Naruszona kolejnosc hookow w `ai-readiness` (hook po warunkowych `return`).
- Brak dedykowanych contextow AI (`ai_contexts.schema`, `ai_contexts.content_quality`) i generatorow taskow (`module=schema`, `module=content_quality`) w pipeline.
- Link z topbara do `/` wykonywal SPA nawigacje miedzy dwiema aplikacjami Next (frontend vs landing), co moglo powodowac bledy RSC/chunk.

**Fix**:
- Frontend:
  - `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`:
    - usunieto warunkowe naruszenie kolejnosci hookow,
    - dodano fallbacki dla brakujacego `results.crawl.ai_readiness`.
  - `frontend/app/(app)/audits/[id]/content-quality/page.tsx`:
    - dodano `ModeSwitcher` i pelny flow `Dane/Analiza/Plan`,
    - `AnalysisView` oparty o `results.ai_contexts.content_quality`,
    - `TaskListView` oparty o `module=content_quality`.
  - `frontend/app/(app)/audits/[id]/schema/page.tsx`:
    - dodano `ModeSwitcher` i pelny flow `Dane/Analiza/Plan`,
    - `AnalysisView` oparty o `results.ai_contexts.schema`,
    - `TaskListView` oparty o `module=schema`.
  - `frontend/components/layout/TopBar.tsx`:
    - zmieniono nawigacje home z `Link` na natywny `<a href="/">` (pelny reload do landingu).
- Backend:
  - `backend/app/services/ai_analysis.py`:
    - dodano `analyze_schema_context()` i `analyze_content_quality_context()`.
  - `backend/app/services/ai_execution_plan.py`:
    - dodano `generate_schema_tasks()` i `generate_content_quality_tasks()`.
  - `backend/worker.py`:
    - podlaczono nowe contexty i task generation do pipeline.

**Verification**:
- `npm run lint -- --file app/(app)/audits/[id]/ai-readiness/page.tsx --file app/(app)/audits/[id]/content-quality/page.tsx --file app/(app)/audits/[id]/schema/page.tsx --file components/layout/TopBar.tsx`: ✅.
- `python3 -m py_compile backend/app/services/ai_analysis.py backend/app/services/ai_execution_plan.py backend/worker.py`: ✅.
- `ReadLints` dla zmienionych plikow: ✅ brak nowych bledow.

**Related**:
- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`
- `frontend/app/(app)/audits/[id]/content-quality/page.tsx`
- `frontend/app/(app)/audits/[id]/schema/page.tsx`
- `backend/app/services/ai_analysis.py`
- `backend/app/services/ai_execution_plan.py`
- `backend/worker.py`

---

### BUG-069: Brak wizualizacji architektury serwisu i czytelnego modułu duplikatów metadanych

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: MEDIUM

**Description**:
- Sekcja `Architektura` pokazywała wyłącznie stack technologiczny, bez realnej mapy połączeń wewnętrznych.
- Duplikaty `Title / Meta Description / H1` były obecne w danych crawla, ale brakowało dedykowanej prezentacji i eksportu.

**Root cause**:
- Brak warstwy wizualizacji wykorzystującej `results.crawl.link_graph` i `results.crawl.all_pages`.
- Brak dedykowanego taba pod duplikaty metadanych na stronie `content-quality`.

**Fix**:
- Frontend:
  - `frontend/app/(app)/audits/[id]/architecture/page.tsx`:
    - dodano tab `Mapa serwisu` z interaktywnym force graph (`react-force-graph-2d`),
    - dodano statystyki, panel filtrów, panel szczegółów noda, tryb focus połączeń i zabezpieczenia wydajnościowe.
  - `frontend/app/(app)/audits/[id]/content-quality/page.tsx`:
    - dodano tab `Duplikaty` (Title/Meta/H1),
    - dodano grupowanie po wartości i eksport CSV per typ.
- Dependency:
  - `frontend/package.json`: dodano `react-force-graph-2d`.

**Verification**:
- `ReadLints` dla zmienionych plików frontendowych: ✅ brak nowych błędów lint.

**Related**:
- `frontend/app/(app)/audits/[id]/architecture/page.tsx`
- `frontend/app/(app)/audits/[id]/content-quality/page.tsx`
- `docs/frontend.md`
- `docs/gap-analysis-report.md`

---

### BUG-068: Brak warstwy ROI dla Fazy 3B (traffic + content quality + porownanie historyczne)

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- Faza 3A dostarczyla nowe KPI techniczne, ale nadal brakowalo:
  - estymacji ruchu organicznego i potencjalu wzrostu,
  - kompozytowego content quality index per URL,
  - porownania historycznego metryk 3A i zmian keywordow miedzy audytami.

**Root cause**:
- `audits.results` nie mial blokow pochodnych dla traffic impact i quality debt.
- UI porownania audytow korzystalo glownie z bazowych score, bez warstwy ROI i keyword delta.

**Fix**:
- Backend:
  - `backend/app/services/health_index.py`:
    - dodano `compute_traffic_estimation()`,
    - dodano `compute_content_quality_index()`.
  - `backend/worker.py`:
    - persistence do `results.traffic_estimation` i `results.content_quality_index`.
- Frontend:
  - `frontend/app/(app)/audits/[id]/comparison/page.tsx`:
    - trend chart 3A + ROI card + tab `Pozycje` (keyword delta).
  - `frontend/app/(app)/audits/[id]/visibility/page.tsx`:
    - tab `Traffic Impact`.
  - `frontend/app/(app)/audits/[id]/page.tsx`:
    - nowe summary cards: `Estimated Traffic` i `Content Quality`.
  - `frontend/app/(app)/audits/[id]/content-quality/page.tsx` (new).
  - `AuditSidebar` + `Breadcrumbs`: dodany route `content-quality`.

**Verification**:
- `ReadLints` dla zmienionych plikow backend/frontend: do weryfikacji po finalnym przebiegu.

**Related**:
- `backend/app/services/health_index.py`
- `backend/worker.py`
- `frontend/app/(app)/audits/[id]/comparison/page.tsx`
- `frontend/app/(app)/audits/[id]/visibility/page.tsx`
- `frontend/app/(app)/audits/[id]/content-quality/page.tsx`
- `docs/gap-analysis-report.md`

---

### BUG-067: Brak szybkich differentiatorow Fazy 3A w produkcie

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- Faza 3A z gap analysis byla zaplanowana, ale brakowalo wdrozenia:
  - composite technical index (THI),
  - visibility momentum (wins/losses),
  - AI readiness checks (robots AI policy + llms.txt),
  - radar performance vs realni konkurenci DB.

**Root cause**:
- Brak warstwy backendowych metryk pochodnych zapisanych w `audits.results`.
- Brak dedykowanego UI dla sygnalow AI search readiness i porownania Lighthouse z konkurentami DB.

**Fix**:
- Backend:
  - `backend/app/services/health_index.py` (new): THI + visibility momentum,
  - `backend/app/services/technical_seo_extras.py`: AI readiness + llms.txt + bot policy checks,
  - `backend/worker.py`: persistence `results.technical_health_index`, `results.visibility_momentum`, `results.crawl.ai_readiness`.
- Frontend:
  - `frontend/app/(app)/audits/[id]/page.tsx`: THI card + momentum card + AI readiness summary card,
  - `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx` (new),
  - `frontend/app/(app)/audits/[id]/competitors/page.tsx`: competitive Lighthouse radar,
  - `frontend/components/layout/AuditSidebar.tsx` + `Breadcrumbs.tsx`: route exposure.

**Verification**:
- `ReadLints` for changed backend/frontend files: ✅ no lint errors.
- `python3 -m py_compile backend/app/services/health_index.py backend/app/services/technical_seo_extras.py backend/worker.py`: ✅.

**Related**:
- `docs/gap-analysis-report.md`
- `backend/app/services/health_index.py`
- `backend/app/services/technical_seo_extras.py`
- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx`

---

### BUG-066: Tier 2 insights byly nieosiagalne (brak danych i brak wizualizacji)

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- Gap analysis Tier 2 wskazal brak kluczowych insights mimo dostepnych lub latwo dostepnych danych:
  - brak `crawl_depth`, `text_ratio`, pixel widths, multi-tag i `Occurrences` w payloadzie crawla,
  - brak `interactive`, `total-byte-weight`, `dom-size`, `bootup-time` jako named fields Lighthouse,
  - brak frontendowych analiz: quick wins, orphan pages, inlink/depth distribution, cannibalization URL pairs, TLD/anchor types, CWV gap.

**Root cause**:
- Backend transformacje SF/LH nie mapowaly wszystkich dostepnych pol i tabow.
- Frontend nie mial warstwy agregacji derived insights nad pelnym `audits.results`.

**Fix**:
- Backend:
  - `backend/app/services/screaming_frog.py` (nowe kolumny, multi-tag flags, occurrences, external links, link_graph, agregaty depth/duplicates),
  - `docker/screaming-frog/crawl.sh` (`External:All`, `Links:All`),
  - `backend/app/services/lighthouse.py` (named fields + `audit_refs` per kategoria).
- Frontend:
  - `performance/page.tsx`: grouped opportunities/diagnostics + `CWVGapAnalysis`,
  - `seo/page.tsx`: tab `Quick Wins`,
  - `links/page.tsx`: taby `Orphan Pages` i `Dystrybucja`, TLD + anchor type classification,
  - `visibility/page.tsx`: summary + URL-pair grouping dla kanibalizacji,
  - `AuditCharts.tsx`: `InternalLinkDistributionChart`, `CrawlDepthDistributionChart`.

**Verification**:
- `ReadLints` dla wszystkich zmienionych plikow: ✅ brak bledow.
- Wszystkie to-do Fazy 2 (`t1`-`t12`) oznaczone jako `completed`.

**Related**:
- `docs/gap-analysis-report.md`
- `frontend/app/(app)/audits/[id]/*`
- `backend/app/services/screaming_frog.py`
- `backend/app/services/lighthouse.py`

---

### BUG-065: Hardcoded warm hover shade i brak ikonki powrotu przy logo

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: LOW

**Description**:
- Navigation hover/open states opierały się na ręcznie dobranym odcieniu, co utrudniało utrzymanie spójności systemowej.
- W topbarze zniknęła ikonka szybkiego powrotu na stronę główną marketingową obok logo.

**Root cause**:
- Kolor był ustawiony utility-level zamiast przez semantyczne tokeny.
- W trakcie iteracji topbara usunięto dodatkową akcję powrotu przy logo.

**Fix**:
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`
  - przejście z hardcoded warm shade na token-based `bg-muted/*` w light mode.
- `frontend/components/layout/TopBar.tsx`
  - dodana ikonka `ArrowUpLeft` obok logo prowadząca do `/` z tooltipem `Strona glowna`.

**Verification**:
- `next lint -- --file "components/layout/NavItem.tsx" --file "components/layout/NavSection.tsx" --file "components/layout/TopBar.tsx" --file "components/layout/Breadcrumbs.tsx" --file "components/layout/UserMenu.tsx"`: ✅.
- `ReadLints` dla tych plikow: ✅ brak bledow.

**Related**:
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`
- `frontend/components/layout/TopBar.tsx`

---

### BUG-064: Niespójna czytelność breadcrumbs i brak nazwy użytkownika w triggerze

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: LOW

**Description**:
- W breadcrumbs etykiety (szczególnie w kontekście projektów) były optycznie za małe i niespójne.
- W prawym górnym triggerze menu użytkownika był sam avatar, mimo dostępnego miejsca na nazwę.

**Root cause**:
- Breadcrumb links/spans miały zbyt małą i bardzo subtelną typografię.
- Trigger `UserMenu` nie wykorzystywał `full_name` poza zawartością popovera.

**Fix**:
- `frontend/components/layout/Breadcrumbs.tsx`:
  - ujednolicony `font-size` dla wszystkich crumbów.
- `frontend/components/layout/UserMenu.tsx`:
  - dodany desktopowy label z nazwą użytkownika obok avatara,
  - fallback: `full_name` -> `email` -> `Uzytkownik`.

**Verification**:
- `next lint -- --file "components/layout/Breadcrumbs.tsx" --file "components/layout/UserMenu.tsx"`: ✅.
- `ReadLints` dla tych plikow: ✅ brak bledow.

**Related**:
- `frontend/components/layout/Breadcrumbs.tsx`
- `frontend/components/layout/UserMenu.tsx`

---

### BUG-063: Light mode sidebary miały zbyt chłodną tonację względem tła aplikacji

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: LOW

**Description**:
- Nawigacja w light mode miała wyraźnie chłodne odcienie (slate), które nie pasowały do ciepłego złamanego białego tła aplikacji.
- Efekt był szczególnie widoczny przy porównaniu sekcji ustawień i audytów.

**Root cause**:
- Po unifikacji struktury sidebara pozostała jeszcze stara, chłodna paleta dla light mode.

**Fix**:
- Przestawiono light-mode palette na ciepłe neutralne odcienie (warm off-white / stone / amber accents) w:
  - `frontend/components/layout/AuditSidebar.tsx`
  - `frontend/components/layout/ProjectSidebar.tsx`
  - `frontend/app/(app)/settings/layout.tsx`
  - `frontend/components/layout/NavItem.tsx`
  - `frontend/components/layout/NavSection.tsx`
  - `frontend/components/layout/MobileMenu.tsx`
- Dark mode pozostawiono bez zmian.

**Verification**:
- `next lint -- --file "app/(app)/settings/layout.tsx" --file "components/layout/AuditSidebar.tsx" --file "components/layout/ProjectSidebar.tsx" --file "components/layout/NavItem.tsx" --file "components/layout/NavSection.tsx" --file "components/layout/MobileMenu.tsx"`: ✅.
- `ReadLints` dla tych plikow: ✅ brak bledow.

**Related**:
- `frontend/app/(app)/settings/layout.tsx`
- `frontend/components/layout/AuditSidebar.tsx`
- `frontend/components/layout/ProjectSidebar.tsx`
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`
- `frontend/components/layout/MobileMenu.tsx`

---

### BUG-062: Sidebar ustawien nie byl spojny z sidebarami audytu/projektu

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: MEDIUM

**Description**:
- Settings navigation renderowala sie jako zaokraglona karta z odstepem od lewej krawedzi.
- Audit/Project navigation byly przyklejone do lewej jako pelne rails.
- W efekcie dwa glówne konteksty nawigacji wygladaly jak dwa rózne systemy.

**Root cause**:
- Settings layout uzyl lokalnego "card-style" kontenera zamiast wspólnego shella sidebara.
- Sidebary kontekstowe mialy twardo zakodowany ciemny wyglad bez parytetu light mode.

**Fix**:
- `frontend/app/(app)/settings/layout.tsx`:
  - przebudowa na ten sam model raila 292px, przyklejony do lewej.
- `frontend/components/layout/AuditSidebar.tsx`
- `frontend/components/layout/ProjectSidebar.tsx`
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`
  - ujednolicenie styli i mikrointerakcji,
  - dodanie jawnego splitu light/dark (jasny rail dla light mode, obecny ciemny rail dla dark mode).

**Verification**:
- `next lint -- --file "app/(app)/settings/layout.tsx" --file "components/layout/AuditSidebar.tsx" --file "components/layout/ProjectSidebar.tsx" --file "components/layout/NavItem.tsx" --file "components/layout/NavSection.tsx"`: ✅.
- `ReadLints` dla tych plikow: ✅ brak bledow.

**Related**:
- `frontend/app/(app)/settings/layout.tsx`
- `frontend/components/layout/AuditSidebar.tsx`
- `frontend/components/layout/ProjectSidebar.tsx`
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`

---

### BUG-061: Workspace dropdown miał błędny kontrast hover/selected

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: MEDIUM

**Description**:
- W menu wyboru workspace pojawiał się stan z jasnym tłem i białym tekstem, przez co opcje były słabo czytelne.
- Dodatkowo audytowy select utrzymywał inny (zielonkawy) kolor tła niż reszta nowej nawigacji.

**Root cause**:
- Stylowanie opierało się na niestandardowym selektorze `data-[selected]`, podczas gdy faktyczny stan w `cmdk` jest sterowany przez `aria-selected`.
- Audit select content nie został jeszcze podciągnięty do wspólnej palety po redesignie.

**Fix**:
- `frontend/components/WorkspaceSwitcher.tsx`:
  - przejście na klasy `aria-selected:*` dla itemów,
  - zachowanie spójnego accent checkmarka.
- `frontend/components/layout/AuditSidebar.tsx`:
  - tło dropdownu selecta zmienione na neutralne ciemne (`bg-slate-900`),
  - dopasowanie stanu zaznaczenia do accent.

**Verification**:
- `next lint --file components/WorkspaceSwitcher.tsx --file components/layout/AuditSidebar.tsx`: ✅.
- `ReadLints`: ✅ brak błędów.

**Related**:
- `frontend/components/WorkspaceSwitcher.tsx`
- `frontend/components/layout/AuditSidebar.tsx`

---

### BUG-060: Niespójna kolorystyka nawigacji i brzydki hover w switcherze workspace

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: MEDIUM

**Description**:
- Po wdrożeniu nowej nawigacji część elementów miała zbyt zielony ton względem reszty UI.
- Hover/selected state w dropdownie workspace wyglądał agresywnie i niespójnie.
- Sidebar ustawień wizualnie odbiegał od sidebarów projektu/audytu.

**Root cause**:
- Redesign struktury nawigacji został dostarczony wcześniej niż finalna unifikacja kolorów i stanów interakcji dla wszystkich kontekstów.

**Fix**:
- Ujednolicono paletę:
  - sidebary kontekstowe + mobile sheet -> neutralny ciemny gradient (bez zielonego tonu),
  - aktywne stany topbara/user menu -> accent-first.
- Poprawiono workspace switcher:
  - łagodniejsze `hover` i `selected`,
  - spójne kolory checkmarków i item states.
- Przebudowano wygląd settings sidebar do tego samego systemu, co project/audit sidebar.

**Verification**:
- `next lint --file ...` dla zmienionych komponentów: ✅ bez warningów i błędów.
- `ReadLints`: ✅ brak błędów.

**Related**:
- `frontend/components/WorkspaceSwitcher.tsx`
- `frontend/components/layout/TopBar.tsx`
- `frontend/components/layout/AuditSidebar.tsx`
- `frontend/components/layout/ProjectSidebar.tsx`
- `frontend/components/layout/MobileMenu.tsx`
- `frontend/app/(app)/settings/layout.tsx`

---

### BUG-059: Nawigacja po redesignie miala nierowne mikrointerakcje i niespojna gestosc

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: MEDIUM

**Description**:
- Po przejsciu na TopBar + context sidebars glowne flow dzialalo poprawnie, ale interakcje byly nierowne:
  - top bar mial zbyt luzna gestosc,
  - workspace switcher zachowal ciemny styl pochodzacy ze starego sidebara,
  - aktywne/hover/focus stany nie byly w pelni spojne miedzy desktop i mobile.

**Root cause**:
- Redesign IA skupil sie najpierw na strukturze nawigacji; mikrointerakcje i finalny polish nie byly jeszcze ujednolicone.

**Fix**:
- Dopracowano:
  - top bar density, sticky behavior i stany aktywne,
  - nav primitives (`NavItem`, `NavSection`) pod katem animacji i focus states,
  - sidebary projektu/audytu i settings nav pod katem spacingu i feedbacku,
  - mobile menu pod katem route-aware aktywnych stanow,
  - workspace switcher do lekkiego stylu top bara.

**Verification**:
- `next lint --file ...` dla zmienionych plikow nawigacji: ✅ bez warningow i bledow.
- `ReadLints` dla tych samych plikow: ✅ brak bledow.

**Related**:
- `frontend/components/layout/TopBar.tsx`
- `frontend/components/WorkspaceSwitcher.tsx`
- `frontend/components/layout/NavItem.tsx`
- `frontend/components/layout/NavSection.tsx`
- `frontend/components/layout/MobileMenu.tsx`

---

### BUG-058: Monolityczna nawigacja byla przeciazona i nieintuicyjna

**Reported**: 2026-03-07

**Status**: ✅ FIXED (2026-03-07)

**Severity**: HIGH

**Description**:
- Jedna kolumna nawigacyjna laczyla globalne i lokalne konteksty (workspace, projekty, audyty, ustawienia, konto), co powodowalo przeciazenie.
- Dla tras audytu menu zawieralo bardzo duza liczbe pozycji i zagniezdzen, przez co znalezienie sekcji bylo wolne i mylace.

**Root cause**:
- Architektura oparta o `UnifiedSidebar` agregowala wszystkie potrzeby IA w jeden komponent zamiast rozdzielic globalna i kontekstowa nawigacje.

**Fix**:
- Wprowadzono nowy model:
  - globalny `TopBar` (dashboard/projekty, breadcrumbs, workspace switcher, user menu),
  - kontekstowy `ProjectSidebar` dla `/projects/[projectId]/*`,
  - kontekstowy `AuditSidebar` dla `/audits/[id]/*`,
  - `MobileMenu` z sekcjami zaleznymi od aktualnej trasy.
- Ustawienia otrzymaly osobny lokalny sidebar w `settings/layout.tsx`.
- Usunieto legacy komponenty:
  - `frontend/components/layout/UnifiedSidebar.tsx`
  - `frontend/components/layout/MobileSidebar.tsx`

**Verification**:
- `next lint --file ...` dla zmienionych plikow nawigacji: ✅ bez warningow i bledow.
- `ReadLints` dla zmienionych plikow: ✅ brak bledow.

**Related**:
- `frontend/app/(app)/layout.tsx`
- `frontend/components/layout/TopBar.tsx`
- `frontend/components/layout/AuditSidebar.tsx`
- `frontend/components/layout/ProjectSidebar.tsx`
- `frontend/components/layout/MobileMenu.tsx`
- `frontend/app/(app)/settings/layout.tsx`

---

### BUG-057: Niespójne i nieaktualne ceny w UI (landing + app)

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: HIGH

**Description**:
- W warstwie user-facing były rozproszone ceny i nazwy planów (landing + app), mimo braku finalnie zatwierdzonego cennika.
- Użytkownicy mogli trafić na nieaktualne kwoty i komunikaty upsellowe.

**Root cause**:
- Ceny były hardkodowane w wielu komponentach i podstronach marketingowych/aplikacyjnych.
- Brak jednolitego trybu "placeholder pricing" przed publikacją finalnej oferty.

**Fix**:
- Wdrożono UI-only placeholder "Wkrótce / Skontaktuj się z nami" dla głównych powierzchni cennikowych:
  - landing komponenty i podstrony cennikowe,
  - etykiety cennika w topbar/footer/sitemap page,
  - app: `/pricing`, `/settings/billing`, komunikaty limitów w `NewAuditDialog`.
- Pozostawiono backend billing bez zmian (świadoma decyzja zakresu).

**Files Changed (high level)**:
- `landing/src/component/Pricing.tsx`
- `landing/src/component/Faq.tsx`
- `landing/src/component/Cta.tsx`
- `landing/src/app/cennik/page.tsx`
- `landing/src/app/page.tsx`
- `landing/src/app/o-nas/page.tsx`
- `landing/src/app/porownanie/PorownanieClient.tsx`
- `landing/src/app/dla-freelancerow/page.tsx`
- `landing/src/app/dla-agencji-seo/page.tsx`
- `landing/src/component/layout/Topbar/page.tsx`
- `landing/src/component/layout/Footer/page.tsx`
- `landing/src/app/sitemap/page.tsx`
- `frontend/app/(app)/pricing/page.tsx`
- `frontend/app/(app)/settings/billing/page.tsx`
- `frontend/components/NewAuditDialog.tsx`

**Follow-up (second pass, 2026-03-06):**
- Rozszerzono cleanup na pozostałe powierzchnie marketingowe (dodatkowe podstrony/CTA/meta + wybrane treści markdown renderowane na stronach).
- Ujednolicono komunikaty do wariantu "oferta w przygotowaniu / kontakt", bez ekspozycji konkretnych kwot.
- Dodano centralny token copy dla placeholdera: `landing/src/lib/offerPlaceholder.ts`.

---

### BUG-055: Footer PDF nie trzymał stałego układu lewo/prawo

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: MEDIUM

**Description**:
- W stopce audytu logo i tekst kontaktowy nie były stabilnie rozdzielone (nakładanie/zbicie do lewej strony).

**Root cause**:
- Jeden wspólny running element (`footer-brand`) oparty o flex nie gwarantował poprawnego rozłożenia we wszystkich renderach WeasyPrint.

**Fix**:
- Rozdzielono stopkę na osobne running elements:
  - `footer-brand` -> tylko logo na `@bottom-left`,
  - `footer-text` -> tylko domena + email na `@bottom-right`.
- Numerację stron przeniesiono do `@bottom-center`, aby nie konkurowała z blokiem kontaktowym.

**Files Changed**:
- `backend/templates/pdf/base.html`
- `backend/app/services/pdf/styles.py`

---

### BUG-054: Stopka PDF i logo na ciemnym tle były mało czytelne

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: MEDIUM

**Description**:
- Po rolloutcie nowego logotypu SVG stopka PDF renderowała brand zbyt mało (mikro rozmiar).
- W UI mobilnym/logo na ciemnych tłach (sidebar, mobile header, stopki) wyglądało nieczytelnie.

**Root cause**:
- Zbyt agresywne rozmiary klas `running-footer-logo-image` w CSS PDF.
- Brak kontrastowego kontenera dla pełnego logotypu (czarna typografia) na ciemnych tłach.

**Fix**:
- PDF:
  - zwiększono rozmiar logotypu w running footer,
  - poprawiono spacing i `white-space` dla tekstu kontaktowego.
- UI:
  - dodano jasne, zaokrąglone tło pod logotypem w newralgicznych miejscach na ciemnym tle:
    - `frontend/components/layout/PublicFooter.tsx`
    - `frontend/components/layout/UnifiedSidebar.tsx`
    - `frontend/app/(app)/layout.tsx` (mobile header)
    - `landing/src/component/layout/Footer/page.tsx`

**Files Changed**:
- `backend/app/services/pdf/styles.py`
- `frontend/components/layout/PublicFooter.tsx`
- `frontend/components/layout/UnifiedSidebar.tsx`
- `frontend/app/(app)/layout.tsx`
- `landing/src/component/layout/Footer/page.tsx`

---

### BUG-056: Cykliczne błędy System Status i spam requestów w UI

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: HIGH

**Description**:
- W sidebarze i panelu admina pojawiały się regularne błędy endpointów statusowych (`/api/system/status`, `/api/admin/system`), co powodowało stały spam w konsoli/network.
- Widget dashboardowy statusu używał osobnego, surowego `fetch`, przez co zachowanie auth było niespójne względem reszty aplikacji.

**Root cause**:
- Ryzykowna implementacja dual-auth w `verify_admin_or_user` (manualne wywołanie dependency auth) mogła prowadzić do niestabilnego zachowania ścieżki Bearer.
- Polling statusu był stały (30s) bez sensownego backoffu na błędzie, co przy awarii wzmacniało lawinę requestów.
- Brak ujednolicenia klienta API dla wszystkich widoków System Status.

**Fix**:
- Backend:
  - `backend/app/main.py`: refactor `verify_admin_or_user` na poprawne użycie `HTTPBearer(auto_error=False)` + delegacja do `get_current_user(request, credentials, x_impersonation_token)`.
  - Dodany bezpieczny fallback do `401` dla nieoczekiwanych wyjątków ścieżki Bearer.
- Frontend:
  - `frontend/components/SystemStatus.tsx`: przejście z raw `fetch` na `systemAPI.getStatus()` (wspólny auth path).
  - `frontend/components/layout/UnifiedSidebar.tsx`: polling backoff `30s -> 120s` przy błędzie, `retry: 1`.
  - `frontend/app/(app)/admin/system/page.tsx`: polling backoff `30s -> 120s` przy błędzie, `retry: 1`.

**Verification**:
- Lint frontend (zmienione pliki): ✅ bez błędów.
- `python3 -m py_compile backend/app/main.py`: ✅.
- Smoke check produkcji:
  - `GET /health` -> `200`
  - `GET /api/system/status` bez auth -> `401` z poprawnym komunikatem.

**Files Changed**:
- `backend/app/main.py`
- `frontend/components/SystemStatus.tsx`
- `frontend/components/layout/UnifiedSidebar.tsx`
- `frontend/app/(app)/admin/system/page.tsx`

---

### BUG-053: Niespójny branding logo między UI/PDF/landing (ikona + osobny napis)

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: MEDIUM

**Description**:
- Logo było renderowane różnie w zależności od miejsca:
  - app/landing używały mieszanki `RiSearchEyeFill + SiteSpector`,
  - PDF używał osobnych fallbacków (ikona + tekst),
  - schema.org wskazywało na icon-only asset zamiast pełnego logotypu.

**Root cause**:
- Brak single source of truth dla assetu brandowego i kilka niezależnych implementacji logo.

**Fix**:
- Wprowadzono wspólny asset `sitespector_logo_transp.svg` dla frontend, landing i PDF.
- Podmieniono wszystkie renderowania logo w newralgicznych miejscach UI/PDF na pełny logotyp SVG.
- W PDF usunięto fallback `ikona + tekst`, zastępując go stałym logotypem.
- W schema.org (landing) zaktualizowano `Organization.logo`/`publisher.logo` do nowego SVG.
- Zachowano strategię icon-only dla favicon/app-icon.

**Files Changed (high level)**:
- `frontend/components/brand/SiteSpectorLogo.tsx`
- `frontend/components/layout/*`
- `frontend/app/(public)/*` + `frontend/app/(app)/layout.tsx`
- `frontend/app/(app)/audits/[id]/client-report/page.tsx`
- `landing/src/component/layout/*`
- `landing/src/app/login/page.tsx`
- `landing/src/lib/schema.ts`
- `backend/templates/pdf/base.html`
- `backend/templates/pdf/sections/cover.html`
- `backend/app/services/pdf/styles.py`
- `backend/app/services/pdf/generator.py`

---

### BUG-050: Schema.org i sekcje referencyjne były niepełne w raportach Executive/Standard

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: HIGH

**Description**:
- Schema.org było widoczne głównie w raporcie pełnym, bez odpowiedniej ekspozycji w Executive/Standard.
- Raport techniczny nie pokrywał wprost kilku obszarów referencyjnych: render bez JS, soft404, semantyka HTML, directives/hreflang.
- Część konkurencyjna zawierała metryki bez legendy i bez wystarczająco prostego kontekstu biznesowego.

**Root cause**:
- Ograniczona konfiguracja `ReportTypeConfig` (wyłączone sekcje `structured_data` i `robots_sitemap` dla `executive`/`standard`).
- Zbyt wąska warstwa danych w `technical_seo_extras.py` i brak dedykowanych sekcji PDF dla nowych sygnałów technicznych.
- Template'y konkurencji skupione na tabelach liczbowych bez explicite "co to znaczy dla klienta".

**Fix**:
- Wprowadzono model `structured_data_v2` z parsowaniem `@graph`, priorytetami i AI/SEO readiness.
- Dodano pola crawl: `render_nojs`, `soft_404`, `directives_hreflang` i rozszerzono `semantic_html`.
- Przebudowano część techniczną PDF do układu Schema-first i dodano sekcje:
  - Render/no-JS,
  - Soft404 + low content,
  - Semantic HTML,
  - Directives/hreflang/nofollow.
- Uzupełniono legendy metryk konkurencji i biznesowe kroki "dla laika".
- Frontend otrzymał stronę `/audits/[id]/schema` + wpis w sidebarze + zaktualizowane opisy typów PDF.

**Files Changed (high level)**:
- `backend/app/services/technical_seo_extras.py`
- `backend/app/services/screaming_frog.py`
- `backend/worker.py`
- `backend/app/services/pdf/*` + `backend/templates/pdf/sections/*`
- `backend/app/services/ai_analysis.py`
- `frontend/app/(app)/audits/[id]/schema/page.tsx`
- `frontend/app/(app)/audits/[id]/pdf/page.tsx`
- `frontend/components/layout/UnifiedSidebar.tsx`

---

### BUG-051: Full PDF gubił sekcję Appendix Keywords przy zagnieżdżonym payloadzie Senuto

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: MEDIUM

**Description**:
- Podczas generowania raportu `full` sekcja `appendix_keywords` potrafiła się nie renderować.
- W logu generatora pojawiał się błąd: `'dict object' has no attribute 'position'`.

**Root cause**:
- `appendix_keywords.py` zakładał płaską strukturę danych (`position`, `search_volume`, `intent`) w każdym rekordzie.
- W praktyce część danych Senuto była zagnieżdżona pod `statistics.*`.

**Fix**:
- Znormalizowano rekordy słów kluczowych przed sortowaniem/renderem:
  - fallbacki do `statistics.position/searches/difficulty/cpc/url`,
  - standaryzacja pól do jednego kontraktu template (`keyword`, `position`, `search_volume`, `intent`, `difficulty`, `cpc`, `url`).

**Files Changed**:
- `backend/app/services/pdf/sections/appendix_keywords.py`

---

### BUG-044: Brak wejścia w audit klienta "jak klient" dla supportu

**Reported**: 2026-03-05

**Status**: ✅ FIXED (2026-03-05)

**Severity**: HIGH

**Description**:
- Super admin miał globalną listę audytów, ale nie mógł wejść w standardową ścieżkę klienta (`/audits/[id]`) dla cudzego audytu.
- Utrudniało to diagnostykę problemów zgłaszanych przez klientów.

**Root cause**:
- ACL audit-scoped endpointów była oparta o membership/workspace/project użytkownika z JWT.
- Brakowało kontrolowanego mechanizmu impersonacji o ograniczonym zakresie.

**Fix**:
- Dodano endpoint sesji impersonacji: `POST /api/admin/impersonation/sessions`.
- Dodano walidację `X-Impersonation-Token` i deny-by-default allowlistę w `auth_supabase.py`.
- Scope sesji: pojedynczy `audit_id`; dozwolone tylko `GET audit/status/pdf/raw`.
- Frontend:
  - start impersonacji z listy admin audytów,
  - globalny banner aktywnej sesji + akcja wyjścia,
  - chat i sidebar ukryte podczas impersonacji.

**Verification**:
- Super admin może wejść w `/audits/[id]` i pobrać PDF/RAW dla scoped audytu.
- `/api/chat/*` oraz mutacje (`POST/PATCH/DELETE`) zwracają `403` podczas aktywnej sesji.
- Próba dostępu do innego `audit_id` niż w tokenie zwraca `403`.

**Related**: `backend/app/routers/admin.py`, `backend/app/auth_supabase.py`, `frontend/lib/impersonation.ts`, `frontend/lib/api.ts`, `frontend/app/(app)/admin/audits/page.tsx`, `frontend/app/(app)/layout.tsx`

---

### BUG-019: Niespójny ACL na endpointach audit-scoped

**Reported**: 2026-03-05

**Status**: ✅ FIXED (2026-03-05)

**Severity**: HIGH

**Description**:
- Część endpointów operujących na `audit_id` weryfikowała tylko membership workspace, bez dodatkowego checku `project_id`.
- Skutkiem był potencjalny bypass project-level ACL przez alternatywne endpointy (np. status/raw/tasks), mimo braku dostępu do projektu.

**Root cause**:
- Powielona logika autoryzacji w wielu endpointach (`audits.py`, `tasks.py`) dryfowała i była niespójna.

**Fix**:
- Dodano wspólny helper `get_audit_with_access(...)` w `backend/app/services/audit_access.py`.
- Podłączono helper do endpointów audit-scoped w:
  - `backend/app/routers/audits.py`
  - `backend/app/routers/tasks.py`
- Polityka: workspace membership + project access (gdy `project_id` istnieje) + legacy owner fallback.
- Dodatkowo dodano read-only endpoint adminowy `GET /api/admin/audits/{audit_id}` i UI inspectora adminowego bez mutacji.

**Verification**:
- Non-admin bez dostępu do projektu otrzymuje `403` na endpointach audit-scoped.
- Super admin ma dedykowany, read-only podgląd audytu przez `/api/admin/audits/{id}`.

**Related**: `backend/app/services/audit_access.py`, `backend/app/routers/audits.py`, `backend/app/routers/tasks.py`, `backend/app/routers/admin.py`, `frontend/app/(app)/admin/audits/[auditId]/page.tsx`

---

### BUG-013: Chat messages disappear after sending (race condition)

**Reported**: 2026-02-25

**Status**: ✅ FIXED (2026-02-25)

**Severity**: HIGH

**Description**:
After sending a chat message, the message would appear (optimistic update) then immediately vanish. Reloading or navigating away and back would restore the messages.

**Root cause**:
Race condition in `ChatPanel.tsx`. When `sendMessage()` called `createNewConversation()` then `setActiveConversation(newId)`, the `useEffect` watching `activeConversationId` fired **before** optimistic messages were appended. It fetched the conversation from server (0 messages, brand new) and called `setMessages()` — replacing the empty array and overwriting the optimistic messages that were added a few ms later.

**Fix** (`frontend/components/chat/ChatPanel.tsx`):
1. Added `sendingConvoIdRef = useRef<string | null>(null)`.
2. Set `sendingConvoIdRef.current = convoId` **before** calling `appendMessage()` (optimistic).
3. In the load-on-switch `useEffect`: skip fetch if `sendingConvoIdRef.current === activeConversationId`.
4. Double-check ref inside `.then()` callback before calling `setMessages`.
5. Only call `setMessages` if server returned non-empty array (guards against empty-response overwrite).
6. Clear `sendingConvoIdRef.current = null` in both `onDone` and `onError`.

---

### BUG-006: Alembic migration failed due to duplicate ENUM type

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: HIGH

**Description**:
- `alembic upgrade head` failed on production with:
  - `asyncpg.exceptions.DuplicateObjectError: type "taskpriority" already exists`
- Migration `20260214_add_audit_tasks_table.py` introduced Postgres enums `taskpriority` / `taskstatus` and `audit_tasks` table.

**Root cause**:
- Migration created enum types manually via `CREATE TYPE ...`.
- During `op.create_table()`, SQLAlchemy attempted to create the same enum type again for the enum columns, causing a duplicate type error.

**Fix**:
- Update migration to:
  - create enums idempotently with `checkfirst=True`
  - set `create_type=False` to prevent SQLAlchemy auto-creating enum types on table create

**Verification**:
- Re-run `docker exec sitespector-backend alembic upgrade head` successfully on VPS.

**Related**: `backend/alembic/versions/20260214_add_audit_tasks_table.py`

---

### BUG-007: 502 Bad Gateway after backend recreate (nginx upstream stale)

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: MEDIUM

**Description**:
- After deploying and recreating `backend`, `/health` and `/api/*` intermittently returned `502 Bad Gateway`.
- Nginx error log showed `connect() failed (111: Connection refused) while connecting to upstream`.

**Root cause**:
- Nginx resolved the `backend` upstream to an old Docker IP (container got recreated with a new IP).
- Nginx kept the stale resolved address until restart/reload.

**Fix**:
```bash
cd /opt/sitespector
docker compose -f docker-compose.prod.yml restart nginx
```

**Related**: `.context7/project/OPERATIONS.md` (Troubleshooting section)

---

### BUG-008: Execution plan tasks failed to persist (ENUM value mismatch)

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: CRITICAL

**Description**:
- Phase 3 (execution plan) started, but tasks were not saved; UI "Plan" stayed empty/blocked.
- Worker logs showed DB error:
  - `invalid input value for enum taskpriority: "CRITICAL"`

**Root cause**:
- Postgres ENUM types `taskpriority` / `taskstatus` were created with lowercase values:
  - `critical|high|medium|low` and `pending|done`
- SQLAlchemy `Enum(TaskPriority)` / `Enum(TaskStatus)` persisted enum *names* (`CRITICAL`, `PENDING`) instead of enum *values*.

**Fix**:
- Update `AuditTask.priority` and `AuditTask.status` columns to persist `.value`:
  - `values_callable=[e.value for e in enum]` and `name='taskpriority'/'taskstatus'`
- Add normalization + `rollback()` in `run_execution_plan()` error handling.

**Verification**:
- Re-run Phase 3: `execution_plan_status=completed` and tasks inserted into `audit_tasks`.

**Related**: `backend/app/models.py`, `backend/worker.py`

---

### BUG-001: Frontend Rendering Functions Missing

**Reported**: 2025-01-15

**Status**: ✅ FIXED (2025-02-03)

**Severity**: CRITICAL

**Description**:
- Three rendering functions called but not implemented in `frontend/app/audits/[id]/page.tsx`
- Users could not see detailed audit data despite it being in database
- Only 4 scores displayed (overall, SEO, performance, content)

**Functions missing**:
1. `renderSeoResults(results)`
2. `renderPerformanceResults(results)`
3. `renderContentResults(results)`

**Root cause**:
- Documentation outdated (claimed functions missing)
- Functions were actually implemented (lines 166-304)

**Fix**:
- Verified functions exist and work correctly
- Updated documentation to reflect current state

**Impact**: HIGH - Users now see all audit details

**Related**: OVERVIEW.md, MISSING_FEATURES.md

---

### BUG-002: UUID Type Error in Frontend

**Reported**: 2024-12-18

**Status**: ✅ FIXED (2024-12-18)

**Severity**: HIGH

**Description**:
- TypeScript error: `UUID` type from `crypto` module incompatible with API response
- Backend returns UUID as string (JSON serialization)
- Frontend tried to use UUID type from Node.js

**Error message**:
```
Type 'string' is not assignable to type 'UUID'
```

**Root cause**:
- Backend SQLAlchemy UUID type serializes to string via JSON
- Frontend incorrectly assumed UUID would be UUID object

**Fix**:
```typescript
// ❌ WRONG
interface Audit {
  id: UUID  // Node.js UUID type
}

// ✅ CORRECT
interface Audit {
  id: string  // UUID comes as string from API
}
```

**Prevention**: Document in API.md and global rules

**Related**: frontend/lib/api.ts

---

### BUG-003: Worker Timeout Not Enforced

**Reported**: 2024-12-22

**Status**: ✅ FIXED (2024-12-23)

**Severity**: MEDIUM

**Description**:
- Worker marked audits as PROCESSING but never marked as FAILED if timeout
- Audits stuck in PROCESSING state forever
- Database filled with "zombie" processing audits

**Root cause**:
- Timeout check logic existed but had bug in datetime comparison
- Used `datetime.now()` instead of `datetime.utcnow()`

**Fix**:
```python
# ❌ WRONG
timeout_threshold = datetime.now() - timedelta(minutes=10)

# ✅ CORRECT
timeout_threshold = datetime.utcnow() - timedelta(minutes=10)
```

**Verification**: Manual test with slow audit (forced timeout)

**Related**: backend/worker.py

---

### BUG-004: CORS Error on PDF Download

**Reported**: 2024-12-28

**Status**: ✅ FIXED (2024-12-29)

**Severity**: MEDIUM

**Description**:
- Browser blocked PDF download with CORS error
- Backend returned PDF but didn't include CORS headers for FileResponse

**Error message**:
```
Access to fetch at '...' from origin 'https://<OLD_VPS_IP>' has been blocked by CORS policy
```

**Root cause**:
- FastAPI CORS middleware applies to JSON responses only
- FileResponse needs manual CORS headers

**Fix**:
```python
# In backend/app/routers/audits.py
response = FileResponse(
    path=pdf_path,
    filename=f"audit_{audit_id}.pdf",
    media_type="application/pdf"
)

# Add CORS headers manually
response.headers["Access-Control-Allow-Origin"] = "*"
response.headers["Access-Control-Allow-Credentials"] = "true"

return response
```

**Related**: backend/app/routers/audits.py, same fix for raw data endpoint

---

### BUG-005: Screaming Frog License Error

**Reported**: 2024-12-30

**Status**: ✅ FIXED (2024-12-30)

**Severity**: HIGH

**Description**:
- Screaming Frog returned license error despite valid credentials
- All crawls failed with "License required" message

**Error message**:
```
ScreamingFrogSEOSpider requires a licence to run in CLI mode
```

**Root cause**:
- License command not executed before crawl
- Worker called crawl.sh directly without activating license

**Fix**:
```python
# In backend/app/services/screaming_frog.py
# Run license command first
license_cmd = [
    "docker", "exec", "sitespector-screaming-frog",
    "ScreamingFrogSEOSpider",
    "--license",
    settings.SCREAMING_FROG_USER,
    settings.SCREAMING_FROG_KEY
]

proc_lic = await asyncio.create_subprocess_exec(*license_cmd, ...)
await proc_lic.communicate()

# Then run crawl
crawl_cmd = [...]
```

**Fallback**: If license fails, use HTTP crawler

**Related**: backend/app/services/screaming_frog.py

---

### BUG-006: Frontend Polling Not Stopping

**Reported**: 2025-01-08

**Status**: ✅ FIXED (2025-01-08)

**Severity**: LOW

**Description**:
- React Query continued polling even after audit completed
- Unnecessary API calls (every 5 seconds forever)

**Root cause**:
- `refetchInterval` condition didn't check for `completed` status properly

**Fix**:
```typescript
// ❌ WRONG
refetchInterval: audit?.status === 'processing' ? 5000 : false

// ✅ CORRECT
refetchInterval: (query) => {
  const data = query?.state?.data as Audit | undefined
  if (data?.status === 'processing' || data?.status === 'pending') {
    return 5000
  }
  return false  // Stop polling
}
```

**Related**: frontend/app/audits/[id]/page.tsx

---

### BUG-007: Audit Pipeline Hangs

**Reported**: 2026-02-08

**Status**: ✅ FIXED (2026-02-08)

**Severity**: CRITICAL

**Description**:
- Audits would hang indefinitely in PROCESSING state.
- No timeouts on Docker exec calls (Screaming Frog/Lighthouse).
- Synchronous Gemini API calls blocked the worker event loop.
- Invalid model name caused excessive retries.

**Fix**:
- Added `asyncio.wait_for()` timeouts to all subprocess calls.
- Implemented **Two-Phase Audit** (Technical + AI) for faster feedback.
- Used `asyncio.to_thread()` for Gemini API calls.
- Added granular `processing_logs` and progress tracking.
- Fixed Gemini model name to `gemini-flash-3-preview`.

**Impact**: CRITICAL - Audits are now reliable, have timeouts, and provide real-time progress feedback.

---

### BUG-008: Frontend Reference Errors & 404s after Deployment

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: HIGH

**Description**:
- `ReferenceError: senutoCountry is not defined` in NewAuditDialog.
- `ReferenceError: Globe is not defined` (inconsistent icon imports).
- `404 Not Found` for API calls due to double `/api/api` prefix.
- System Status services showing "offline" due to missing Docker socket in backend.

**Fix**:
- Added missing `useState` and `useRouter` hooks in `NewAuditDialog.tsx`.
- Standardized icon imports to `Globe2` across all pages.
- Fixed `API_URL` logic in `lib/api.ts` to strip trailing slashes/prefixes.
- Mounted `/var/run/docker.sock` to backend container and added Senuto status check.

**Impact**: HIGH - Frontend is stable, API calls are correct, and system status reflects reality.

---

### BUG-009: Audyty FAIL na kroku crawl:start (missing merge_csvs.py)

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: CRITICAL

**Description**:
- Nowe audyty zatrzymywały się na `crawl:start` ze statusem `FAILED`.
- Błąd z `error_message` w tabeli `audits`:
  - `python3: can't open file '/usr/local/bin/merge_csvs.py': [Errno 2] No such file or directory`
- Dotknięty przypadek: `https://meditrue.pl/`.

**Root cause**:
- Skrypt `crawl.sh` wywołuje `python3 /usr/local/bin/merge_csvs.py`.
- Plik `merge_csvs.py` istniał w repo (`docker/screaming-frog/merge_csvs.py`), ale nie był kopiowany do obrazu w `docker/screaming-frog/Dockerfile`.
- Po czystszych rebuildach kontenerów problem zaczął występować deterministycznie.

**Fix**:
- Dodano kopiowanie pliku do obrazu:
  - `COPY merge_csvs.py /usr/local/bin/merge_csvs.py`
- Dodano jawnie `python3` do listy pakietów instalowanych w kontenerze Screaming Frog.
- Wykonano rebuild i recreate kontenerów na VPS z wymuszeniem odświeżenia:
  - `docker compose build --no-cache screaming-frog frontend`
  - `docker compose up -d --force-recreate screaming-frog frontend worker`

**Impact**: CRITICAL - Audyty ponownie przechodzą etap crawl i nie kończą się natychmiastowym `FAILED` przez brak skryptu merge.

**Related**: `docker/screaming-frog/Dockerfile`, `docker/screaming-frog/crawl.sh`, `docker/screaming-frog/merge_csvs.py`

---

### BUG-010: AI insights puste mimo `ai_status=completed`

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: HIGH

**Description**:
- Audyty kończyły się z `ai_status=completed`, ale `results.ai_contexts.*` zawierały puste listy.
- W `results` brakowało `executive_summary`, `roadmap` i `cross_tool` dla części audytów.
- UI pokazywał głównie `quick_wins`, co wyglądało jak brak działania AI.

**Root cause**:
- Fallback z `ai_client` zwracał payload o strukturze niezgodnej z kontraktem funkcji `analyze_*_context` i `ai_strategy`.
- W efekcie parser zwracał dane bez oczekiwanych kluczy (`key_findings`, `recommendations`, ...), a warstwa mapująca zwracała puste kolekcje.
- Brak czytelnego stanu "AI w toku" w UI utrudniał rozróżnienie między "brak danych" a "analiza trwa".

**Fix**:
- Ujednolicono fallback payload w `backend/app/services/ai_client.py` do wspólnego kontraktu (obszary + strategia).
- Skorygowano nazwę modelu Gemini na `gemini-3-flash-preview`.
- Dodano diagnostyczne logi i checkpointy:
  - `backend/app/services/ai_client.py`
  - `backend/app/services/ai_analysis.py`
  - `backend/worker.py`
- Dodano stany "AI analysis in progress" + polling po `ai_status=processing`:
  - `frontend/app/(app)/audits/[id]/ai-strategy/page.tsx`
  - `frontend/components/AiInsightsPanel.tsx`
  - strony obszarowe z `AuditPageLayout`
  - `frontend/app/(app)/audits/[id]/page.tsx` (polling także dla manualnego run-ai)
- Naprawiono zapisywanie kluczy strategii AI w `audits.results`:
  - `backend/worker.py` wykonuje `audit.results = dict(results)` + `flag_modified(audit, "results")`
  - bez tego SQLAlchemy mogło nie zapisać mutacji JSONB po `ai_contexts` (brak `cross_tool/roadmap/executive_summary` mimo sukcesu kroku).

**Impact**: HIGH - AI insights nie pozostają "cicho puste"; UI jasno komunikuje przetwarzanie i automatycznie odświeża dane.

**Related**: `backend/app/services/ai_client.py`, `backend/app/services/ai_analysis.py`, `backend/worker.py`, `frontend/app/(app)/audits/[id]/ai-strategy/page.tsx`, `frontend/components/AiInsightsPanel.tsx`

---

### BUG-011: Senuto paginated POST payload encoded as form-data

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- Some Senuto paginated endpoints returned incomplete/empty payloads.
- Root cause was inconsistent request encoding for POST pagination requests.

**Root cause**:
- Pagination helper used `data_body` for POST by default.
- Senuto visibility/backlinks paginated endpoints require JSON payload.

**Fix**:
- Added raw request helper + explicit JSON pagination path in `senuto.py`.
- Unified paginated POST calls to send `json_body`.
- Added extended metadata counters to validate payload completeness.

**Impact**:
- Full payloads are now fetched for positions, wins/losses, backlinks, AIO keywords, and sections detail.

**Related**: `backend/app/services/senuto.py`, `backend/worker.py`

---

### BUG-012: React #310 on Visibility page (hook order mismatch)

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- Production visibility route crashed with minified React error `#310`.
- Error appeared after token/session refresh and rerender path changes.

**Root cause**:
- `useMemo` hooks in `visibility/page.tsx` were declared below conditional early returns.
- Initial render path could return before those hooks, later render executed them, causing hook-order mismatch.

**Fix**:
- Moved all derived-state hooks above conditional returns.
- Kept loading/no-data branches after hook declarations.
- Cleaned unused imports introduced in the same module.

**Impact**:
- Visibility page no longer throws React invariant 310 during runtime rerenders.

**Related**: `frontend/app/(app)/audits/[id]/visibility/page.tsx`

---

### BUG-013: React #310 on AI Overviews page + missing favicon.ico

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- `AI Overviews` route crashed in production with React invariant `#310`.
- Browser also reported `GET /favicon.ico 404`.

**Root cause**:
- Same hook-order mismatch pattern as visibility page (conditional return before all memo hooks).
- No static `favicon.ico` file served at root path.

**Fix**:
- Moved loading branch in `ai-overviews/page.tsx` below hook declarations to keep stable hook order.
- Added generated brand-signet style icon file: `frontend/public/favicon.ico`.

**Impact**:
- `AI Overviews` no longer crashes on rerender.
- Browser no longer logs `favicon.ico` 404.

**Related**: `frontend/app/(app)/audits/[id]/ai-overviews/page.tsx`, `frontend/public/favicon.ico`

---

### BUG-014: Quick Wins mismatch vs AI Strategy + inconsistent line chart styling

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: MEDIUM

**Description**:
- Global `Quick Wins` sometimes showed only ~3 generic items, while `AI Strategy` contained many actionable quick wins split by modules.
- Line-chart visuals were inconsistent between dashboard and audit modules.

**Root cause**:
- `results.quick_wins` could remain legacy/fallback and not reflect richer `results.ai_contexts.*.quick_wins`.
- No shared chart preset for line-like charts across modules.

**Fix**:
- Added quick wins aggregator in `ai_analysis` and used it in:
  - worker strategy finalization,
  - `GET /audits/{id}/quick-wins`,
  - `POST /audits/{id}/run-ai-context` full regeneration path.
- Extended AI context prompts (visibility + ai_overviews + cross_tool + roadmap) to include new Senuto fields (AIO, difficulty, CPC, intent, snippets, sections detail).
- Replaced module line charts with dashboard-like gradient style (`AreaChart` + unified tooltip).

**Impact**:
- Quick Wins and AI Strategy now use one canonical, richer backlog.
- New Senuto data is explicitly consumed by AI suggestions.
- Visual analytics are consistent across dashboard and audit modules.

**Related**: `backend/app/services/ai_analysis.py`, `backend/worker.py`, `backend/app/routers/audits.py`, `frontend/components/AuditCharts.tsx`, `frontend/app/(app)/audits/[id]/comparison/page.tsx`

---

## Known Issues

### ISSUE-001: PDF Template Incomplete

**Reported**: 2025-01-20

**Status**: ✅ RESOLVED (2025-02-03)

**Severity**: MEDIUM

**Description**:
- PDF generator works but sections 4-9 were empty

**Fix**: All 8 PDF sections fully implemented with real data, no fallbacks. See `MISSING_FEATURES.md` for details.

**Related**: backend/templates/report.html, backend/app/services/pdf_generator.py

---

### ISSUE-002: Self-signed SSL Certificate Warning

**Reported**: 2024-12-15

**Status**: ✅ RESOLVED (2026-02-08)

**Severity**: LOW

**Description**:
- Browser showed "Your connection is not private" when using IP.

**Solution**: Domain sitespector.app configured with Let's Encrypt. Production uses valid HTTPS at https://sitespector.app. Direct IP access is considered deprecated (IPs change during rebuilds).

**Related**: ADR-006, DECISIONS_LOG (domain migration)

---

### ISSUE-003: No Rate Limiting

**Reported**: 2025-01-25

**Status**: ✅ RESOLVED (2026-02-15)

**Description**:
- Rate limiting implemented in nginx after security hardening (BUG-032).
- 10r/s on `/api/`, 3r/s on `/login` and `/register`.

**Related**: docker/nginx/nginx.conf, BUG-032

---

### ISSUE-004: No Automated Backups

**Reported**: 2025-02-01

**Status**: 🟡 KNOWN LIMITATION

**Severity**: MEDIUM

**Description**:
- No automated database backups
- Data loss risk if VPS fails

**Root cause**:
- Not implemented (MVP phase)
- Manual backups possible via pg_dump

**Solution**: Add cron job for daily backups

**Impact**: Medium (data loss risk)

**Related**: infrastructure/DATABASE.md

---

### BUG-015: VPS Compromise Caused Outbound Abuse Traffic

**Reported**: 2026-02-13

**Status**: ✅ FIXED (mitigated via rebuild)

**Severity**: CRITICAL

**Description**:
- Hetzner abuse report flagged outbound UDP traffic from the production IP.
- VPS became unreachable (ports blocked) during incident response.
- Investigation found a suspicious binary (`/x86_64.kok`) consuming CPU, consistent with a compromised host.

**Root cause**:
- Host-level compromise risk (SSH/password exposure and/or weak baseline hardening).
- Once compromised, attacker-controlled process generated unexpected outbound traffic.

**Fix**:
- Rebuilt infrastructure on a new VPS + new IP (clean host).
- Enforced SSH key authentication and disabled root SSH login.
- Enabled UFW + fail2ban immediately on bootstrap.
- Added an explicit outbound block for UDP/9021 (defense-in-depth).

**Verification**:
- `fail2ban-client status sshd` active, UFW enabled, only 22/80/443 inbound allowed.
- App health responds on the new host (`/health`) and containers are healthy.

**Related**: `project/DEPLOYMENT.md`, `project/OPERATIONS.md`, `infrastructure/NGINX.md`

---

### BUG-016: New Audit 500 (audits.user_id NOT NULL)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Creating a new workspace-based audit returned `500 Internal Server Error`.
- Backend stacktrace showed `NOT NULL` violation: `audits.user_id` was `NULL`.

**Root cause**:
- Workspace-based audits intentionally set `user_id=None`, but the database schema still enforced `audits.user_id NOT NULL`.

**Fix**:
- Make `audits.user_id` nullable.
- Add Alembic migration: `20260214_make_audits_user_id_nullable.py`.

**Verification**:
- Audit creation no longer fails on insert due to `user_id` constraint.

**Related**: `backend/app/routers/audits.py`, `backend/app/models.py`, `backend/alembic/versions/20260214_make_audits_user_id_nullable.py`

---

### BUG-017: Audit Progress Window Stuck at 0% (No Logs)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- During audit run, the UI progress window showed `0%` and empty logs for minutes.
- Worker was processing normally, but frontend had no progress/log data to render.

**Root cause**:
- Frontend polled `GET /api/audits/{id}` (not `/status`) but the response schema did not include:
  - `progress_percent`
  - `processing_logs`
  - `processing_step`
  - `ai_status`
- Additionally, some UI step IDs did not match worker step names (e.g. `ai_perf_tech` vs `ai_parallel`).

**Fix**:
- Extend `AuditResponse` to include progress + processing metadata and enrich `GET /api/audits/{id}` payload.
- Align frontend step IDs with worker log step names.

**Verification**:
- While an audit is `pending/processing`, UI updates progress percent and shows step logs in near real-time (polling every 3s).

**Related**: `backend/app/routers/audits.py`, `backend/app/schemas.py`, `frontend/app/(app)/audits/[id]/page.tsx`, `.context7/backend/API.md`

---

### BUG-018: Sitemap Always Missing + Senuto Backlinks Show 0

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Audit UI showed "Brak sitemapy" even when sitemap existed (e.g. WP RankMath redirects `/sitemap.xml` -> `/sitemap_index.xml`).
- Audit UI showed Senuto backlink stats (Backlinki / Domeny Ref.) as `0` despite Senuto step succeeding and collecting data.

**Root cause**:
- `backend/app/services/screaming_frog.py` hardcoded `has_sitemap=false` and never detected sitemap endpoints.
- Senuto backlinks payload stores raw API response in `senuto.backlinks.statistics`, but frontend expects summary keys like `backlinks_count` and `domains_count`.

**Fix**:
- Add sitemap detection via `robots.txt` + common endpoints and persist `has_sitemap`, `sitemap_url`, `sitemaps` in crawl results.
- Normalize Senuto backlinks statistics by injecting computed `backlinks_count` and `domains_count` based on collected arrays.

**Verification**:
- For domains with `/sitemap_index.xml`, audits now show sitemap present.
- Senuto cards show non-zero backlink/ref-domain counts when data exists.

**Related**: `backend/app/services/screaming_frog.py`, `backend/app/services/senuto.py`, `frontend/app/(app)/audits/[id]/page.tsx`

---

## Future Bugs to Watch

### WATCH-001: Memory Leak in Worker

**Watch for**: Worker memory usage growing over time

**Potential cause**: Not closing database sessions properly

**Monitoring**: `docker stats sitespector-worker`

**Prevention**: Ensure all async sessions use context managers

---

### WATCH-002: Database Connection Exhaustion

**Watch for**: "Too many connections" error

**Potential cause**: Connection pool too small or not releasing connections

**Monitoring**: 
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Prevention**: Verify pool_size and max_overflow settings

---

## Bug Reporting Template

When adding new bugs to this file, use this format:

```markdown
### BUG-XXX: Short Description

**Reported**: YYYY-MM-DD

**Status**: 🔴 OPEN | 🟡 INVESTIGATING | ✅ FIXED

**Severity**: CRITICAL | HIGH | MEDIUM | LOW

**Description**:
- What happened
- Expected vs actual behavior

**Root cause**:
- Why it happened

**Fix** (if resolved):
- Code changes
- Verification

**Workaround** (if open):
- Temporary solution

**Related**: Files/docs affected
```

---

### BUG-015: Frontend bledne sciezki AI context (Security i UX)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: CRITICAL

**Description**:
- Security i UX pages czytaly `audit.results.security` i `audit.results.ux` zamiast `audit.results.ai_contexts.security/ux`
- W trybie "Analiza" wyswietlaly surowe dane Phase 2 zamiast wnioskow AI
- AiInsightsPanel mialo bezposredni dostep do `results.content_analysis` bez null check -> crash gdy results === null

**Root cause**:
- Stare patterny z okresu przed refaktorem 3-Phase System
- Brak walidacji null w fallback functions

**Fix**:
- `frontend/app/(app)/audits/[id]/security/page.tsx`: zmieniono `audit?.results?.security` → `audit?.results?.ai_contexts?.security`
- `frontend/app/(app)/audits/[id]/ux-check/page.tsx`: zmieniono `audit?.results?.ux` → `audit?.results?.ai_contexts?.ux`
- `frontend/components/AiInsightsPanel.tsx`: dodano optional chaining (`results?.content_analysis`) w getFallbackData

**Related**: C1, C2, C6 z comprehensive_system_audit

---

### BUG-016: Brak execution_plan_status w /status endpoint

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: CRITICAL

**Description**:
- GET `/audits/{id}/status` nie zwracal `execution_plan_status` mimo ze frontend oczekiwal tego pola
- Polling w UI nie widzial statusu generowania planu

**Root cause**:
- Pole zostalo dodane do modelu i schema, ale zapomniane w endpoincie `/status`

**Fix**:
- `backend/app/routers/audits.py`: dodano `"execution_plan_status": audit.execution_plan_status` do return dict

**Related**: B3/G1 z comprehensive_system_audit

---

### BUG-017: HTTPS detection w generate_security_tasks

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- `generate_security_tasks()` uzywal `status_code == 200` do okreslenia czy strona ma HTTPS
- Status code nie ma nic wspolnego z protokolem SSL/TLS
- Security taski generowaly bledne zalecenia

**Root cause**:
- Simplified check z komentarzem "# Simplified" ktory byl niepoprawny

**Fix**:
- `backend/app/services/ai_execution_plan.py`: zmieniono `is_https = status_code == 200` → `is_https = url.startswith("https")`

**Related**: A1 z comprehensive_system_audit

---

### BUG-018: Phase 3 uruchamial sie bez Phase 2

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- `run_execution_plan()` (Phase 3) startowal niezaleznie od statusu Phase 2
- Jesli AI Analysis zawiodla, `ai_contexts` byly puste/niekompletne ale plan byl generowany "na bazie niczego"
- Audit z `ai_status="failed"` dostal execution plan ze zdegradowanych danych

**Root cause**:
- Brak warunku sprawdzajacego status Phase 2 przed rozpoczeciem Phase 3

**Fix**:
- `backend/worker.py`: dodano HARD BLOCK przed `run_execution_plan()`:
  - Sprawdza `audit.ai_status != "completed"` → ustawia `execution_plan_status = "blocked"` i loguje
  - Phase 3 nie uruchamia sie jesli Phase 2 nie ma statusu "completed"

**Related**: B1 z comprehensive_system_audit

---

### BUG-019: Brak AI contexts dla Security i UX

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Backend generowal `ai_contexts` dla: seo, performance, visibility, backlinks, links, images, ai_overviews
- Brakowalo: **security** i **ux** -- te moduly nie mialy dedykowanych `analyze_*_context()` funkcji
- Obecne `security` i `ux` w `results` to surowe analizy Phase 2, nie kontekstowe wnioski AI

**Root cause**:
- Podczas budowy 3-Phase System dodano contexty tylko dla kluczowych modulow SEO/Performance/Content
- Security i UX pozostaly z "old school" analizami bez kontekstu

**Fix**:
- `backend/app/services/ai_analysis.py`: dodano `analyze_security_context()` i `analyze_ux_context()`
- `backend/worker.py`: dodano wywolania tych funkcji do `context_tasks` w Phase 2

**Related**: H1 z comprehensive_system_audit

---

### BUG-020: Za male max_tokens w promptach AI

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM

**Description**:
- `max_tokens` wahaly sie od 2048 do 4096 w zaleznosci od funkcji
- Gemini 3 Flash ma okno 1M tokenow -- nie ma powodu oszczedzac
- Niektore odpowiedzi AI byly obcinane (szczegolnie execution plan tasks)

**Root cause**:
- Konserwatywne ustawienia z czasow gdy AI API bylo drogie

**Fix**:
- Ustawiono `max_tokens=20000` we wszystkich wywolaniach AI:
  - `backend/app/services/ai_analysis.py`: `_call_ai_context()`
  - `backend/app/services/ai_execution_plan.py`: wszystkie `generate_*_tasks()` funkcje

**Related**: A4 z comprehensive_system_audit

---

### BUG-021: Brak limitu liczby taskow

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM

**Description**:
- `synthesize_execution_plan()` nie mial gornego limitu -- jesli AI wygeneruje 500 taskow, wszystkie zostana zapisane
- Potencjalnie problemy z performance UI i bazy danych

**Root cause**:
- Brak przemyslenia edge case'ow (np. sklep 70k produktow)

**Fix**:
- `backend/app/services/ai_execution_plan.py`: dodano `MAX_TASKS = 200` w `synthesize_execution_plan()`
- Taski sa obcinane po sortowaniu wg priorytetu (najwazniejsze zostaja)

**Related**: A5 z comprehensive_system_audit

---

### BUG-022: Ciche bledy w _safe_json_parse

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM

**Description**:
- Kiedy AI zwracal zle sformatowany JSON, `_safe_json_parse()` zwracal pusty `{}` bez logowania bledu
- Niemozliwe bylo debugowanie dlaczego AI contexts sa puste

**Root cause**:
- Fallback logic bez logowania

**Fix**:
- `backend/app/services/ai_analysis.py`: dodano `logger.warning()` przy kazdym fallback attempt w `_safe_json_parse()`

**Related**: A2 z comprehensive_system_audit

---

### BUG-023: Brak ostrzezenia o bledzie AI w UI

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM

**Description**:
- Kiedy `ai_status == "failed"`, frontend nie wyswietlal zadnego ostrzezenia
- Uzytkownik widzial puste sekcje bez wyjasnienia

**Root cause**:
- Brak handlera dla `ai_status === "failed"` w main audit page

**Fix**:
- `frontend/app/(app)/audits/[id]/page.tsx`: dodano banner ostrzezenia z AlertTriangle gdy `ai_status === "failed"`

**Related**: D1 z comprehensive_system_audit

---

### BUG-024: Problemy z usuwaniem auditów (cache + CASCADE)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: CRITICAL

**Description**:
- Po usunięciu audytu UI pokazywało "zombie" audits do czasu force refresh
- Nie można było usunąć auditu - przycisk się zawiesał
- Stare audity nie pokazywały wyników poprawnie

**Root cause** (3 problemy):
1. **React Query cache nie był invalidowany** - deleteMutation tylko robił `router.push()` ale nie usuwał cache
2. **Brak ON DELETE CASCADE w DB** - initial migration dla `competitors` table nie miała `ondelete='CASCADE'` → orphaned records w DB
3. **Brak walidacji** - można było usunąć audit w trakcie processing → race condition z workerem

**Fix**:
1. Frontend:
   - `frontend/app/(app)/audits/[id]/page.tsx`: dodano `useQueryClient()` + invalidacja `['audits']` i `['audit', id]` w `deleteMutation.onSuccess`
   - `frontend/app/(app)/dashboard/page.tsx`: dodano `queryClient.invalidateQueries()` w `deleteMutation.onSuccess`
   - Dodano toast error handler

2. Backend:
   - `backend/app/routers/audits.py`: dodano walidację `audit.status in (PENDING, PROCESSING)` → 409 Conflict
   - Dodano logging po successful delete

3. Migracja:
   - `backend/alembic/versions/20260214_fix_competitors_cascade.py`: naprawiono ForeignKey constraint z `ondelete='CASCADE'`

**Verification**:
```bash
# Po deployment sprawdź:
docker logs sitespector-backend | grep "deleted successfully"
docker compose -f docker-compose.prod.yml exec backend-db psql -U sitespector_prod -d sitespector_prod -c "\d+ competitors"
# Powinieneś zobaczyć: ON DELETE CASCADE w audit_id constraint
```

**Related**: User feedback 2026-02-14

---

### BUG-025: Alembic migration aborted due to try/except DDL (transaction poisoned)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Deploy na VPS wywalał się na `alembic upgrade head` w migracji `20260214_missing_columns_and_schedules.py`
- Objaw: `asyncpg.exceptions.InFailedSQLTransactionError: current transaction is aborted...`

**Root cause**:
- Migracja próbowała być "idempotent" przez `try/except` wokół `op.add_column(...)`
- W PostgreSQL DDL jest transakcyjne: pierwszy błąd (np. kolumna już istnieje) abortuje transakcję i kolejne DDL/query w tej samej transakcji zawsze failuje, nawet jeśli Python złapie wyjątek

**Fix**:
- `backend/alembic/versions/20260214_missing_columns_and_schedules.py`:
  - użyto `sa.inspect(op.get_bind())` do sprawdzenia istniejących kolumn/tabel/indexów
  - wykonywane jest tylko DDL, które jest naprawdę potrzebne (bez generowania błędów)

**Verification**:
```bash
cd /opt/sitespector
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
curl -sk https://127.0.0.1/health
```

**Related**: Deploy 2026-02-14

---

### BUG-026: Visibility AI claims "brak AIO" despite AIO module having data (cross-module contradiction)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- W module `Widocznosc` (Visibility) AI potrafilo wypisac "brak widocznosci w AI Overviews"
- Jednoczesnie modul `AI Overviews` mial komplet danych i wnioski o obecnosci w AIO

**Root cause**:
- Agent `Visibility` bazowal na ogolnych `visibility.statistics` (gdzie pola `aio_*` bywaly puste/0 lub innego znaczenia)
- Agent `AI Overviews` bazowal na dedykowanym payloadzie `senuto.visibility.ai_overviews` (kanoniczne dane AIO)
- Brak wspolnego "globalnego kontekstu" w promptach → model mogl halucynowac/wnioskowac na podstawie niepelnych danych

**Fix**:
1. **Opcja A (canonical injection)**:
   - `backend/app/services/ai_analysis.py`: `analyze_visibility_context()` dostaje `ai_overviews_data` i w promptcie pokazuje AIO (canonical) + twarda regula: nie wolno stwierdzic "brak AIO" gdy canonical count > 0
2. **Opcja B (global snapshot)**:
   - `backend/app/services/global_context.py`: `build_global_snapshot()` + `format_global_snapshot_for_prompt()`
   - `backend/app/services/ai_analysis.py`: `_call_ai_context()` dokleja GLOBAL_SNAPSHOT do kazdego promptu (context + strategy)
   - `backend/app/services/ai_execution_plan.py`: task generatory doklejaja GLOBAL_SNAPSHOT do promptu (Phase 3)
   - `backend/worker.py` + `backend/app/routers/audits.py`: global snapshot przekazywany do wszystkich analiz

**Verification**:
```bash
# 1) Wygeneruj ai_contexts ponownie
POST /audits/{id}/run-ai-context?area=visibility
POST /audits/{id}/run-ai-context?area=ai_overviews

# 2) Sprawdz ze Visibility nie ma juz "brak AIO" gdy AIO istnieje
audit.results.ai_contexts.visibility.key_findings
audit.results.ai_contexts.ai_overviews.key_findings
```

**Related**: User report (Visibility vs AIO contradiction)

---

### BUG-027: Next.js 15 landing build fails on dynamic route props typing (params as Promise)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM

**Description**:
- `next build` failował na `landing/src/app/docs/[slug]/page.tsx` z błędem typu: `params` nie spełnia `PageProps` (Next.js 15).

**Root cause**:
- W Next.js 15 `params` w `PageProps` jest typowane jako `Promise` (w Server Components), a strona miała podpis `{ params: { slug: string } }`.

**Fix**:
- Zmieniono podpisy na:
  - `export async function generateMetadata({ params }: { params: Promise<{ slug: string }> })`
  - `export default async function Page({ params }: { params: Promise<{ slug: string }> })`
  - oraz `await params` przed użyciem `slug`.

**Verification**:
```bash
npm --prefix landing run lint
npm --prefix landing run build
```

---

### BUG-028: Landing build fails due to invalid Remix icon import (react-icons/ri)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: LOW

**Description**:
- `next build` failował, gdy zaimportowano nieistniejącą ikonę z `react-icons/ri` (np. `RiTrendingUpLine`).

**Root cause**:
- Remix icon nie istnieje w paczce `react-icons/ri` (pomyłka w nazwie).

**Fix**:
- Podmiana na istniejącą ikonę (`RiLineChartLine`) używaną już w repo.

**Verification**:
```bash
npm --prefix landing run build
```

---

### BUG-029: `/sitemap.xml` and `/robots.txt` not working (missing Next.js routes)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH (blocks indexing + discovery)

**Description**:
- `docker/nginx/nginx.conf` proxied `/sitemap.xml` and `/robots.txt` to the `landing` container, but the landing Next.js app did not implement these routes, so crawlers received a non-XML response / 404.

**Fix**:
- Implemented Next.js App Router routes:
  - `landing/src/app/sitemap.ts` (MetadataRoute sitemap)
  - `landing/src/app/robots.ts` (MetadataRoute robots)
- Added canonical + OpenGraph/Twitter metadata helper (`landing/src/lib/seo.ts`) and dynamic OG image endpoint (`landing/src/app/og/route.tsx`) to support consistent social previews and SEO defaults.
- Added Schema.org JSON-LD (Organization/WebSite global + per page-type) via `landing/src/lib/schema.ts` and `landing/src/components/JsonLd.tsx`.

**Verification**:
```bash
npm --prefix landing run lint
npm --prefix landing run build
```

---

### BUG-030: `/og` returns 404 in production (Nginx routed to wrong container)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: MEDIUM (breaks social previews + OG/Twitter images)

**Root cause**:
- `landing` implemented `/og` (`landing/src/app/og/route.tsx`), but Nginx did not proxy `/og` to `landing`, so requests were handled by `frontend` and returned 404.

**Fix**:
- Added `location /og { proxy_pass http://landing; }` in `docker/nginx/nginx.conf`.
- Deployment: rebuild/restart `nginx` container after `git pull` on VPS.

**Verification**:
```bash
curl -I https://sitespector.app/og?title=Test
```

---

### BUG-031: Public website header/footer inconsistent across routes (dual Next.js apps + anchor-based IA)

**Reported**: 2026-02-15

**Status**: ✅ FIXED

**Severity**: MEDIUM (visible UX inconsistency on marketing/public pages)

**Root cause**:
- The public website is served by **two Next.js apps** behind Nginx:
  - `landing` serves `/` and marketing/content routes
  - `frontend` serves fallback public routes like `/sitemap`
- Each app had its own header/footer implementations with different link structures (anchors like `/#price` vs real routes), so navigation and footer looked and behaved differently between pages.

**Fix**:
- Implemented route-based public IA (no scroll anchors) and aligned components across both apps:
  - Landing: Vercel-style mega menu (`landing/src/component/layout/Topbar/page.tsx`) + SCSS (`landing/src/assets/scss/_mega-menu.scss`)
  - Added canonical pricing page `/cennik` (`landing/src/app/cennik/page.tsx`) + Nginx route (`docker/nginx/nginx.conf`) + sitemap update (`landing/src/app/sitemap.ts`)
  - Frontend: aligned `PublicNavbar` + `PublicFooter` to match landing navigation/links
  - Removed remaining `/#...` anchor links from public sitemap/CTAs

**Verification**:
```bash
npm --prefix landing run lint
```

---

### BUG-032: Recurring VPS compromise (Mirai botnet) via exposed monitoring endpoints + Docker socket

**Reported**: 2026-02-15

**Status**: ✅ FIXED

**Severity**: CRITICAL

**Description**:
- Hetzner abuse report: outbound UDP DDoS from VPS IP (46.225.134.48) -- Mirai botnet variant (`x86_64.kok`).
- VPS was compromised again within 24h of a clean rebuild on new IP.
- Full repository scan confirmed: NO malware in the codebase.

**Root cause** (6 vulnerabilities):
1. `/api/logs/worker`, `/api/logs/backend`, `/api/system/status` -- publicly accessible WITHOUT authentication (exposed credentials, architecture).
2. `/logs` (Dozzle) -- publicly accessible Docker log viewer WITHOUT authentication (exposed real-time container logs).
3. `/docs`, `/redoc`, `/openapi.json` -- Swagger/OpenAPI publicly accessible on production (full API map for attackers).
4. Docker socket mounted R/W on worker container -- container escape to host possible.
5. `amir20/dozzle:latest` -- unpinned image, supply chain risk.
6. All containers had unrestricted outbound internet access -- no network segmentation.

**Fix**:
1. Removed `/logs` proxy from `docker/nginx/nginx.conf` (Dozzle only accessible via SSH tunnel).
2. Added `verify_admin_token` dependency (X-Admin-Token header) to all monitoring endpoints in `backend/app/main.py`.
3. Disabled Swagger/OpenAPI/ReDoc on production (`docs_url=None` when `ENVIRONMENT=production`).
4. Changed Docker socket to `:ro` on worker in `docker-compose.prod.yml`.
5. Pinned Dozzle to `v8.8.1`.
6. Split Docker network: `sitespector-internal` (no internet) + `sitespector-external` (internet).
7. Moved hardcoded DB credentials to `${...}` env vars.
8. Added security headers + rate limiting in nginx.
9. Added `ADMIN_API_TOKEN` to config and `.env.example`.

**Verification**:
```bash
# After deploy to new VPS:
curl -I https://sitespector.app/logs       # Should: 404
# Note: https://sitespector.app/docs is a LANDING route (public content) and may be 200.
# Swagger/OpenAPI must be disabled on the API layer:
curl -I https://sitespector.app/api/docs         # Should: 404
curl -I https://sitespector.app/api/openapi.json # Should: 404
curl https://sitespector.app/api/logs/worker  # Should: 403 or 422
curl -H "X-Admin-Token: TOKEN" https://sitespector.app/api/logs/worker  # Should: 200
```

**Related**: `SECURITY_HARDENING_PLAN.md`, `docker/nginx/nginx.conf`, `backend/app/main.py`, `backend/app/config.py`, `docker-compose.prod.yml`, `.env.example`

---

---

## BUG-033: /api/system/status returns 422 after security hardening

**Date**: 2026-02-15  
**Severity**: Medium  
**Status**: RESOLVED  

**Symptom**: Dashboard System Status panel shows all services as "failed". Console shows `GET /api/system/status 422 (Unprocessable Entity)`.

**Root Cause**: Security hardening (BUG-032) added `X-Admin-Token` header requirement to `/api/system/status` via `verify_admin_token` dependency. The frontend `SystemStatus.tsx` component calls this endpoint via `apiRequest()` which sends a Supabase Bearer token, not an admin token. FastAPI returned 422 because the required `X-Admin-Token` header was missing.

**Fix**:
1. Created `verify_admin_or_user` dependency in `backend/app/main.py` that accepts EITHER `X-Admin-Token` header (for external monitoring) OR Supabase Bearer JWT (for dashboard).
2. Changed `/api/system/status` to use `verify_admin_or_user` instead of `verify_admin_token`.
3. Added Qdrant to the system status check (async HTTP call to `http://qdrant:6333/collections`).
4. Updated frontend `SystemStatus.tsx` to render Qdrant tile (version + collection count).

**Files Changed**: `backend/app/main.py`, `frontend/components/SystemStatus.tsx`

**Related**: BUG-032 (security hardening introduced the regression)

---

## BUG-034: /api/chat/agents returns 500 - ResponseValidationError

**Date**: 2026-02-15  
**Severity**: Critical  
**Status**: RESOLVED  

**Symptom**: Chat panel widget renders but shows "no agents available". Console shows `GET /api/chat/agents 500 (Internal Server Error)`. Users cannot start conversations.

**Root Cause**: `chat_service.list_agents()` used SQLAlchemy `union_all()` to combine system agents with workspace-specific agents. However, `union_all` in async SQLAlchemy changes the result type — `res.scalars().all()` returned raw UUID scalars instead of full `AgentType` ORM objects. When Pydantic tried to serialize these UUIDs against `AgentTypeResponse` (which expects `id`, `name`, `slug`, etc.), it raised 30 validation errors (6 fields x 5 agents), resulting in `ResponseValidationError` → HTTP 500.

**Fix**:
1. Replaced `union_all()` with `or_()` condition combining `is_system=True` and `workspace_id=X` filters in a single `select(AgentType)` query.
2. Verified all 5 system agents return correctly with full ORM attributes.

**Files Changed**: `backend/app/services/chat_service.py`

**Related**: ADR-033 (chat agent system)

---

## BUG-035: Chat "API key expired" despite fallback key configured

**Date**: 2026-02-15  
**Severity**: Critical  
**Status**: RESOLVED  

**Symptom**: Chat agent responds with "API key expired" error on every message. Frontend shows error. Backend logs show `Chat SSE stream failed` with Google API error.

**Root Cause**: `embedding_client.py` (used by RAG `retrieve_context`) hardcoded `genai.configure(api_key=keys[0])` — always used the **first** (expired) key without any fallback logic. When the chat tried to embed the user's question for Qdrant search, it failed immediately on the expired primary key and never tried the fallback.

The `ai_client.py` (`call_claude`) already had proper multi-key retry, but the embedding client did not. Since `retrieve_context` is called **before** `call_claude` in the chat pipeline, the error was thrown from embeddings, not from the LLM call.

**Fix**:
1. Rewrote `embed_text()` in `embedding_client.py` to iterate over all available keys with try/catch fallback (same pattern as `call_claude`).
2. Added logging for each key attempt to aid future debugging.

**Files Changed**: `backend/app/services/embedding_client.py`

**Related**: BUG-034, ADR-033

---

## BUG-036: Embedding model mismatch between Gemini API keys

**Date**: 2026-02-15  
**Severity**: Critical  
**Status**: RESOLVED  

**Symptom**: Chat still fails with "API key expired" despite BUG-035 key fallback fix. Direct `call_claude` test works, but embedding fails.

**Root Cause**: The fallback Gemini API key is on a different Google Cloud project which does NOT have `text-embedding-004` model available. It only has `gemini-embedding-001`. The embedding client tried both keys but always used the same model name, so key 1 failed (expired) and key 2 failed (model not found on that project).

Additionally, `retrieve_context()` called `embed_query()` without any error handling, so any embedding failure crashed the entire chat pipeline even when the data wasn't in Qdrant yet.

**Fix**:
1. `embedding_client.py`: Try multiple embedding models per key (`text-embedding-004` then `gemini-embedding-001`). Nested loops: keys x models.
2. `rag_service.py`: Wrap `embed_query()` and `qdrant_search()` in try/except — gracefully return empty context on failure instead of crashing the chat.

**Note**: `text-embedding-004` produces 768-dim vectors, `gemini-embedding-001` produces 3072-dim. Qdrant collection dimension is set at creation time. When primary key is renewed, re-index audits to ensure consistency.

**Files Changed**: `backend/app/services/embedding_client.py`, `backend/app/services/rag_service.py`

---

## BUG-037: Chat SSE stream hangs - DB session closed before generator finishes

**Date**: 2026-02-15  
**Severity**: Critical  
**Status**: RESOLVED  

**Symptom**: Chat message appears to hang indefinitely. User sees spinner, message never arrives. Backend log shows `cannot call Transaction.rollback(): the underlying connection is closed`.

**Root Cause**: Classic FastAPI `StreamingResponse` + `Depends(get_db)` lifecycle bug. FastAPI closes the DB session (from dependency injection) as soon as the endpoint function returns the `StreamingResponse` object. But the async generator inside `StreamingResponse` continues to run AFTER the session is closed, causing all DB operations (save message, increment usage, flush) to fail with "connection closed".

**Fix**:
1. Removed `db: AsyncSession = Depends(get_db)` from the SSE endpoint.
2. Created a dedicated `AsyncSessionLocal()` context inside `event_generator()`.
3. Added explicit `await db.commit()` after stream completion and `await db.rollback()` on error.

**Files Changed**: `backend/app/routers/chat.py`

**Related**: BUG-035, BUG-036, ADR-033

---

## BUG-038: RAG indexing fails in worker - embedding model not available for API key

**Date**: 2026-02-15  
**Severity**: High  
**Status**: RESOLVED  

**Symptom**: After audit completes, worker logs show `RAG indexing failed: 404 models/text-embedding-004 is not found`. Qdrant collection `audit_rag_chunks` never created. Chat agent responds "brak danych w raporcie".

**Root Cause**: Worker ran `index_audit_for_rag` while primary Gemini key was still expired. Fallback key doesn't support `text-embedding-004`. The `EMBEDDING_MODELS` list had `text-embedding-004` first, so it tried that model before `gemini-embedding-001` (which works).

**Fix**:
1. Swapped API keys on VPS: working key is now primary.
2. Reordered `EMBEDDING_MODELS` list: `gemini-embedding-001` first (universally available).
3. Manually re-indexed audit `cd8558ec` - 240 chunks successfully stored in Qdrant.

**Files Changed**: `backend/app/services/embedding_client.py`

---

## BUG-039: Agent Chat shows missing context after new audit (RAG indexing blocked by 429 quota)

**Date**: 2026-02-16  
**Severity**: High  
**Status**: RESOLVED (code-side mitigation; external quota may still block indexing)  

**Symptom**:
- After a new audit completes, the audit-scoped chat often responds with missing/empty context ("brak danych") even though the audit results exist in Postgres.
- Worker logs show repeated embedding failures (`429 ResourceExhausted` / quota exhausted). No points are written to Qdrant for the audit.

**Root Cause**:
- Embedding generation for RAG indexing can require hundreds of vectors per audit. Without batching and throttling, this can exceed per-project rate limits even on paid tiers.
- When indexing fails, there was no user-facing recovery flow (manual reindex) and no self-heal behavior in chat.

**Fix**:
1. Embeddings: use `models/gemini-embedding-001` only (embedding models endpoint), and index chunks using `batchEmbedContents` (REST) to reduce request count.
2. Quota resilience: add throttling + exponential backoff on 429 errors and rotate keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_FALLBACK`).
3. Batch tuning: batch size reduced to **10 chunks** with **3-second pauses** between batches to stay within Tier 1 TPM limits (1M tokens/min). Sequential fallback has 0.1s delay.
4. Observability: add `audits.rag_indexed_at` (nullable) set on successful indexing.
5. Recovery:
   - Backend endpoint: `POST /api/audits/{audit_id}/reindex-rag`
   - Chat self-healing: when retrieval returns empty, attempt a one-time on-demand reindex and retry retrieval; otherwise return a clear UX message.
6. UX:
   - Backend endpoint: `GET /api/audits/{audit_id}/rag-status` returns `ready|pending|not_applicable`.
   - Frontend ChatPanel polls this endpoint and shows an amber banner when RAG is still pending, with a "Zaindeksuj teraz" button for manual trigger.
   - Frontend: add an explicit reindex button and an `indexing` streaming phase label.

**Files Changed**:
- `backend/app/services/embedding_client.py`, `backend/app/services/rag_service.py`, `backend/app/services/qdrant_client.py`
- `backend/app/services/chat_service.py`, `backend/app/routers/audits.py`, `backend/app/models.py`
- `backend/alembic/versions/20260216_add_rag_indexed_at.py`
- `frontend/components/chat/ChatPanel.tsx`, `frontend/components/chat/ChatMessages.tsx`, `frontend/lib/chat-api.ts`, `frontend/lib/chat-store.ts`

---

## BUG-040: Landing page memory leak (10.4 GiB after 8 days)

**Date**: 2026-02-25  
**Severity**: Critical  
**Status**: RESOLVED (mitigated; root cause is Next.js process leak)

**Symptom**: `docker stats` showed `sitespector-landing` consuming **10.41 GiB (68% of RAM)** after 8 days uptime. VPS had only 4.4 GiB available. Multiple zombie `/bin/sh` child processes spawned by `next-server`.

**Root Cause**: Next.js standalone server (`node server.js`) has a known memory leak pattern where ISR/SSR child processes accumulate over time without being reaped. No memory limit was set on the container, allowing unbounded growth.

**Fix**:
1. Restarted landing container: memory dropped from 10.41 GiB → 67 MiB.
2. Added `mem_limit: 512m` and `memswap_limit: 512m` to `docker-compose.prod.yml` landing service.
3. Container will auto-restart (`restart: unless-stopped`) when hitting the 512 MB limit, preventing future unbounded growth.

**Files Changed**: `docker-compose.prod.yml`

**Related**: WATCH-001 pattern (memory leak monitoring)

---

## BUG-041: Contaminated baseline data after project feature rollout

**Date**: 2026-02-25  
**Severity**: Medium  
**Status**: RESOLVED

**Symptom**:
- Mixed legacy/test data (projects, audits, schedules, chat) made project-based regression testing unreliable.
- New audits could be compared against stale entities from earlier feature iterations.

**Root Cause**:
- Feature rollout happened on top of pre-existing development and validation records across two databases (Supabase + VPS Postgres).
- No coordinated cross-system reset was performed after introducing project-scoped entities.

**Fix**:
1. VPS reset (`sitespector-postgres`): truncate `audits`, `competitors`, `audit_tasks`, `audit_schedules`, `chat_conversations`, `chat_messages`, `chat_attachments`, `chat_message_feedback`, `chat_shares`, `chat_usage`.
2. Reset VPS user audit counters: `users.audits_count = 0`.
3. Supabase reset (via backend service role): delete all rows from `projects`, `project_members`.
4. Reset subscription usage counters: `subscriptions.audits_used_this_month = 0`.
5. Verify all key tables have `count(*) = 0` and no non-zero usage counters remain.

**Files/Systems Touched**:
- VPS container: `sitespector-postgres`
- Backend service-role path: `backend/app/lib/supabase.py`
- Context docs: `.context7/decisions/DECISIONS_LOG.md`

---
  
  ## BUG-042: Admin Stats 500 Error (Enum Case Mismatch)
  
  **Date**: 2026-02-25  
  **Severity**: High  
  **Status**: RESOLVED
  
  **Symptom**:
  - `/api/admin/stats` returned 500 Internal Server Error.
  - Frontend `/admin` dashboard showed empty data and React minified errors.
  
  **Root Cause**:
  - Raw SQL query for `avg_processing_minutes` in `admin.py` used `status = 'completed'`.
  - PostgreSQL `auditstatus` enum values are uppercase (`COMPLETED`).
  - `asyncpg` threw `InvalidTextRepresentationError: invalid input value for enum auditstatus: "completed"`.
  
  **Fix**:
  - Updated raw SQL queries in `admin.py` to use `status = 'COMPLETED'`.
  
  **Files Changed**: `backend/app/routers/admin.py`
  
  ---
  
  **Last Updated**: 2026-02-28  
  **Resolved Bugs**: 41 (incl. BUG-043 hydration errors)  
  **Known Issues**: 1  
  **Watching**: 2

---

### BUG-043: React Hydration Errors (#418, #423) in Chat components

**Reported**: 2026-02-28

**Status**: ✅ FIXED (2026-02-28)

**Severity**: MEDIUM

**Description**:
- Production console showed `Minified React error #418` and `#423`.
- These are hydration mismatch errors where the server-rendered HTML differs from the first client-side render.

**Root cause**:
- `useChatStore` uses Zustand's `persist` middleware, which reads from `localStorage`.
- During SSR, `localStorage` is unavailable, so the store uses default values (e.g., `isPanelOpen: true`).
- On the client, the store immediately hydrates from `localStorage` (e.g., `isPanelOpen: false`).
- React detects this difference between the server HTML and client state, causing a hydration failure.

**Fix**:
- Implemented the `mounted` state pattern in `ChatPanel.tsx` and `ChatToggleButton.tsx`.
- Components now return `null` during the first render (SSR and first client pass) and only render after `useEffect` sets `mounted: true`.
- This ensures the component only renders once the persisted state is stable on the client.

**Files Changed**:
- `frontend/components/chat/ChatPanel.tsx`
- `frontend/components/chat/ChatToggleButton.tsx`

**Related**: Zustand Persist middleware documentation.

---

### BUG-044: PDF download broken on production (Jinja2 TemplateNotFound)

**Reported**: 2026-02-28

**Status**: ✅ FIXED (2026-02-28)

**Severity**: CRITICAL

**Description**:
All PDF report downloads were failing on production. The backend returned 500 errors when attempting to generate any PDF report.

**Root cause**:
Jinja2's `FileSystemLoader` was configured with base directory `templates/pdf/`. All 29 section templates used `{% from '../macros.html' import ... %}` with a relative path containing `..`. Jinja2 does not resolve relative paths from the template file's location — it resolves them from the loader's root directory. So `../macros.html` resolved to a path outside the root, causing `jinja2.exceptions.TemplateNotFound: ../macros.html`.

**Fix**:
Replaced all instances of `{% from '../macros.html' import ... %}` with `{% from 'macros.html' import ... %}` across all 29 HTML templates in `backend/templates/pdf/sections/`.

**Files Changed**:
- `backend/templates/pdf/sections/*.html` (all 29 section templates)

---

### BUG-045: PDF Report Bloat and Logic Errors

**Reported**: 2026-02-28

**Status**: ✅ FIXED (2026-02-28)

**Severity**: HIGH

**Description**:
- Generated PDF reports were excessively long (e.g., 136 pages) due to unfiltered data and lacking row limits in appendix tables.
- The "Zmiany Pozycji" (Position Changes) section showed confusing "0 -> 0" changes.
- Tables for Competitors, AI Overviews, and Backlinks often contained empty columns ("---") due to incorrect data mapping from the Senuto API.
- AI Insights were repetitive and lacked specific context.
- The PDF design looked outdated and "heavy".

**Root cause**:
- Missing hard limits (`[:100]`) in Jinja2 templates for appendix loops.
- `position_changes.py` extractor didn't correctly categorize keywords moving in/out of TOP50 (0 position).
- Extractors (`organic_competitors.py`, `ai_overviews.py`, `backlinks.py`) used incorrect field names for Senuto's nested API responses.
- AI prompts lacked explicit instructions to avoid repeating previous findings and to keep task descriptions concise.
- CSS styles used heavy borders and outdated typography.

**Fix**:
- **Data & Logic**: Refactored `position_changes.py` to correctly identify "New" (0->X) and "Lost" (X->0) keywords. Updated other extractors with `normalized_*` functions to correctly map nested Senuto data.
- **Templates**: Added `[:100]` limits to all `appendix_*.html` templates. Added conditional rendering (`{% if %}`) to hide empty tables/sections.
- **AI**: Updated prompts in `ai_analysis.py` and `ai_execution_plan.py` to be more concise (max 150 chars for tasks) and implemented a `previous_findings` injection mechanism in `worker.py` to prevent repetitive insights.
- **Design**: Updated `styles.py` to use the 'Inter' font, removed vertical table borders, and modernized metric cards and alerts.

**Files Changed**:
- `backend/app/services/pdf/styles.py`
- `backend/app/services/pdf/sections/*.py`
- `backend/templates/pdf/sections/*.html`
- `backend/app/services/ai_analysis.py`
- `backend/app/services/ai_execution_plan.py`
- `backend/worker.py`

---

### BUG-046: PDF Report Round 3 — Visual & Data Fixes

**Reported**: 2026-02-28

**Status**: ✅ FIXED (2026-02-28)

**Severity**: HIGH

**Description**:
- Cover page URL broke character-by-character due to `word-break: break-all` CSS rule.
- Google Fonts `@import url()` in `styles.py` failed silently — WeasyPrint has no internet access during PDF rendering, causing fallback to DejaVu Sans.
- "URL Źródłowy" column in appendix backlinks table was always empty — template used `bl.url` but Senuto data has `ref_url`.
- Backlinks section had no charts despite having follow/nofollow percentages and ref domains data.
- On-Page SEO section imported `chart` macro but never used it despite having issue counts.

**Root cause**:
- `word-break: break-all` is too aggressive — breaks at every character.
- WeasyPrint runs offline; remote Google Fonts URLs are never fetched.
- `appendix_backlinks.py` returned raw Senuto data without normalizing field names (`ref_url`, `ref_domain`, `anchor`).
- `generator.py` rendered backlinks and on_page_seo via simple `_sec()` without chart generation.

**Fix**:
- Changed `.cover-url` CSS to `overflow-wrap: anywhere; word-break: normal`.
- Removed Google Fonts `@import`, updated font stack to `'Inter', 'Liberation Sans', 'DejaVu Sans', sans-serif`.
- Added Inter font download step to `backend/Dockerfile` (falls back to Liberation Sans if download fails).
- Normalized `appendix_backlinks.py` — maps `ref_url→url`, `ref_domain→domain`, `anchor→anchor`.
- Added follow/nofollow pie chart and ref domains bar chart to backlinks section in `generator.py` + `backlinks.html`.
- Added SEO issues horizontal bar chart to on_page_seo section in `generator.py` + `on_page_seo.html`.
- Imported `pie_chart`, `bar_chart`, `horizontal_bar_chart` in `generator.py`.

**Files Changed**:
- `backend/app/services/pdf/styles.py`
- `backend/Dockerfile`
- `backend/app/services/pdf/sections/appendix_backlinks.py`
- `backend/app/services/pdf/generator.py`
- `backend/templates/pdf/sections/backlinks.html`
- `backend/templates/pdf/sections/on_page_seo.html`

---

### BUG-047: UI templates looked narrow, wrapped poorly, and had inconsistent logo/layout

**Reported**: 2026-03-03

**Status**: ✅ FIXED (2026-03-03)

**Severity**: HIGH

**Description**:
- Multiple templates looked visually broken: content area too narrow, ugly text wrapping, inconsistent logo scale, and rigid report layout.
- Most visible issues were in app shell with persistent chat, client-report page, landing navigation/footer, and selected PDF sections.

**Root cause**:
- Mixed responsive strategies (`lg:` + `@lg:`) in container-constrained pages.
- Chat panel default width (`420px`) reduced available content width too aggressively.
- No single source-of-truth logo component in frontend.
- Over-aggressive global style overrides and broad landing typography rules.
- PDF tables/cover needed stronger wrapping/readability constraints.

**Fix**:
- Added app shell guardrails (`min-w-0`, `overflow-x-hidden`) in `frontend/app/(app)/layout.tsx`.
- Reduced chat default width to `360px` and min width to `300px` in `frontend/lib/chat-store.ts`.
- Refactored `client-report` to container-query-first responsive classes and flexible spacing.
- Added shared logo component `frontend/components/brand/SiteSpectorLogo.tsx`, adopted in:
  - `frontend/components/layout/UnifiedSidebar.tsx`
  - `frontend/components/layout/PublicNavbar.tsx`
  - `frontend/components/layout/PublicFooter.tsx`
- Reduced global style conflicts in `frontend/app/globals.css`.
- Normalized landing typography/menu/mega-menu behavior:
  - `landing/src/assets/scss/_general.scss`
  - `landing/src/assets/scss/_menu.scss`
  - `landing/src/assets/scss/_mega-menu.scss`
  - plus topbar/footer component adjustments.
- Improved PDF text/table/cover wrapping in:
  - `backend/app/services/pdf/styles.py`
  - `backend/templates/pdf/sections/cover.html`

**Verification**:
- Frontend changed-file lint: passed.
- Landing full lint: passed.
- Full frontend lint still reports unrelated historical issues outside this change scope.

**Related**:
- `frontend/app/(app)/layout.tsx`
- `frontend/app/(app)/audits/[id]/client-report/page.tsx`
- `frontend/components/brand/SiteSpectorLogo.tsx`
- `frontend/app/globals.css`
- `landing/src/assets/scss/_general.scss`
- `backend/app/services/pdf/styles.py`

---

### BUG-048: PDF cover page rendered as partial height and broken logo alignment

**Reported**: 2026-03-03

**Status**: ✅ FIXED (2026-03-03)

**Severity**: CRITICAL

**Description**:
- Cover page dark background ended early, leaving a large white block in the lower area.
- Footer note appeared outside the dark cover zone.
- Logo row (icon + SiteSpector text) could misalign on WeasyPrint cover render.

**Root cause**:
- First page kept global `@page` margins because `@page :first` did not define `margin: 0`.
- Cover used fragile negative-margin compensation instead of full-page dimensions.
- `inline-flex` on the logo row was less stable with SVG rendering in WeasyPrint.

**Fix**:
- Added `margin: 0` to `@page :first`.
- Reworked `.cover-page` to true A4 sizing (`width: 210mm; min-height: 297mm`) and removed negative margins.
- Switched logo row to `display: flex`, centered all key blocks vertically, and increased spacing rhythm.
- Updated cover URL wrapping rules for long domains and added a visual separator line under the subtitle.
- Deployed patched files directly into running `sitespector-backend` container via `docker cp`, then regenerated report.

**Files Changed**:
- `backend/app/services/pdf/styles.py`
- `backend/templates/pdf/sections/cover.html`

**Verification**:
- Generated fresh PDF: `tmp/audit_demo_20260303_v5.pdf`
- Confirmed container has updated styles/template before render.

---

### BUG-049: PDF cover still broke in WeasyPrint despite full-bleed dark layout

**Reported**: 2026-03-05

**Status**: ✅ FIXED (2026-03-05)

**Severity**: CRITICAL

**Description**:
- Cover page in `v5/v6` still showed footer text outside the main cover block.
- Visual hierarchy looked unstable (divider rendered like a block, spacing drift).
- Requirement changed to match full report style: light background + dark text on cover.

**Root cause**:
- Flex-based vertical push (`margin-top: auto`) remained brittle in WeasyPrint pagination context.
- Inline divider style was rendered inconsistently.
- Dark cover approach increased risk of visible page-boundary artifacts.

**Fix**:
- Switched cover to a light theme (`#f8fafc` background, dark typography), aligned with report pages.
- Replaced fragile flex footer behavior with deterministic positioning (`position: absolute; bottom: ...`).
- Introduced stable block structure: `cover-main`, `cover-logo-wrap`, `cover-divider`, `cover-url-box`, `cover-footer-note`.
- Added two-step logo mechanism in template/generator:
  - fallback vector/text logo works now,
  - future PNG can be injected via `PDF_COVER_LOGO_SRC` without layout rewrite.

**Files Changed**:
- `backend/app/services/pdf/styles.py`
- `backend/templates/pdf/sections/cover.html`
- `backend/app/services/pdf/generator.py`

**Verification**:
- Generated fresh PDF: `tmp/audit_demo_20260305_v7.pdf`
- Confirmed patched files were copied to running `sitespector-backend` and rendered by production pipeline.

---

### BUG-050: False-zero visibility and AIO/backlink metrics in full PDF

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: CRITICAL

**Description**:
- Full PDF showed `0` for key business metrics despite non-zero Senuto payload:
  - visibility / TOP3 / TOP10 / TOP50 / domain rank,
  - AIO citations / avg position,
  - backlinks follow/nofollow split.

**Root cause**:
- Extractors assumed flat or `current`-only fields, while Senuto aggregates often use nested objects with `recent_value`.
- Backlinks link attributes were parsed as flat object, but payload is domain-keyed (`{ domain: [{attribute,count,percent}] }`).

**Fix**:
- Added shared normalization helpers in `backend/app/services/pdf/utils.py`:
  - `pick_first()`
  - `senuto_metric_value()`
- Refactored affected extractors:
  - `visibility_overview.py`
  - `executive_summary.py`
  - `keywords.py`
  - `position_changes.py`
  - `organic_competitors.py`
  - `ai_overviews.py`
  - `backlinks.py`
  - `appendix_keywords.py`

**Verification**:
- Regenerated full PDF for audit `de83bfe4-7d32-4349-818c-51866c098225`.
- Confirmed corrected values:
  - TOP3 `2569`
  - TOP10 `5176`
  - TOP50 `15119`
  - Visibility `291925.0`
  - AIO citations `865`
  - Follow/Nofollow `94% / 6%`

---

### BUG-051: Executive Summary contained stale “visibility 0.0” critical issue

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: HIGH

**Description**:
- After fixing Senuto mapping, Executive Summary still displayed a legacy critical issue text mentioning visibility snapshot `0.0`, creating contradiction with corrected metrics.

**Root cause**:
- Historical `results.executive_summary.critical_issues` text was reused verbatim without consistency filtering against current normalized values.

**Fix**:
- Added sanitization in `backend/app/services/pdf/sections/executive_summary.py`:
  - when normalized visibility is non-zero, remove stale issue strings related to snapshot `0.0`/`snapshot` wording.

**Verification**:
- Regenerated full PDF and confirmed stale issue no longer appears.

---

### BUG-052: PDF tables clipped long URLs and reduced readability

**Reported**: 2026-03-06

**Status**: ✅ FIXED (2026-03-06)

**Severity**: HIGH

**Description**:
- Several dense tables were visually narrow and aggressively cut content (especially URL columns in keywords/appendix/backlinks/competitors).

**Root cause**:
- Global `table-layout: fixed` and `word-break: break-all` behavior in PDF styles, plus strong truncation in selected templates.

**Fix**:
- Updated `backend/app/services/pdf/styles.py`:
  - `table-layout: auto`
  - URL wrapping via `overflow-wrap: anywhere` and no `break-all`
  - appendix table layout tuning
- Updated templates:
  - `backend/templates/pdf/sections/keywords.html`
  - `backend/templates/pdf/sections/appendix_keywords.html`
  - `backend/templates/pdf/sections/organic_competitors.html`
  - `backend/templates/pdf/sections/ai_overviews.html`
  - `backend/templates/pdf/sections/backlinks.html`

**Verification**:
- Regenerated full PDF and confirmed improved column balance and URL readability.

---

### BUG-053: Tier 1 gap-analysis data existed in backend but was invisible in audit UI

**Reported**: 2026-03-08

**Status**: ✅ FIXED (2026-03-08)

**Severity**: HIGH

**Description**:
- Audit frontend did not expose multiple high-value datasets already present in `audits.results`:
  - missing single Health Score on overview,
  - no Error/Warning/Notice severity dashboard,
  - no dedicated technical page for `results.crawl` extras,
  - backlinks `ref_domains` and `anchors` truncated to top 6,
  - no visibility sampling indicator (`positions_count` vs `positions_total`).

**Root cause**:
- UI implementation covered only a subset of collected backend payloads.
- Technical SEO extras and full Senuto backlink/sampling metadata remained available only in raw payloads/PDF/backend logic.

**Fix**:
- Added Health Score + Issue Severity dashboard in:
  - `frontend/app/(app)/audits/[id]/page.tsx`
- Added new route:
  - `frontend/app/(app)/audits/[id]/technical/page.tsx`
  - with 6 panels: robots, sitemap, domain config, render no-JS, soft 404, directives/hreflang.
- Added audit sidebar navigation entry:
  - `frontend/components/layout/AuditSidebar.tsx`
- Expanded backlinks UI:
  - `frontend/app/(app)/audits/[id]/links/page.tsx`
  - full ref domains table + full anchor cloud visualization + anchor table.
- Added positions sampling indicator:
  - `frontend/app/(app)/audits/[id]/visibility/page.tsx`
  - based on `senuto._meta.positions_count` and `senuto._meta.positions_total`.

**Verification**:
- Lints for changed files: no errors.
- Confirmed new route `/audits/[id]/technical` renders with 3-phase mode switcher and 6 data panels.
- Confirmed overview contains Health Score + severity counts + top 5 critical issues.
- Confirmed backlinks incoming tab now surfaces full domains/anchors datasets.
- Confirmed visibility positions tab shows `X z Y` sampling message.
