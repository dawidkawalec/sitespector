# Content Update Procedure

Procedura aktualizacji treści strony SiteSpector po wdrożeniu nowych funkcji lub zmian w platformie.

## Kiedy aktualizować

- **Nowa funkcja** wdrożona na produkcji
- **Zmiana cennika** lub limitów
- **Nowa integracja** lub rozbudowa istniejącej
- **Okresowy przegląd** (co 2-4 tygodnie)

---

## Procedura krok po kroku

### 1. SPRAWDŹ OSTATNIE ZMIANY

```bash
# Pokaż commity od ostatniej aktualizacji treści
git log --since="YYYY-MM-DD" --oneline

# Lub od konkretnego commita
git log COMMIT_HASH..HEAD --oneline

# Pokaż zmienione pliki
git diff --name-only COMMIT_HASH..HEAD
```

**Na co zwrócić uwagę:**
- Nowe pliki w `backend/app/routers/` → nowe endpointy API
- Nowe pliki w `frontend/app/` → nowe strony dashboardu
- Zmiany w `backend/app/services/` → nowa funkcjonalność
- Zmiany w `backend/app/models/` → nowe modele danych
- Zmiany w `docker-compose.prod.yml` → nowe serwisy
- Zmiany w `landing/` → landing page updates

### 2. ZIDENTYFIKUJ WPŁYW NA TREŚCI

| Typ zmiany | Co zaktualizować |
|------------|------------------|
| Nowa funkcja | `features.json`, `funkcje.md`, odpowiedni `docs/*.md`, rozważ blog post |
| Nowa integracja | `integrations.json`, `integracje.md`, `brands.json` |
| Zmiana cennika | `pricing.json`, `regulamin.md`, `porownanie.md`, `docs/subskrypcje-platnosci.md` |
| Nowa strona dashboardu | `docs/panel-audytu.md`, `features.json` |
| Nowa analiza AI | `docs/ai-analiza.md`, `features.json`, rozważ blog post |
| Bug fix | `changelog/*.md` (nowy wpis) |
| Zmiana UI | Ewentualne aktualizacje screenshotów (placeholder'y) |

### 3. ZAKTUALIZUJ PLIKI CONTENT

#### JSON data files (`landing/content/data/`)
- `features.json` — dodaj nową funkcję do listy
- `integrations.json` — dodaj/zaktualizuj integrację
- `pricing.json` — zaktualizuj ceny/limity/funkcje per plan
- `faq.json` — dodaj pytanie o nową funkcję
- `metadata.json` — dodaj metadata dla nowych stron

#### Markdown pages (`landing/content/pages/`)
- Zaktualizuj odpowiednie podstrony
- Dodaj nową stronę jeśli funkcja jest na tyle duża (skopiuj z `_templates/`)

#### Blog (`landing/content/blog/`)
- Rozważ nowy post o nowej funkcji
- Skopiuj `_templates/_blog-template.md`

#### Changelog (`landing/content/changelog/`)
- Dodaj wpis do aktualnego miesiąca lub utwórz nowy plik

#### Docs (`landing/content/docs/`)
- Zaktualizuj odpowiednie sekcje
- Dodaj nową sekcję jeśli potrzeba

### 4. ZAKTUALIZUJ SEO

- Sprawdź `metadata.json` — czy nowe strony mają metadata
- Sprawdź internal linking — czy nowe strony są linkowane
- Sprawdź nawigację — `navigation.json` — czy footer i topbar są aktualne

### 5. WALIDUJ

- [ ] Wszystkie pliki mają poprawny frontmatter
- [ ] Brak broken internal links (sprawdź ścieżki `/xxx`)
- [ ] Image placeholders obecne dla nowych grafik
- [ ] Changelog odzwierciedla zmianę
- [ ] FAQ zaktualizowane jeśli dotyczy
- [ ] Metadata obecne dla nowych stron

### 6. COMMIT

```bash
git add landing/content/
git commit -m "content: update content for [feature name]"
```

---

## Quick Reference — ścieżki

```
landing/content/
├── data/                   # JSON — dane strukturalne
│   ├── hero.json
│   ├── about-features.json
│   ├── features.json
│   ├── services.json
│   ├── pricing.json
│   ├── testimonials.json
│   ├── faq.json
│   ├── counter.json
│   ├── trust-badges.json
│   ├── brands.json
│   ├── integrations.json
│   ├── demo.json
│   ├── cta.json
│   ├── navigation.json
│   └── metadata.json
├── pages/                  # Markdown — podstrony
├── blog/                   # Markdown — blog
├── case-studies/           # Markdown — case studies
├── changelog/              # Markdown — changelog
├── docs/                   # Markdown — dokumentacja
└── _templates/             # Szablony (read-only)
```

---

## Checklist aktualizacyjny (do kopiowania)

```
## Content Update: [Feature/Change Name]
Date: YYYY-MM-DD
Trigger: [commit hash / opis zmiany]

### Updated files:
- [ ] data/features.json
- [ ] data/pricing.json
- [ ] data/faq.json
- [ ] data/metadata.json
- [ ] pages/[affected].md
- [ ] docs/[affected].md
- [ ] changelog/YYYY-MM.md
- [ ] blog/[new-post].md (if applicable)

### Validation:
- [ ] Frontmatter valid
- [ ] Internal links working
- [ ] Image placeholders present
- [ ] Navigation updated (if new page)
```
