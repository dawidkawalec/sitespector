---
name: Ulepszenie Wyświetlania Danych
overview: "Naprawa krytycznych błędów w wyświetlaniu danych audytu: puste URL-e, pusty Overview tab, brak szczegółów w tabelach, brak list konkretnych problemów, niejasne pochodzenie score-ów."
todos: []
isProject: false
---

# Plan: Ulepszenie Wyświetlania Danych - Frontend & Backend

## Analiza Problemów

### Zidentyfikowane Błędy:

#### 1. KRYTYCZNY: Puste URL-e w `all_pages` ❌

**Gdzie**: Baza danych - `results.crawl.all_pages[].url` = `""` (pusty string)  
**CSV ma**: `"Address": "https://matkaaptekarka.pl/"` - dane są poprawne  
**Problem**: Warunek w `screaming_frog.py` linia 156 jest błędny:

```python
elif content_type and ('text/html' in content_type.lower() or not content_type):
```

Logika jest zepsuta: `content_type and (...)` - jeśli content_type jest truthy, sprawdza warunek, ale `not content_type` nigdy się nie wykona bo jest po `and`.

**Fix wymagany**: Zmienić na:

```python
elif 'text/html' in content_type.lower() or not content_type:
```

**Impact**: BEZ tego fix wszystkie linki w tabelach nie działają!

---

#### 2. Pusty Overview Tab ⚠️

**Gdzie**: `frontend/app/audits/[id]/page.tsx` linie 1194-1224  
**Problem**: Pokazuje tylko AI summary (1-2 zdania) i info o local business  
**Brakuje**: 

- Podsumowanie wszystkich wyników (SEO, Performance, Content)
- Top 5 najważniejszych problemów
- Quick stats (ile stron, ile broken links, ile obrazów bez ALT)
- Wizualne wskaźniki postępu (progress bars)

---

#### 3. Tabele bez szczegółów - tylko płaski widok 📊

**Gdzie**: Wszystkie zakładki (Pages, Images, Links)  
**Problem**: Tabele pokazują tylko 7 kolumn, brak rozwijania  
**Brakuje**: 

- Kliknięcie w wiersz → rozwija szczegóły (meta description, H2, canonical, robots, indexability)
- Dla obrazów: gdzie jest użyty, strona źródłowa
- Dla linków: anchor text, rel attributes, follow/nofollow

**Przykład potrzebny**: Accordion/Collapsible rows lub modal z full details

---

#### 4. Brak konkretnych list problemów 📝

**Gdzie**: 

- Links tab: pokazuje "3 broken" ale NIE pokazuje KTÓRE URL-e są broken
- Technical SEO: pokazuje "5 missing canonical" ale NIE pokazuje KTÓRE strony
- Technical SEO: pokazuje "2 noindex" ale NIE pokazuje KTÓRE strony

**Obecny kod** (linie 796-834): Pokazuje TYLKO broken pages i redirects, ALE:

- Conditional rendering: `{% if broken_pages|length > 0 %}`
- Jeśli broken_pages = 0, **nie renderuje NICZEGO** - użytkownik widzi pustą sekcję

**Fix wymagany**: Zawsze pokazuj sekcję, nawet jeśli lista pusta (z komunikatem "✅ Brak broken links")

---

#### 5. Niejasne pochodzenie score-ów 🤔

**Gdzie**: Content Analysis tab  
**Problem**: 

- Quality Score: 77/100 - **skąd to?**
- Readability: 75/100 - **co to znaczy?**

**Faktycznie**: 

- `quality_score` - obliczany algorytmem w `ai_analysis.py` (odejmuje punkty za: brak title -20, za krótki title -10, brak meta -15, brak H1 -15, obrazy bez ALT -2 każdy, itd.)
- `readability_score` - **HARDCODED na 75** (mock value, linia 138 w ai_analysis.py)

**Fix wymagany**: 

- Dodać tooltip/info box wyjaśniające co oznacza każdy score
- Pokazać breakdown (co obniżyło score)
- Dla readability: użyć faktycznego Flesch Reading Ease (już dostępne w SF!)

