# Jak nadać użytkownikowi konto Pro (bez Stripe)

Subskrypcja w SiteSpector jest **per workspace** (nie per użytkownik).  
Aby nadać użytkownikowi `info@craftweb.pl` plan Pro, zaktualizuj subskrypcję jego **personal workspace** w Supabase.

---

## Krok 1: Supabase Dashboard

1. Wejdź na [Supabase Dashboard](https://supabase.com/dashboard) i wybierz projekt SiteSpector.
2. W menu po lewej: **SQL Editor** → New query.

---

## Krok 2: Wykonaj ten SQL

Skrypt znajduje użytkownika po adresie e-mail, jego personal workspace (gdzie jest `owner`) i ustawia subskrypcję na **Pro** (limit 50 audytów/miesiąc).

```sql
-- Nadaj Pro użytkownikowi info@craftweb.pl (jego personal workspace)
UPDATE public.subscriptions
SET
  plan = 'pro',
  audit_limit = 50,
  status = 'active',
  updated_at = NOW()
WHERE workspace_id = (
  SELECT w.id
  FROM public.workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'info@craftweb.pl'
  LIMIT 1
)
RETURNING id, workspace_id, plan, audit_limit, status;
```

- Jeśli zapytanie zwróci **1 wiersz** – subskrypcja została zaktualizowana.
- Jeśli zwróci **0 wierszy** – użytkownik o tym e-mailu nie istnieje w `auth.users` albo nie ma workspace’u (powinien mieć, bo tworzy go trigger przy rejestracji).

---

## Weryfikacja

Po wykonaniu SQL użytkownik `info@craftweb.pl` po odświeżeniu aplikacji (lub ponownym zalogowaniu) powinien widzieć w **Settings → Billing** plan **Pro** i limit 50 audytów.

---

## Uwagi

- **Stripe**: Ta zmiana nie tworzy subskrypcji w Stripe – to ręczne nadanie Pro „na stałe”. Bez Stripe nie będzie automatycznych odnów ani faktur.
- **Inni użytkownicy**: Aby nadać Pro innemu użytkownikowi, zamień w powyższym SQL `'info@craftweb.pl'` na jego adres e-mail.
- **Enterprise**: Dla planu Enterprise ustaw `plan = 'enterprise'` i `audit_limit = 999999`.
