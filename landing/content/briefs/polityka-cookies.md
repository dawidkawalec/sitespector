# Strona Polityka cookies — Brief

Dokument kreatywny dla agenta AI budującego stronę polityki cookies SiteSpector. Prosta tabela cookies, instrukcje ustawień przeglądarki, brak cookie’ów śledzących.

---

## Meta

- **title**: Polityka cookies — SiteSpector | Pliki cookies
- **description**: Jak SiteSpector używa plików cookies. Lista cookies: Supabase (sesja), Stripe, next-auth. Brak cookies śledzących. Instrukcje zarządzania.
- **keywords**: polityka cookies SiteSpector, cookies, pliki cookies, RODO

---

## Sekcja: Hero (krótka)

**Headline:** Polityka cookies

**Subheadline:** Informujemy, jakie pliki cookies wykorzystuje Serwis SiteSpector i jak możesz nimi zarządzać.

---

## Sekcja 1: Czym są cookies

**Copy:**
> Pliki cookies to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu podczas odwiedzania stron internetowych. Służą m.in. do utrzymania sesji, zapamiętania preferencji i obsługi płatności. Serwis SiteSpector korzysta wyłącznie z cookies niezbędnych do działania platformy i nie stosuje cookies śledzących w celach reklamowych.

---

## Sekcja 2: Tabela cookies

**Copy + tabela:**

| Nazwa / prefiks | Dostawca | Cel | Czas przechowywania | Wymagane |
|-----------------|----------|-----|---------------------|----------|
| sb-* | Supabase | Sesja użytkownika, autentykacja | Sesja / do 7 dni | Tak |
| _stripe_mid | Stripe | Identyfikacja użytkownika przy płatnościach (zapobieganie fraudowi) | 1 rok | Tak (przy płatnościach) |
| next-auth.session-token | NextAuth | Sesja logowania | Sesja | Tak |

**Uwaga:** Wartości `sb-*` oznaczają prefiks plików cookies Supabase (np. `sb-xxxxx-auth-token`). Konkretne nazwy mogą się różnić w zależności od konfiguracji.

**Brak cookies śledzących:** Nie używamy Google Analytics, Facebook Pixel ani innych narzędzi śledzenia w celach reklamowych. Nie przekazujemy danych z cookies podmiotom trzecim do targetowania reklam.

---

## Sekcja 3: Zarządzanie cookies

**Copy:**
> Możesz zarządzać cookies w ustawieniach przeglądarki:
>
> - **Chrome:** Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn
> - **Firefox:** Ustawienia → Prywatność i bezpieczeństwo → Ciasteczka i dane stron
> - **Safari:** Preferencje → Prywatność → Zarządzaj danymi witryn
> - **Edge:** Ustawienia → Pliki cookie i uprawnienia witryny
>
> Ograniczenie lub zablokowanie cookies niezbędnych może skutkować brakiem możliwości logowania lub korzystania z pełnej funkcjonalności Serwisu (np. płatności przez Stripe).

---

## Sekcja 4: Aktualizacje

**Copy:**
> Polityka cookies może być aktualizowana w miarę zmian w Serwisie lub przepisach. O istotnych zmianach poinformujemy na stronie. Ostatnia aktualizacja: [DATA].

---

## Uwagi designu

- Krótka strona, jedna kolumna tekstu. Tabela responsywna (horizontal scroll na mobile jeśli potrzeba).
- Link do Polityki prywatności („Więcej informacji o przetwarzaniu danych znajdziesz w Polityce prywatności”).
- Styl spójny z regulaminem i polityką prywatności — bez zbędnych elementów wizualnych.
