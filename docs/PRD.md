# Product Requirements Document (PRD)
## SiteSpector.app - MVP (Etap 1)

**Wersja:** 1.0  
**Data:** 2025-12-04  
**Status:** Draft  
**Autor:** Architekt AI  

---

## 📋 Executive Summary

**SiteSpector.app** to inteligentna platforma do audytu techniczno-SEO stron internetowych, która łączy tradycyjne narzędzia crawlerów z zaawansowaną analizą AI (Claude Sonnet 4). 

**Główna wartość:** Dostarczamy nie tylko dane techniczne, ale **konkretne rekomendacje z gotowym kodem do wdrożenia** - dzięki czemu klient wie nie tylko "co jest źle", ale także "jak to naprawić".

**Target market (MVP):** Rynek polski - agencje marketingowe, freelancerzy SEO, właściciele małych/średnich firm.

**Business model:**
- Subskrypcja miesięczna (recurring revenue)
- Pay-per-report (jednorazowe zakupy)

**Key Differentiator:**
- 🤖 **AI-powered recommendations** (nie tylko scoring, ale konkretne instrukcje)
- 📋 **Ready-to-implement code** (Schema.org, meta tags, fix snippets)
- 🎯 **Auto-detection Local SEO** (wykrywa local business i dostosowuje raport)
- 📊 **Competitive benchmarking** (porównanie z 3 konkurentami)

---

## 🎯 Problem Statement

### Problemy obecnych rozwiązań:

**Screaming Frog / Semrush Site Audit:**
- ✅ Świetne dane techniczne
- ❌ Brak **konkretnych rekomendacji** (tylko "co jest źle", nie "jak naprawić")
- ❌ Brak **AI insights** (nie rozumie kontekstu biznesowego)
- ❌ Raport techniczny, niezrozumiały dla klienta końcowego

**ChatGPT / Claude (ręczna analiza):**
- ✅ Może generować rekomendacje
- ❌ Nie ma dostępu do **realnych danych technicznych** (Core Web Vitals, crawl data)
- ❌ Wymaga ręcznego wklejania danych
- ❌ Brak automatyzacji

### Rozwiązanie SiteSpector:

**Łączymy:**
1. **Głęboki crawl** (Screaming Frog CLI) → dane techniczne
2. **Performance metrics** (Google Lighthouse) → Core Web Vitals
3. **AI analysis** (Claude Sonnet 4) → kontekstowe rekomendacje + gotowy kod
4. **Profesjonalny PDF** → prezentacja dla klienta

**Rezultat:** Kompleksowy raport w 5-10 minut, który klient może natychmiast wdrożyć.

---

## 👥 User Personas

### Persona 1: "Agnieszka - SEO Specialist w Agencji"
- **Wiek:** 28 lat
- **Doświadczenie:** 3 lata w SEO
- **Pain points:**
  - Musi dostarczać raporty audytowe klientom co tydzień
  - Screaming Frog daje surowe dane, musi ręcznie je interpretować
  - Klient pyta "co mam zrobić?" - potrzebuje konkretów
- **Goals:**
  - Automatyzacja audytów (mniej czasu, więcej klientów)
  - Profesjonalnie wyglądające raporty PDF
  - Gotowe rekomendacje, które może przekazać deweloperom
- **How SiteSpector helps:**
  - ✅ Wkleja URL → 10 minut → gotowy raport PDF z kodem do wdrożenia
  - ✅ Może rebrandować raport (white-label) dla swojego klienta

### Persona 2: "Marek - Właściciel E-commerce"
- **Wiek:** 42 lata
- **Firma:** Sklep z elektroniką (5M PLN rocznego obrotu)
- **Pain points:**
  - Nie rozumie żargonu technicznego ("co to jest LCP?")
  - Wie, że strona "powinna być szybsza", ale nie wie jak to zmierzyć
  - Dostał ofertę od agencji SEO za 10k PLN - nie wie czy to uczciwa cena
- **Goals:**
  - Zrozumieć "co jest nie tak" z jego stroną
  - Otrzymać konkretną listę zadań dla programisty
  - Zaoszczędzić na agencji (jeśli może to zrobić sam)
- **How SiteSpector helps:**
  - ✅ Prosty, wizualny raport z wyjaśnieniami "po ludzku"
  - ✅ Priorytetyzacja: "zacznij od tego, bo da największy efekt"
  - ✅ Gotowy checklist do przekazania programiście

