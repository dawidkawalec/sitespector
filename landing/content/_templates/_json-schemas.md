# JSON Content Schemas

Dokumentacja schematów plików JSON w `content/data/`.

## hero.json

```json
{
  "section_id": "home",
  "badge": "opcjonalny tekst badge",
  "headline": "Główny nagłówek",
  "headline_highlight": "Słowo do podkreślenia",
  "subheadline": "Opis pod nagłówkiem",
  "cta_primary": { "text": "Tekst", "href": "/link" },
  "cta_secondary": { "text": "Tekst", "href": "#hash" },
  "image": {
    "src": "/images/hero/nazwa.png",
    "alt": "Opis alternatywny",
    "placeholder": "PLACEHOLDER: Opis — wymiary"
  }
}
```

## about-features.json

```json
{
  "section_id": "about",
  "section_label": "ETYKIETA SEKCJI",
  "title": "Tytuł sekcji",
  "items": [
    {
      "title": "Nazwa funkcji",
      "subtitle": "Podtytuł",
      "description": "Opis",
      "icon": { "src": "/images/icons/nazwa.png", "placeholder": "PLACEHOLDER: Opis — 80x80px" }
    }
  ]
}
```

## testimonials.json

```json
{
  "section_id": "testimonials",
  "section_label": "ETYKIETA",
  "title": "Tytuł",
  "items": [
    {
      "name": "Imię N.",
      "role": "Stanowisko",
      "company": "Firma",
      "quote": "Tekst opinii",
      "rating": 5,
      "avatar": { "src": "/images/testimonials/nazwa.jpg", "placeholder": "PLACEHOLDER: Opis — 150x150px" }
    }
  ]
}
```

## pricing.json

```json
{
  "section_id": "price",
  "section_label": "ETYKIETA",
  "title": "Tytuł",
  "plans": [
    {
      "name": "Nazwa planu",
      "price": "$X",
      "period": "/mc",
      "description": "Opis",
      "is_popular": false,
      "features": ["Feature 1", "Feature 2"],
      "cta": { "text": "Tekst", "href": "/link", "variant": "primary|outline-primary" }
    }
  ]
}
```

## faq.json

```json
{
  "section_id": "faq",
  "section_label": "ETYKIETA",
  "title": "Tytuł",
  "items": [
    { "question": "Pytanie?", "answer": "Odpowiedź." }
  ]
}
```

## metadata.json

```json
{
  "slug-strony": {
    "title": "Tytuł SEO — max 60 znaków",
    "description": "Meta description — max 160 znaków",
    "og_image": { "src": "/images/og/slug.png", "placeholder": "PLACEHOLDER: Opis — 1200x630px" },
    "keywords": ["keyword1", "keyword2"]
  }
}
```

## navigation.json

```json
{
  "topbar": {
    "logo": { "text": "SiteSpector", "icon": "RiSearchEyeFill" },
    "sections": [
      { "id": "id", "label": "Label", "href": "/link", "is_hash": true }
    ],
    "cta": { "text": "Tekst", "href": "/link" }
  },
  "footer": {
    "description": "Opis w stopce",
    "newsletter": { "heading": "Nagłówek", "placeholder": "Email placeholder" },
    "columns": [
      {
        "title": "Tytuł kolumny",
        "links": [{ "label": "Link", "href": "/link" }]
      }
    ]
  }
}
```
