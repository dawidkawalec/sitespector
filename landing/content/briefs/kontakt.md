# Strona Kontakt — Brief

Dokument kreatywny dla agenta AI budującego odświeżoną stronę kontaktową SiteSpector. Prosty układ: informacje kontaktowe + formularz.

---

## Meta

- **title**: Kontakt — SiteSpector | Skontaktuj się z nami
- **description**: Skontaktuj się z zespołem SiteSpector. Odpowiadamy w 24 godziny. Warszawa, Polska. Pomoc techniczna, sprzedaż, wsparcie.
- **keywords**: kontakt SiteSpector, wsparcie SEO, audyt strony, pytania SiteSpector

---

## Sekcja: Hero

**Headline:**
> **Skontaktuj się z nami**

**Subheadline:**
> Masz pytania? Potrzebujesz pomocy technicznej lub informacji o planach? Napisz — odpowiemy w ciągu 24 godzin w dni robocze.

**Design:** Prosty hero, `bg-white`, bez grafiki. Wyśrodkowany tekst, min. padding.

---

## Sekcja: Informacje kontaktowe

**Label:** DANE KONTAKTOWE

**Tytuł:** Jesteśmy tu dla **Ciebie**

**3 karty (lub lista):**

1. **Adres** — Warszawa, Polska
   - Ikona: RiMapPinLine
   - Opis: Biuro w Warszawie. Spotkania po wcześniejszym umówieniu.

2. **E-mail** — kontakt@sitespector.pl
   - Ikona: RiMailLine
   - Opis: Główny adres kontaktowy. Odpowiadamy w 24 godziny (pn–pt 9:00–17:00 CET).

3. **Godziny** — Pn–Pt 9:00–17:00 (CET)
   - Ikona: RiTimeLine
   - Opis: Obsługa klienta w dni robocze. Poza godzinami — odpowiedź następnego dnia.

**Design:** Grid 3 kolumny (mobile: 1 kolumna). Karty z ikonami w kółkach, `bg-light` lub `border-0 shadow-sm`.

---

## Sekcja: Formularz kontaktowy

**Label:** NAPISZ DO NAS

**Tytuł:** Wyślij **wiadomość**

**Pola formularza:**
1. **Imię i nazwisko** — input text, wymagane
2. **Adres e-mail** — input email, wymagane
3. **Temat** — dropdown (select):
   - Pytanie ogólne
   - Wsparcie techniczne
   - Sprzedaż / plany
   - Współpraca
   - Inne
4. **Wiadomość** — textarea, wymagane, min. 10 znaków

**Przyciski:**
- Wyślij wiadomość (primary)
- Wyczyść (secondary, outline)

**Design:** Formularz w jednej kolumnie, max-width 600px. Wzorzec z `_form.scss`. Walidacja po stronie klienta. Endpoint: POST do API lub e-mail (np. formspree / własny endpoint).

**Uwaga:** Nie implementować logiki wysyłki w briefie — tylko specyfikacja UI i pól.

---

## Sekcja: CTA do darmowego audytu

**Label:** ZANIM NAPISZESZ

**Tytuł:** Możesz od razu **wypróbować** SiteSpector

**Copy:**
> Plan Free obejmuje 5 audytów miesięcznie bez rejestracji karty. Wystarczy założyć konto i uruchomić pierwszy audyt. Wiele odpowiedzi znajdziesz w naszej dokumentacji.

**CTA Primary:** Rozpocznij darmowy audyt → `/login`

**CTA Secondary:** Dokumentacja → `/docs`

**Design:** Karta z tłem `bg-light` lub `bg-primary` (odwrócone kolory). Ikona RiRobotLine lub RiPlayCircleLine.

---

## Grafiki

| Sekcja        | Opis | Rozmiar |
|---------------|------|---------|
| Hero          | Brak — czysty tekst | — |
| Kontakt       | Ikony React Icons (RiMapPinLine, RiMailLine, RiTimeLine) | standard |
| CTA           | Opcjonalnie: Lordicon „mail” lub „robot” | 80x80 px |

---

## Uwagi designu

- Minimalistyczny, bez zbędnych elementów. Cel: szybki kontakt.
- Formularz: Bootstrap Form.Group, Label, Form.Control. Spójne z resztą landingu.
- Spacing: sekcje 80px 0 (mniej niż na stronie głównej — strona krótsza).
- Mobile: formularz full-width, karty kontaktowe w kolumnie.