### Persona 3: "Tomasz - Freelancer Web Developer"
- **Wiek:** 35 lat
- **Specjalizacja:** WordPress + SEO
- **Pain points:**
  - Klienci pytają "czy moja strona jest dobrze zoptymalizowana?"
  - Nie ma czasu robić manualnych audytów
  - Chce dodać audyty jako **dodatkową usługę** (upsell)
- **Goals:**
  - Szybki audyt przed przekazaniem strony klientowi
  - Pokazać "value" swojej pracy (przed/po optymalizacji)
  - Generować leady (darmowy audyt → kontrakt na poprawki)
- **How SiteSpector helps:**
  - ✅ Darmowy/tani audyt do wykorzystania jako lead magnet
  - ✅ Może porównać "przed optymalizacją" vs "po" (history tracking w Etap 2)
  - ✅ Gotowy raport do wysłania klientowi

---

## 🎯 Functional Requirements (MVP - Etap 1)

### FR-1: User Authentication & Management
**Priority:** MUST HAVE

**User stories:**
- Jako user, chcę się zarejestrować (email + hasło), aby mieć dostęp do platformy
- Jako user, chcę się zalogować, aby zobaczyć moje raporty
- Jako user, chcę zobaczyć dashboard z historią moich audytów

**Acceptance criteria:**
- ✅ Rejestracja: email, hasło (min 8 znaków), confirmation email (opcjonalne w MVP)
- ✅ Login: JWT token (expires 7 days)
- ✅ Dashboard: lista audytów (URL, data, status, download PDF button)
- ✅ Logout functionality

**Tech:**
- FastAPI + JWT tokens
- PostgreSQL (users table)
- bcrypt password hashing

---

### FR-2: Audit Creation (Single URL)
**Priority:** MUST HAVE

**User stories:**
- Jako user, chcę wkleić URL strony i uruchomić audyt
- Jako user, chcę opcjonalnie podać 1-3 URLe konkurentów do porównania
- Jako user, chcę widzieć status audytu (processing / completed / failed)