---

#### 6. Screaming Frog data w PDF - stary format 📄

**Problem**: PDF używa STARYCH nazw pól  
**Linia 241**: `{{ seo_data.meta_desc }}`  
**Powinno być**: `{{ seo_data.meta_description }}`

**Inne błędy**:

- Linia 329: `{{ crawl_data.all_pages|length if crawl_data.all_pages else crawl_data.pages_crawled }}`
- Używa `crawl_data` zamiast `seo_data`

---

## Plan Naprawy

### PHASE 1: Backend - Krytyczne Bugi (15 min)

#### 1.1 Napraw pusty URL w all_pages

**File**: `backend/app/services/screaming_frog.py`  
**Line**: 156

**Zmień**:

```python
elif content_type and ('text/html' in content_type.lower() or not content_type):
```

**Na**:

```python
elif 'text/html' in content_type.lower() or not content_type.strip():
```

**Verification**: Test audit dla matkaaptekarka - sprawdź czy `all_pages[0].url` != ""

---

#### 1.2 Napraw readability score - użyj faktycznego Flesch

**File**: `backend/app/services/ai_analysis.py`  
**Line**: 138

**Zmień**:

```python
"readability_score": 75,  # Mock for now
```

**Na**:

```python
"readability_score": int(content_data.get("flesch_reading_ease", 0)) if content_data.get("flesch_reading_ease") else None,
```

**Dodaj do** `screaming_frog.py` w `all_pages.append()`:

```python
'flesch_reading_ease': float(row.get('Flesch Reading Ease Score', 0) or 0),
'readability': row.get('Readability', ''),
```

**Dodaj do homepage summary**:

```python
"flesch_reading_ease": float(homepage.get('Flesch Reading Ease Score', 0) or 0),
```

---

### PHASE 2: Frontend - Overview Tab Enrichment (30 min)

#### 2.1 Rozbuduj Overview Tab

**File**: `frontend/app/audits/[id]/page.tsx`  
**Lines**: 1194-1224

**Dodaj**:

