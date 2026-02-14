# Strona Blog (indeks) — Brief

Dokument kreatywny dla agenta AI budujący **stronę listującą posty blogowe** SiteSpector. Brief dotyczy DESIGNU strony indeksu bloga, nie treści pojedynczych artykułów.

---

## Meta

- **title**: Blog — SiteSpector | Artykuły o SEO, audytach i widoczności
- **description**: Artykuły o audytach SEO, Core Web Vitals, Execution Plan, AI Overviews i optymalizacji stron. Porady, case studies i poradniki od zespołu SiteSpector.
- **keywords**: blog SEO, audyt strony, poradniki SEO, SiteSpector blog

---

## Sekcja: Hero

**Headline:**
> **Blog** SiteSpector

**Subheadline:**
> Artykuły o audytach SEO, wydajności stron, AI w wyszukiwarkach i praktycznych poradach dla agencji i właścicieli witryn.

**Design:** Krótki hero, `bg-light` lub `bg-white`.

---

## Sekcja: Filtrowanie po kategorii

**Label:** KATEGORIE

**Filtry (przyciski / chipy):**
- Wszystkie
- Audyty SEO
- Wydajność (Core Web Vitals)
- AI i widoczność
- Poradniki
- Case studies
- Aktualności

**Zachowanie:** Kliknięcie filtra pokazuje tylko posty z danej kategorii. Domyślnie: Wszystkie. Kategoria w frontmatter każdego posta (`category`).

---

## Sekcja: Karty artykułów

**Struktura jednej karty:**
1. **Obraz okładki** — 16:9 lub 4:3, placeholder jeśli brak
2. **Tag kategorii** — np. „Audyty SEO”, „Poradniki”
3. **Tytuł** — link do `/blog/[slug]`
4. **Data** — format: DD.MM.YYYY
5. **Autor** — np. „Zespół SiteSpector” lub imię
6. **Fragment (excerpt)** — 2–3 zdania, max 120 znaków
7. **Czas czytania** — np. „5 min” (opcjonalnie, obliczane z długości treści)

**Layout karty:**
- Desktop: grid 2 lub 3 kolumny
- Mobile: 1 kolumna
- Karta: `rounded-4`, `shadow-sm`, hover `shadow` + `translateY(-2px)`
- Obraz na górze karty, reszta poniżej

**Przykład karty (HTML/React):**
```tsx
<Card>
  <Image src={cover} alt={title} />
  <Badge>{category}</Badge>
  <h3><Link href={`/blog/${slug}`}>{title}</Link></h3>
  <small>{date} · {author} · {readingTime} min</small>
  <p>{excerpt}</p>
</Card>
```

---

## Sekcja: Paginacja lub infinite scroll

**Opcja A — Paginacja:**
- Przyciski: Poprzednia | 1 | 2 | 3 | Następna
- 9 lub 12 artykułów na stronę
- URL: `/blog?page=2` lub `/blog/page/2`

**Opcja B — Infinite scroll:**
- Ładowanie kolejnych postów po przewinięciu do końca
- Przycisk „Załaduj więcej” lub automatyczne ładowanie

**Rekomendacja:** Paginacja — lepsza dla SEO i nawigacji.

---

## Sekcja: Newsletter

**Label:** BĄDŹ NA BIEŻĄCO

**Headline:** Subskrybuj **newsletter**

**Copy:**
> Otrzymuj najnowsze artykuły, porady i informacje o nowych funkcjach SiteSpector. Bez spamu — wysyłamy 1–2 wiadomości miesięcznie.

**Pole:** E-mail (input) + przycisk „Zapisz się”

**Design:** Karta `bg-light` lub wstawka między kartami blogowymi. Opcjonalnie: Lordicon mail.

---

## Sekcja: CTA

**Label:** GOTOWY NA PRAKTYKĘ?

**Headline:** Nie tylko czytaj — **wypróbuj** SiteSpector

**Copy:**
> Wiele porad z naszego bloga możesz od razu wdrożyć w audycie. Plan Free — 5 audytów miesięcznie.

**CTA Primary:** Rozpocznij darmowy audyt → `/login`

---

## Grafiki

| Element       | Opis | Rozmiar |
|---------------|------|---------|
| Karty okładki | Obrazy z frontmatter `cover` każdego posta. Placeholder: ilustracja generyczna SEO | 600x340 px (16:9) |
| Hero          | Opcjonalnie: ilustracja „blog” / „czytanie” | 800x300 px |

---

## Dane źródłowe

**Struktura plików:** `landing/content/blog/*.md`

**Frontmatter wzorzec:**
```yaml
title: "Tytuł artykułu"
date: "2026-02-14"
excerpt: "Krótki opis do karty na indeksie."
author: "Zespół SiteSpector"
slug: "slug-artykulu"
category: "Audyty SEO"
cover: "/images/blog/cover-slug.jpg"
```

**Helper:** `landing/src/lib/blog.ts` — `getSortedPostsData()`, `getPostData(slug)`.

---

## Uwagi designu

- Spójność z resztą landingu: Outfit font, `$primary`, `$orange`, `rounded-4`, `shadow-sm`.
- Karty artykułów: wizualnie podobne do kart case studies, ale z większym naciskiem na obraz i excerpt.
- Empty state: jeśli brak postów — komunikat „Wkrótce pojawią się pierwsze artykuły” + CTA do newslettera.
- SEO: `h1` w hero, `h2` na tytułach kart (lub `h3` jeśli hero ma `h1`). Semantic `<article>` dla każdej karty.
