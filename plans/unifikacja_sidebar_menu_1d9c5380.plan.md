---
name: Unifikacja sidebar menu
overview: Przebudowa nawigacji bocznej w jeden spojny, zwijany sidebar z usunieciem duplikatow i odswiezonym designem. Dotyczy glownie UnifiedSidebar.tsx, NavSection.tsx, NavItem.tsx.
todos:
  - id: fix-duplicates
    content: Usunac duplikaty nawigacji (Dashboard/Audits), poprawic ikone Profile, naprawic podwojny import Sparkles
    status: completed
  - id: add-narzedzia
    content: Dodac brakujaca sekcje Narzedzia z disabled items (Quick Wins, Performance, SEO, Tech Stack, Security, AI Content, UX Check, Integracje)
    status: completed
  - id: animate-sections
    content: Dodac plynne animacje rozwijania/zwijania sekcji w NavSection (CSS transitions lub Radix Collapsible)
    status: completed
  - id: visual-redesign
    content: "Odswiezyc styl: aktywny indicator, hover efekty, separatory sekcji, typografia, dark mode, kompaktowy design"
    status: completed
  - id: mobile-fixes
    content: Poprawic mobile sidebar (zamykanie po kliknieciu, usunac podwojny header audytu)
    status: completed
  - id: cleanup-context7
    content: Zaktualizowac dokumentacje .context7 o nowa strukture sidebara i decyzje architektoniczne
    status: completed
  - id: deploy-vps
    content: "Commit, push na origin/release, deploy na VPS: rebuild frontend, restart kontenerow, weryfikacja logow"
    status: completed
isProject: false
---

# Unifikacja Sidebar - Jeden Spojny Panel Nawigacji

## Stan obecny i problemy

Lokalne zmiany juz rozpoczely unifikacje (nowy `UnifiedSidebar.tsx` zastepuje stary `Sidebar.tsx` i `AuditSidebar.tsx`), ale wymagaja poprawek:

### Zidentyfikowane problemy w aktualnym kodzie

1. **Duplikat "Dashboard" i "Audits"** - oba linki prowadza do `/dashboard` ([UnifiedSidebar.tsx](frontend/components/layout/UnifiedSidebar.tsx) linie 46-57)
2. **Brakujaca sekcja "Narzedzia"** - stary `AuditSidebar.tsx` mial sekcje NARZEDZIA (Quick Wins, Performance, SEO, Tech Stack, Security, AI Content, UX Check, Integracje) - nie przeniesiono ich do nowego sidebara
3. **Bledna ikona Profile** - uzywa `Bell` zamiast ikony uzytkownika (linia 84)
4. **Brak animacji rozwijania** - `NavSection` renderuje/ukrywa elementy warunkowo, bez plynnej animacji (display: none vs. animated height)
5. **Podstawowy styl wizualny** - brak hierarchii wizualnej, separatorow, efektow hover

---

## Plan zmian

### Faza 1: Naprawa struktury nawigacji (duplikaty i brakujace elementy)

**Plik:** [frontend/components/layout/UnifiedSidebar.tsx](frontend/components/layout/UnifiedSidebar.tsx)

- **Usunac duplikat "Audits"** z glownej nawigacji - zostawic tylko "Dashboard" (oba prowadza do `/dashboard`)
- **Dodac "Audits" jako osobny link** z wlasna sciezka `/audits` LUB zostawic tylko "Dashboard" jako landing page z lista audytow
- **Dodac sekcje "Narzedzia"** do nawigacji audytu (disabled items, gotowe na przyszlosc):
  - Quick Wins, Performance, SEO, Tech Stack, Security, AI Content, UX Check, Integracje
- **Poprawic ikone Profile** - zamienic `Bell` na `User` lub `UserCircle`
- **Dodac nazwe/URL audytu** w sekcji kontekstowej audytu (zamiast tylko "Aktualny audyt")

### Faza 2: Plynne animacje rozwijania/zwijania

**Pliki:** [frontend/components/layout/NavSection.tsx](frontend/components/layout/NavSection.tsx)

Obecne rozwiazanie (warunkowe renderowanie `{isOpen && ...}`) nie daje plynnej animacji. Propozycja:

- Uzyc CSS `grid-template-rows: 0fr` -> `1fr` z `transition` dla plynnego rozwijania (natywne CSS, bez dodatkowych bibliotek)
- Alternatywa: uzyc `@radix-ui/react-collapsible` (juz dostepne w shadcn) dla accessibility i animacji
- Dodac subtelna animacje rotate na chevron (juz czesciowo jest)

### Faza 3: Odswiezenie wizualne