```tsx
<TabsContent value="overview" className="space-y-4">
  {/* Executive Summary Cards */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Wynik Ogólny</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${getScoreColor(audit.overall_score)}`}>
          {formatScore(audit.overall_score)}
        </div>
      </CardContent>
    </Card>
    {/* SEO, Performance, Content cards */}
  </div>
  
  {/* Top Issues Section */}
  <Card>
    <CardHeader>
      <CardTitle>Top 5 Priorytetowych Problemów</CardTitle>
      <CardDescription>Najważniejsze rzeczy do naprawienia</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {audit.results?.crawl?.images?.without_alt > 0 && (
          <li className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">
                {audit.results.crawl.images.without_alt} obrazów bez ALT text
              </p>
              <p className="text-sm text-red-700">
                Krytyczne dla SEO i dostępności - dodaj opisy dla wszystkich obrazów
              </p>
            </div>
          </li>
        )}
        {/* More issues based on data */}
      </ul>
    </CardContent>
  </Card>
  
  {/* Quick Stats */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">
          {audit.results?.crawl?.pages_crawled || 0}
        </div>
        <div className="text-xs text-muted-foreground">Przeskanowanych stron</div>
      </CardContent>
    </Card>
    {/* Images, Links, Issues cards */}
  </div>
  
  {/* AI Summary */}
  {audit.results?.content_analysis?.summary && (
    <Card>
      <CardHeader>
        <CardTitle>Wnioski AI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{audit.results.content_analysis.summary}</p>
      </CardContent>
    </Card>
  )}
</TabsContent>
```

---

### PHASE 3: Frontend - Rozwijane Szczegóły (1 hour)

#### 3.1 Dodaj expandable rows do All Pages table

**File**: `frontend/app/audits/[id]/page.tsx`  
**Pattern**: Dodaj state `expandedRow` i renderuj szczegóły pod każdym wierszem

**Kod**:

```tsx
const [expandedRow, setExpandedRow] = useState<number | null>(null)

// W tbody:
{paginated.map((page: any, i: number) => (
  <>
    <tr 
      key={i} 
      className="border-b hover:bg-muted/50 cursor-pointer"
      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
    >
      {/* Existing columns */}
    </tr>
    
    {/* Expanded details row */}
    {expandedRow === i && (
      <tr className="bg-muted/30">
        <td colSpan={7} className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Meta Description:</strong>
              <p className="text-muted-foreground mt-1">
                {page.meta_description || 'Brak'}
              </p>
            </div>
            <div>
              <strong>H2 Nagłówki:</strong>
              <p className="text-muted-foreground mt-1">{page.h2 || '-'}</p>
            </div>
            <div>
              <strong>Canonical:</strong>
              <a href={page.canonical} className="text-blue-600 hover:underline break-all">
                {page.canonical || 'Brak'}
              </a>
            </div>
            <div>
              <strong>Meta Robots:</strong>
              <Badge variant={page.meta_robots?.includes('noindex') ? 'destructive' : 'default'}>
                {page.meta_robots || 'brak'}
              </Badge>
            </div>
            <div>
              <strong>Indexability:</strong>
              <Badge>{page.indexability}</Badge>
            </div>
            <div>
              <strong>Outlinks:</strong> {page.outlinks} (w tym {page.external_outlinks} zewnętrzne)
            </div>
            {page.redirect_url && (
              <div className="col-span-2">
                <strong>Redirect do:</strong>
                <a href={page.redirect_url} className="text-blue-600 hover:underline ml-2">
                  {page.redirect_url}
                </a>
              </div>
            )}
          </div>
        </td>
      </tr>
    )}
  </>
))}
```

---

#### 3.2 Dodaj szczegóły dla Images

**Pattern**: Similar expandable rows showing:

- Gdzie obraz jest użyty (source pages)
- Dimensions (if available in SF data)
- Compression ratio
- Recommendations (optimize if > 100KB)

---

### PHASE 4: Frontend - Wyjaśnienia Score-ów (20 min)

#### 4.1 Dodaj Info Box dla Quality Score

**File**: `frontend/app/audits/[id]/page.tsx` - Content tab

**Dodaj przed wyświetleniem score**:

```tsx
<div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border mb-4">
  <h4 className="font-semibold text-sm mb-2">
    ℹ️ Skąd pochodzi Quality Score?
  </h4>
  <p className="text-xs text-muted-foreground">
    Wynik jakości treści jest obliczany automatycznie na podstawie:
  </p>
  <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc pl-5">
    <li>Title tag (długość 30-70 znaków): -20 pkt jeśli brak, -10 za krótki</li>
    <li>Meta description (120-170 znaków): -15 pkt jeśli brak</li>
    <li>Tag H1 (dokładnie 1): -15 pkt jeśli brak</li>
    <li>Obrazy z ALT: -2 pkt za każdy obraz bez ALT</li>
    <li>Liczba słów (min 300): -10 pkt jeśli mniej</li>
  </ul>
  <p className="text-xs text-muted-foreground mt-2">
    <strong>Start: 100 punktów</strong> → odejmowane za każdy problem
  </p>
</div>

<div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border mb-4">
  <h4 className="font-semibold text-sm mb-2">
    ℹ️ Co to jest Readability Score?
  </h4>
  <p className="text-xs text-muted-foreground">
    Wynik czytelności używa algorytmu <strong>Flesch Reading Ease</strong>:
  </p>
  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
    <li>90-100: Bardzo łatwy (dzieci 11 lat)</li>
    <li>60-70: Łatwy (uczniowie 13-15 lat)</li>
    <li>30-50: Trudny (studenci)</li>
    <li>0-30: Bardzo trudny (absolwenci)</li>
  </ul>
  <p className="text-xs text-muted-foreground mt-2">
    <strong>Twój wynik: {audit.results?.content_analysis?.readability_score || 0}</strong>
  </p>
</div>
```

---

### PHASE 5: Frontend - Konkretne Listy Problemów (45 min)

#### 5.1 Rozszerz Links Tab - lista konkretnych broken links

**File**: `frontend/app/audits/[id]/page.tsx` linie 796-834

**Obecnie**: Pokazuje broken pages TYLKO jeśli są (`{brokenPages.length > 0 && ...}`)  
**Problem**: Jeśli brak broken - pokazuje NICZEGO - użytkownik widzi pustą zakładkę

**Fix**:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      {brokenPages.length > 0 ? (
        <>
          <AlertCircle className="h-5 w-5 text-red-600" />
          Broken Links - Wymagają Naprawy! ({brokenPages.length})
        </>
      ) : (
        <>
          <CheckCircle className="h-5 w-5 text-green-600" />
          Broken Links ({brokenPages.length})
        </>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {brokenPages.length > 0 ? (
      <div className="rounded-md border">
        {/* Table with broken links */}
      </div>
    ) : (
      <div className="text-center py-8 text-muted-foreground">
        ✅ Brak broken links - wszystkie strony działają poprawnie!
      </div>
    )}
  </CardContent>
</Card>
```

**Dodaj podobnie**:

- Lista stron BEZ canonical (z linkami do naprawy)
- Lista stron z noindex (z info czy zamierzone)
- Lista wszystkich redirects z łańcuchami (source → target → final)

---

#### 5.2 Rozszerz Technical SEO Tab - więcej szczegółów

**File**: `frontend/app/audits/[id]/page.tsx` linie 869-917

**Dodaj sekcje**:

```tsx
{/* Detailed breakdown - always visible */}
<Card>
  <CardHeader>
    <CardTitle>Strony bez Canonical Tag</CardTitle>
    <CardDescription>
      {missingCanonical.length} z {pages.length} stron
      ({((missingCanonical.length / pages.length) * 100).toFixed(1)}%)
    </CardDescription>
  </CardHeader>
  <CardContent>
    {missingCanonical.length > 0 ? (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {missingCanonical.slice(0, 100).map((page: any, i: number) => (
          <div key={i} className="p-3 bg-muted rounded-md flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <a 
                href={page.url} 
                target="_blank"
                className="font-mono text-xs text-blue-600 hover:underline block truncate"
              >
                {page.url}
              </a>
              <p className="text-xs text-muted-foreground mt-1">
                {page.title || 'Brak title'}
              </p>
            </div>
            <Badge variant="secondary">Status: {page.status_code}</Badge>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center py-4 text-muted-foreground">
        ✅ Wszystkie strony mają canonical tag!
      </p>
    )}
  </CardContent>
</Card>
```

**Podobnie dla**:

- Strony z noindex
- Strony z redirect chains
- Strony z długim response time (> 2s)

---

### PHASE 6: PDF Template - Napraw nazwy pól (10 min)

#### 6.1 Fix field names

**File**: `backend/templates/report.html`

**Znajdź i zamień**:

- Linia 194: `crawl.meta_desc` → `crawl.meta_description`
- Linia 329: `crawl_data.all_pages` → `seo_data.all_pages`
- Wszystkie `crawl_data.*` w sekcjach 3-8 → `seo_data.*`

**Dodaj warunkowe renderowanie**:

```jinja2
{% if seo_data.all_pages and seo_data.all_pages|length > 0 %}
  <!-- Show tables -->
{% else %}
  <p>Brak danych o stronach.</p>
{% endif %}
```

---

### PHASE 7: Frontend - Rozwijane Szczegóły Per Strona (1 hour)

#### 7.1 Stwórz modal/dialog z pełnymi szczegółami strony

**New Component**: `frontend/components/PageDetailsDialog.tsx`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PageDetailsDialogProps {
  page: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PageDetailsDialog({ page, open, onOpenChange }: PageDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Szczegóły strony
            <Badge>{page.status_code}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* URL Section */}
          <div>
            <h4 className="font-semibold text-sm mb-2">URL</h4>
            <a 
              href={page.url} 
              target="_blank"
              className="text-blue-600 hover:underline font-mono text-xs break-all"
            >
              {page.url}
            </a>
          </div>
          
          {/* SEO Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Title Tag</h4>
              <p className="text-sm">{page.title || 'Brak'}</p>
              <p className="text-xs text-muted-foreground">
                Długość: {page.title_length} znaków
                {page.title_length < 30 && ' (za krótki)'}
                {page.title_length > 70 && ' (za długi)'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Meta Description</h4>
              <p className="text-sm">{page.meta_description || 'Brak'}</p>
              <p className="text-xs text-muted-foreground">
                Długość: {page.meta_description_length} znaków
              </p>
            </div>
          </div>
          
          {/* Nagłówki */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Nagłówki</h4>
            <div className="space-y-2">
              <div>
                <Badge>H1</Badge>
                <p className="text-sm mt-1">{page.h1 || 'Brak'}</p>
              </div>
              {page.h2 && (
                <div>
                  <Badge>H2</Badge>
                  <p className="text-sm mt-1">{page.h2}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Technical SEO */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Techniczne SEO</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Canonical:</span>
                <a href={page.canonical} className="text-blue-600 hover:underline ml-2 break-all">
                  {page.canonical || 'Brak'}
                </a>
              </div>
              <div>
                <span className="text-muted-foreground">Meta Robots:</span>
                <Badge className="ml-2">{page.meta_robots || 'brak'}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Indexability:</span>
                <Badge className="ml-2">{page.indexability}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Readability (Flesch):</span>
                <span className="ml-2">{page.flesch_reading_ease || '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Performance */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Wydajność</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">Response Time</p>
                <p className="text-lg font-bold">
                  {Math.round(page.response_time * 1000)} ms
                </p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-lg font-bold">
                  {Math.round(page.size_bytes / 1024)} KB
                </p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">Word Count</p>
                <p className="text-lg font-bold">{page.word_count}</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">Inlinks</p>
                <p className="text-lg font-bold">{page.inlinks}</p>
              </div>
            </div>
          </div>
          
          {/* SEO Analysis */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Analiza SEO tej strony</h4>
            <ul className="space-y-2 text-sm">
              {!page.title && (
                <li className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Brak title tag
                </li>
              )}
              {page.title_length < 30 && page.title && (
                <li className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Title za krótki ({page.title_length} znaków)
                </li>
              )}
              {!page.meta_description && (
                <li className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Brak meta description
                </li>
              )}
              {!page.canonical && (
                <li className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Brak canonical tag
                </li>
              )}
              {page.word_count < 300 && (
                <li className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Za mało treści ({page.word_count} słów, zalecane min. 300)
                </li>
              )}
              {page.response_time > 2 && (
                <li className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Bardzo wolna strona ({Math.round(page.response_time * 1000)}ms)
                </li>
              )}
              {/* If everything is OK */}
              {page.title && page.title_length >= 30 && page.meta_description && 
               page.canonical && page.word_count >= 300 && page.response_time <= 2 && (
                <li className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Strona dobrze zoptymalizowana!
                </li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Użycie w tabeli**:

```tsx
const [selectedPage, setSelectedPage] = useState<any | null>(null)

<td className="p-3">
  <Button 
    variant="outline" 
    size="sm"
    onClick={(e) => {
      e.stopPropagation()
      setSelectedPage(page)
    }}
  >
    Szczegóły
  </Button>
</td>

{/* Outside table */}
{selectedPage && (
  <PageDetailsDialog 
    page={selectedPage}
    open={!!selectedPage}
    onOpenChange={(open) => !open && setSelectedPage(null)}
  />
)}
```

---

### PHASE 8: PDF Template - Dodaj więcej szczegółów (30 min)

#### 8.1 Rozszerz sekcje o konkretne dane

**Sekcja 3 - All Pages**: Dodaj kolumnę z meta description  
**Sekcja 5 - Images**: Dodaj kolumnę "Gdzie używany" (source page)  
**Sekcja 6 - Links**: Dodaj redirect chains (A → B → C)  
**Sekcja 8 - Technical**: Lista stron z noindex z wyjaśnieniem

---

## Deployment Plan

### 1. Backend Changes

```bash
# Local
git add backend/app/services/screaming_frog.py backend/app/services/ai_analysis.py
git commit -m "fix(backend): repair empty URLs + real readability score"

# VPS
ssh root@77.42.79.46
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml build worker backend
docker compose -f docker-compose.prod.yml up -d worker backend
```

### 2. Frontend Changes

```bash
# Local
git add frontend/app/audits/[id]/page.tsx frontend/components/PageDetailsDialog.tsx
git commit -m "feat(frontend): expandable rows + score explanations + overview enrichment"

# VPS
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### 3. Verification

```bash
# Create new test audit
TOKEN=$(curl -k -X POST https://77.42.79.46/api/auth/login ...)
AUDIT=$(curl -k -X POST https://77.42.79.46/api/audits ...)

# Wait 2-3 min, then check:
# 1. all_pages[0].url is NOT empty
# 2. Overview tab shows full summary
# 3. Click row in All Pages table → shows full details
# 4. Links tab shows "✅ Brak broken links" if none
# 5. Content tab has info boxes explaining scores
```

---

## Priority Order

### Must Fix (CRITICAL):

1. **Pusty URL bug** - bez tego ŻADNE linki nie działają
2. **Overview tab** - użytkownik widzi pustą zakładkę
3. **Readability score** - używaj faktycznego Flesch zamiast mock

### Should Fix (HIGH):

1. **Rozwijane szczegóły** - użytkownik chce zobaczyć więcej per strona
2. **Wyjaśnienia score-ów** - nikt nie wie co znaczą liczby
3. **Konkretne listy** - broken links, noindex, canonical (z URL-ami!)

### Nice to Have (MEDIUM):

1. **PDF field names** - napraw stare nazwy pól
2. **Conditional rendering** - zawsze pokazuj sekcje (nawet jeśli puste)

---

## Expected Results

### Po naprawie użytkownik zobaczy:

**Overview Tab**:

- 4 duże karty z wynikami (Overall, SEO, Performance, Content)
- Top 5 priorytetowych problemów (z kolorami i ikonami)
- Quick stats (strony, obrazy, linki, issues)
- AI summary na dole

**All Pages Tab**:

- Działające linki do każdej strony (nie do audytu!)
- Kliknięcie w wiersz → pełne szczegóły w modal/expandable
- W szczegółach: meta description, H2, canonical, robots, indexability, readability, SEO analysis

**Images Tab**:

- Lista wszystkich obrazów z URL-ami
- Gdzie każdy obraz jest użyty
- Recommendations dla dużych obrazów (> 100KB)

**Links Tab**:

- ZAWSZE pokazuje sekcje (nawet jeśli 0 broken)
- Konkretna lista broken links z URL-ami
- Redirect chains: A → B → C (dla wielopoziomowych)
- External links lista (top 50)

**Technical SEO Tab**:

- Lista stron bez canonical (z przyciskiem "Kopiuj URL")
- Lista stron noindex (z info czy zamierzone)
- Szczegóły per strona

**Content Tab**:

- Info box: skąd pochodzi Quality Score
- Info box: co to jest Readability (Flesch)
- Breakdown: co obniżyło score (-20 za brak title, -15 za brak meta, itd.)

**PDF**:

- Wszystkie nowe sekcje z poprawnymi nazwami pól
- Więcej szczegółów w tabelach (meta description, flesch score)
- Warunkowe renderowanie (brak pustych sekcji)

---

## Estimated Effort

- Backend fixes: **25 min**
- Frontend Overview + Info boxes: **45 min**
- Frontend Expandable rows + Dialog: **1.5 hours**
- PDF template fixes: **20 min**
- Testing + Deploy: **30 min**

**Total**: ~3.5 hours

---

## Risks & Mitigation

**Risk 1**: Condition `elif content_type and (...)` może nie działać dla pustych content_type  
**Mitigation**: Zmień na `elif 'text/html' in (content_type or '').lower() or not content_type:`

**Risk 2**: Expandable rows mogą być wolne dla 1000+ stron  
**Mitigation**: Użyj virtual scrolling lub limit do 100 wierszy per page

**Risk 3**: Modal z szczegółami może być overwhelm for user  
**Mitigation**: Organize data in tabs/sections within modal