**Acceptance criteria:**
- ✅ Form: URL input (validation: must be valid URL with https://)
- ✅ Optional: 3 competitor URLs (same validation)
- ✅ "Start Audit" button → triggers backend job
- ✅ Status polling (loading spinner) → redirect to results when done
- ✅ Error handling: invalid URL, timeout (>5min), site unreachable

**Tech:**
- Frontend: Next.js form + loading state
- Backend: POST /api/audits/create → returns audit_id
- Job queue: In-memory queue (MVP) → Redis queue (Etap 2)

---

### FR-3: Technical SEO Analysis (Screaming Frog CLI)
**Priority:** MUST HAVE

**What we crawl:**
- ✅ Meta tags (title, description, robots, canonical)
- ✅ Headers (H1-H6 structure)
- ✅ Images (src, alt, size)
- ✅ Internal links (count, anchor text)
- ✅ HTTP status codes (200, 301, 404, 500)
- ✅ Schema.org markup (JSON-LD, Microdata)
- ✅ Robots.txt & Sitemap.xml validation

**Output:**
- JSON file with structured data
- Stored in PostgreSQL (results table)

**Tech:**
- Screaming Frog CLI (Docker container)
- Python subprocess to run CLI + parse output
- Data normalization before storing

---

### FR-4: Core Web Vitals Analysis (Lighthouse)
**Priority:** MUST HAVE

**Metrics:**
- ✅ LCP (Largest Contentful Paint)
- ✅ INP (Interaction to Next Paint)
- ✅ CLS (Cumulative Layout Shift)
- ✅ TTFB (Time to First Byte)
- ✅ Speed Index
- ✅ Total Blocking Time

**Additional:**
- ✅ Performance score (0-100)
- ✅ Accessibility score (0-100)
- ✅ Best Practices score (0-100)
- ✅ SEO score (0-100)

**Output:**
- Lighthouse JSON report
- Desktop + Mobile results (2 separate runs)

**Tech:**
- Google Lighthouse CLI (Docker container)
- Chrome Headless
- JSON parsing + storage

---

### FR-5: AI-Powered Content Analysis (Claude Sonnet 4)
**Priority:** MUST HAVE

**What AI analyzes:**
- ✅ Content quality (tone, professionalism, engagement)
- ✅ Readability scores (Flesch, Fog Index)
- ✅ Keyword density & LSI keywords
- ✅ Content length (vs optimal 1200-1500 words)
- ✅ CTA analysis (placement, effectiveness)
- ✅ Competitor content comparison

**Output:**
- Text insights (markdown format)
- Concrete recommendations with examples
- Priority level (HIGH / MEDIUM / LOW)

**AI Prompt structure:**
```
System: You are an expert SEO analyst...
User: Analyze this website content:
[scraped HTML]
[Lighthouse metrics]
[Competitor data]

Return:
1. Content quality score (0-100)
2. Top 3 issues
3. Concrete recommendations with code examples
```

**Tech:**
- Anthropic Claude API (Sonnet 4)
- Token management (estimate: 10k-20k tokens per audit)
- Prompt templates (stored in codebase)

---

### FR-6: Local SEO Auto-Detection
**Priority:** MUST HAVE

**Detection logic:**
```python
if (found_address AND found_phone) OR found_opening_hours:
    is_local_business = True
    → trigger Local SEO analysis
```

**What we check:**
- ✅ NAP (Name, Address, Phone) in HTML
- ✅ LocalBusiness Schema.org presence
- ✅ Google Maps embed detection
- ✅ OpeningHours markup

**Output:**
- Boolean: is_local_business
- If TRUE → add "Local SEO" section to report
- If FALSE → skip section

**AI enhancement:**
- AI validates if detected address is real (not just "ul. Przykładowa 1")
- AI suggests LocalBusiness schema JSON-LD (ready to implement)

---

### FR-7: Competitive Analysis
**Priority:** MUST HAVE

**What we compare (user's site vs 3 competitors):**
- ✅ Core Web Vitals (LCP, INP, CLS)
- ✅ Content length (word count)
- ✅ Schema.org presence (boolean)
- ✅ Meta tags quality (has description? keyword-optimized?)
- ✅ Performance score (Lighthouse overall)

**Output:**
- Comparison table (markdown → rendered in PDF)
- AI insights: "Competitor B uses VideoObject schema, which gets 3x more clicks"

**Edge cases:**
- If competitor URL fails (404, timeout) → show "N/A" in table
- If no competitors provided → skip section

---

### FR-8: Readability Scores
**Priority:** MUST HAVE

**Metrics:**
- ✅ Flesch Reading Ease (0-100, higher = easier)
- ✅ Fog Index (years of education needed)
- ✅ Average sentence length
- ✅ Complex words percentage

**Benchmarks:**
- 60-70: Standard (8th-9th grade level) ✅ GOOD
- 50-60: Fairly difficult (10th-12th grade)
- 30-50: Difficult (college level) ⚠️
- 0-30: Very difficult (academic) ❌

**AI enhancement:**
- AI explains why score is low (e.g., "too much medical jargon")
- AI suggests simplified alternatives (e.g., "endodoncja" → "leczenie kanałowe")

**Tech:**
- Python library: `textstat`
- Input: extracted text from HTML (strip tags)

---

### FR-9: PDF Report Generation
**Priority:** MUST HAVE

**Structure:** (see REPORT_TEMPLATE.md for full details)
1. Cover Page (logo, URL, overall score)
2. Executive Summary (1-2 pages)
3. SEO Technical Audit (5-8 pages)
4. Core Web Vitals (3-5 pages)
5. Content Analysis (3-4 pages)
6. Local SEO (2 pages, if detected)
7. Competitive Analysis (2-3 pages)
8. Action Plan (2-3 pages)
9. Appendix (5-10 pages with code snippets)

**Visual elements:**
- ✅ Charts: bar charts (performance), gauge charts (readability), comparison tables
- ✅ Color coding: ✅ Green (good), ⚠️ Yellow (warning), ❌ Red (critical)
- ✅ Icons: 🔍 SEO, ⚡ Performance, 📝 Content, 📍 Local
- ✅ Code blocks: syntax-highlighted JSON-LD, HTML snippets

**Tech:**
- Python library: `reportlab` or `WeasyPrint` (HTML → PDF)
- Template: Jinja2 HTML template → convert to PDF
- Assets: logo, fonts (embedded in PDF)

**File naming:**
```
sitespector_audit_{domain}_{timestamp}.pdf
Example: sitespector_audit_example.com_20251204.pdf
```

---

### FR-10: Dashboard & Results View
**Priority:** MUST HAVE

**Dashboard features:**
- ✅ List of all audits (table view)
- ✅ Columns: URL, Date, Overall Score, Status, Actions (View/Download PDF)
- ✅ Filters: Status (All / Completed / Failed), Date range
- ✅ Search: by URL
- ✅ Pagination (20 items per page)

**Single audit view:**
- ✅ Overall score (big number + color)
- ✅ Score breakdown: SEO (x/100), Performance (x/100), Content (x/100)
- ✅ Quick wins section (top 5 issues)
- ✅ Full report preview (collapsible sections)
- ✅ Download PDF button

**Tech:**
- Next.js + Tailwind + shadcn/ui
- Components: DataTable, Badge, Card, Button, Dialog
- API: GET /api/audits (list), GET /api/audits/:id (single)

---

### FR-11: Ready-to-Implement Code Snippets
**Priority:** MUST HAVE

**Appendix sections with copy-paste code:**

**A. Schema.org JSON-LD**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Dentysta Premium",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ul. Mokotowska 12",
    "addressLocality": "Warszawa",
    "postalCode": "00-001",
    "addressCountry": "PL"
  },
  "telephone": "+48 123 456 789",
  "openingHours": "Mo-Fr 09:00-18:00"
}
```

**B. Optimized Meta Tags**
```html
<title>Dentysta Warszawa Mokotów - Implanty i Protetyka | Dentysta Premium</title>
<meta name="description" content="Dentysta w Warszawie Mokotów. Implanty, protetyka, stomatologia estetyczna. ✨ Bezbolesne zabiegi. Umów wizytę: 📞 +48 123 456 789">
```

**C. Image Optimization (Lazy Loading)**
```html
<img src="hero.webp" 
     width="1920" 
     height="1080" 
     alt="Nowoczesny gabinet dentystyczny"
     loading="lazy">
