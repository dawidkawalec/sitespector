# ULTIMATE FIX - Krok po kroku

## Problem: Nadal infinite recursion po wykonaniu fix_rls_complete.sql

**Możliwe przyczyny:**
1. Stare polityki nie zostały usunięte (są duplikaty)
2. Supabase cache nie został wyczyszczony
3. SELECT policy nadal ma rekursję

## ROZWIĄZANIE: Nuclear Option

### Krok 1: Wykonaj diagnozę (OPCJONALNE)

W Supabase SQL Editor:
```sql
-- Sprawdź jakie polityki FAKTYCZNIE istnieją
SELECT polname FROM pg_policy 
WHERE polrelid = 'public.workspace_members'::regclass;
```

**Jeśli widzisz**:
- Stare nazwy typu "Members can view workspace members" = **problem!**
- Duplikaty (2x ta sama nazwa) = **problem!**

### Krok 2: NUCLEAR FIX (GŁÓWNE ROZWIĄZANIE)

1. **Otwórz plik**: `supabase/nuclear_fix.sql`
2. **Skopiuj całość**
3. **W Supabase SQL Editor**: New query → Wklej → Run

Ten skrypt:
- ✅ FORCE wyłącza i włącza RLS (czyści cache)
- ✅ DROP ALL polityk (wszystkie możliwe nazwy)
- ✅ Tworzy NAJPROSTSZĄ możliwą politykę SELECT:

```sql
-- Ta polityka ma ZERO szans na rekursję
CREATE POLICY "workspace_members_select_simple"
ON public.workspace_members
FOR SELECT
USING (
  user_id = auth.uid()  -- ← Tylko to. Bez subquery. Bez EXISTS. Nic.
);
```

### Krok 3: Verify

W Supabase SQL Editor wykonaj jako **authenticated** user:

```sql
-- Set role to authenticated (simulate API call)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "1548b6e5-f1d5-4e57-be32-af3a3005d8c8"}';

-- Test query (to co robi frontend)
SELECT workspace_id, role 
FROM workspace_members 
WHERE user_id = '1548b6e5-f1d5-4e57-be32-af3a3005d8c8';

-- Reset role
RESET ROLE;
```

**Jeśli to działa bez błędu** = FIX ZADZIAŁAŁ! ✅

### Krok 4: Test w przeglądarce

1. **ZAMKNIJ WSZYSTKIE karty** z 77.42.79.46
2. **Nowe okno incognito**
3. `https://77.42.79.46/login`
4. Zaloguj się
5. Console (F12) - sprawdź logi

## Dlaczego ten fix jest lepszy?

**Poprzednie polityki** miały EXISTS subqueries:
```sql
EXISTS (
  SELECT 1 FROM workspace_members my_membership  -- ← To może dalej powodować rekursję
  WHERE ...
)
```

**Nowa polityka** jest ULTRA PROSTA:
```sql
user_id = auth.uid()  -- ← To NIE MOŻE powodować rekursji
```

## Co jeśli NADAL nie działa?

Jeśli po tym nadal błąd, to znaczy że:

**Problem NIE jest w politykach workspace_members**, tylko gdzieś indziej.

Wykonaj test:
```sql
-- Sprawdź czy problem jest w workspace_members czy workspaces
SELECT * FROM workspaces LIMIT 1;  -- Test 1
SELECT * FROM workspace_members LIMIT 1;  -- Test 2
```

Jeśli Test 1 działa ale Test 2 nie = workspace_members  
Jeśli oba nie działają = problem w workspaces policy

Daj znać wynik!