**Pliki:** Glownie [UnifiedSidebar.tsx](frontend/components/layout/UnifiedSidebar.tsx), [NavItem.tsx](frontend/components/layout/NavItem.tsx), [NavSection.tsx](frontend/components/layout/NavSection.tsx)

Zmiany wizualne:

- **Hierarchia sekcji** - wyrazniejsze separatory miedzy glowna nawigacja, sekcja audytu i ustawieniami (cienka linia + maly label)
- **Aktywny stan** - wyrazniejszy indicator (pionowy pasek po lewej stronie aktywnego elementu zamiast tylko tla)
- **Hover efekty** - subtelniejsze przejscia, lepsze contrast ratios
- **Typografia** - mniejsze, bardziej kompaktowe etykiety sekcji (uppercase, letter-spacing)
- **Ikony** - ujednolicenie rozmiaru i koloru, wyrownanie do siatki
- **Dark mode** - sprawdzenie i poprawienie kolorow w trybie ciemnym
- **Scrollbar** - ukryty lub niestandardowy scrollbar dla sekcji nawigacji
- **Workspace switcher** - zmniejszenie wizualnej wagi, bardziej kompaktowy

### Faza 4: Optymalizacja mobilna

**Pliki:** [MobileSidebar.tsx](frontend/components/layout/MobileSidebar.tsx), [layout audytu](frontend/app/(app)/audits/[id]/layout.tsx)

- Upewnic sie ze `MobileSidebar` dziala identycznie jak desktop
- Zamykanie sidebara po kliknieciu linku (dodac `onClose` callback)
- Sprawdzic podwojny mobile header (layout audytu ma swoj + layout glowny ma swoj)

### Faza 5: Czyszczenie kodu

- Usunac nieuzywane importy (`useState`, `useEffect` z React jesli niepotrzebne)
- Usunac duplicated import `Sparkles` i `SparklesIcon` (linie 24, 27 w UnifiedSidebar)
- Zaktualizowac `.context7/frontend/COMPONENTS.md` o nowa strukture
- Zaktualizowac `.context7/decisions/DECISIONS_LOG.md` o decyzje architektoniczne

---

## Docelowa struktura sidebara

```
SiteSpector (logo + link do dashboard)
Workspace Switcher
---
Dashboard                    (/ dashboard)
---
[Kontekst audytu - widoczny tylko przy /audits/[id]/*]
  AKTUALNY AUDYT: nazwa-strony.pl
  v Przeglad
      Podsumowanie
      SEO  
      Wydajnosc
      Analiza AI
  v Raporty
      Raport PDF
      Porownanie (disabled)
      Raport klienta (disabled)
      Benchmark (disabled)
  v Zaawansowane
      Konkurencja
      Debug
      Architektura (disabled)
  v Narzedzia
      Quick Wins (disabled)
      Performance (disabled)
      SEO (disabled)
      Tech Stack (disabled)
      Security (disabled)
      AI Content (disabled)
      UX Check (disabled)
      Integracje (disabled)
  <- Wroc do listy audytow
---
v Ustawienia
    Profil
    Zespol
    Rozliczenia
    Wyglad
    Powiadomienia
---
[Workspace name + rola]
Wyloguj sie
```

## Kluczowe pliki do modyfikacji


| Plik | Zakres zmian |
| ---- | ------------ |


- `frontend/components/layout/UnifiedSidebar.tsx` - struktura nawigacji, duplikaty, nowa sekcja Narzedzia, styl
- `frontend/components/layout/NavSection.tsx` - animacje rozwijania, styl sekcji
- `frontend/components/layout/NavItem.tsx` - aktywny stan, hover, ikony
- `frontend/components/layout/MobileSidebar.tsx` - callback zamykania
- `frontend/app/(app)/audits/[id]/layout.tsx` - usunac podwojny mobile header

### Faza 6: Commit, push i deploy na VPS

Po zakonczeniu wszystkich zmian:

1. **Commit** - zaproponowac 2-3 opcje wiadomosci commita (zgodnie z workflow - uzytkownik wybiera)
2. **Push** - po akceptacji commita, wypchnac na `origin/release` (po potwierdzeniu uzytkownika)
3. **Deploy na VPS** (`ssh root@77.42.79.46`):

```bash
cd /opt/sitespector
git pull origin release
# Frontend wymaga REBUILD (zmiany w komponentach React)
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
# Weryfikacja
docker logs sitespector-frontend --tail 50 -f
```

1. **Weryfikacja** - sprawdzenie logow, upewnienie sie ze kontener frontend dziala poprawnie