```

**D. CLS Fix (Layout Shift Prevention)**
```css
/* Before: image causes layout shift */
img {
  display: block;
}

/* After: reserve space to prevent shift */
img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}
```

**Tech:**
- AI generates these snippets based on detected issues
- Syntax highlighting in PDF
- "Copy to clipboard" button in web view (Etap 2)

---

## 🚫 Non-Functional Requirements

### NFR-1: Performance
- ✅ Single audit completion time: **< 10 minutes**
- ✅ Dashboard load time: **< 2 seconds**
- ✅ PDF generation time: **< 30 seconds**
- ✅ API response time (non-audit endpoints): **< 500ms**

### NFR-2: Scalability
- ✅ Support **100 concurrent audits** (MVP target)
- ✅ Database: PostgreSQL handles **10k+ audit records**
- ✅ Railway: auto-scaling if traffic spikes

### NFR-3: Reliability
- ✅ Uptime: **99% SLA** (MVP acceptable)
- ✅ Error handling: graceful degradation (if Screaming Frog fails, still show Lighthouse data)
- ✅ Timeouts: hard limit of **10 minutes per audit** (then mark as failed)

### NFR-4: Security
- ✅ HTTPS only (Railway provides SSL)
- ✅ Password hashing: bcrypt (cost factor: 12)
- ✅ JWT expiration: 7 days
- ✅ Rate limiting: **5 audits per hour per user** (prevent abuse)
- ✅ CORS: only allow sitespector.app domain

### NFR-5: Usability
- ✅ Mobile-responsive dashboard (Tailwind breakpoints)
- ✅ Accessibility: WCAG 2.1 AA compliance (keyboard navigation, screen reader support)
- ✅ Loading states: spinners, progress bars
- ✅ Error messages: clear, actionable (not "Error 500", but "Site unreachable - check URL")

### NFR-6: Maintainability
- ✅ Code documentation: docstrings for all functions
- ✅ Type hints: Python type annotations
- ✅ Linting: Black (Python), Prettier (JS)
- ✅ Git workflow: main branch (production), dev branch (staging)

---

## 📊 Success Metrics (KPIs)

### Business Metrics:
- **Signups:** 100 users in first month (MVP launch)
- **Conversion rate:** 20% free → paid
- **MRR (Monthly Recurring Revenue):** 5k PLN by month 3
- **Churn rate:** < 10% monthly

### Product Metrics:
- **Audits per user:** avg 5 audits/month
- **Time to first audit:** < 5 minutes after signup
- **PDF download rate:** > 80% (users find value in report)
- **Repeat usage:** 60% users run 2nd audit within 7 days

### Technical Metrics:
- **Audit success rate:** > 95% (< 5% failures due to timeout/errors)
- **Average audit time:** 5-7 minutes
- **API uptime:** 99%

---

## 🚫 Out of Scope (Not in MVP)

### ❌ Deferred to Etap 2:
- Screenshots + visual UI/UX analysis
- Multi-page crawl (only single URL in MVP)
- Historical tracking (time-series data)
- White-label customization (custom branding)
- Email notifications (when audit completes)

### ❌ Deferred to Etap 3:
- Ahrefs integration (backlink analysis)
- International markets (multi-language)
- Advanced competitive intelligence (keyword gap analysis)
- API access for developers

### ❌ Never (Not aligned with vision):
- Social media audits (out of scope)
- PPC / Google Ads analysis (different product)
- Keyword rank tracking (different product)

---

## 🛣️ Roadmap

### Phase 1: MVP (Etap 1) - 6 weeks
**Week 1-2:** Infrastructure + Backend
- Railway setup, Docker, PostgreSQL
- FastAPI endpoints (auth, audits CRUD)

**Week 3-4:** Core Features
- Screaming Frog integration
- Lighthouse integration
- AI analysis pipeline (Claude)

**Week 5:** Frontend + PDF
- Next.js dashboard
- PDF generation

**Week 6:** Testing + Launch
- QA, bug fixes
- Soft launch (beta users)

### Phase 2: Etap 2 - 4 weeks
- Screenshots + UI/UX analysis
- Multi-page crawl
- Historical tracking

### Phase 3: Etap 3 - 6 weeks
- Ahrefs integration
- Worldwide support
- API for developers

---

## 💰 Pricing Strategy (Initial)

### Tier 1: Starter (99 PLN/month)
- 10 audits/month
- Single URL analysis
- PDF export
- Email support

### Tier 2: Professional (299 PLN/month)
- 50 audits/month
- Competitive analysis (3 competitors)
- Priority support
- White-label reports (Etap 2)

### Tier 3: Agency (799 PLN/month)
- Unlimited audits
- Multi-user accounts (team)
- API access (Etap 3)
- Dedicated account manager

### Pay-per-report: 29 PLN/audit
- No subscription
- One-time purchase
- Full feature access per audit

---

## ✅ Definition of Done (MVP)

MVP is considered complete when:
- ✅ User can register, login, logout
- ✅ User can create audit by pasting URL
- ✅ System generates 40-page PDF report in < 10 min
- ✅ Report includes: SEO, Performance, Content, Local SEO, Competitive Analysis
- ✅ Report has actionable recommendations + code snippets
- ✅ Dashboard shows audit history
- ✅ Payment integration (Stripe) - user can subscribe
- ✅ Deployed on Railway with custom domain (sitespector.app)
- ✅ 10 beta users tested successfully

---

## 📝 Notes & Assumptions

**Assumptions:**
1. Target users have basic understanding of SEO (know what "meta description" means)
2. Most audited sites are Polish (UTF-8, Polish characters handled)
3. Average site has < 100 pages (single URL audit sufficient for MVP)
4. Railway handles our traffic (100 audits/day = manageable)

**Risks:**
1. **Screaming Frog CLI licensing** - need to verify if CLI is free for commercial use
   - Mitigation: Fallback to Playwright + custom crawler if needed
2. **Claude API costs** - 20k tokens/audit × $0.003/1k = $0.06/audit
   - Mitigation: Optimize prompts, cache common analyses
3. **PDF generation slowness** - complex PDFs may take > 30s
   - Mitigation: Pre-render templates, async generation

**Dependencies:**
- Claude API availability (uptime)
- Railway infrastructure (no downtime)
- Screaming Frog CLI updates (breaking changes)

---

## 🔗 Related Documents
- [TECH_STACK.md](./TECH_STACK.md) - Technology choices
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [REPORT_STRUCTURE.md](./REPORT_STRUCTURE.md) - PDF template
- [BACKLOG.md](./BACKLOG.md) - Development tasks

---

**Document Status:** ✅ APPROVED  
**Next Steps:** Review with team → Start ARCHITECTURE.md → Begin development

