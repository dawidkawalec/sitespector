# COMPLETE FIX GUIDE - RLS Infinite Recursion

## Problem: Nadal występuje błąd "infinite recursion"

Jeśli nadal widzisz błąd po wykonaniu poprzednich SQL, prawdopodobnie:
1. Polityki nie zostały poprawnie usunięte
2. Stare polityki nadal istnieją obok nowych
3. Trzeba wymusić pełny reset

## ROZWIĄZANIE: Pełny reset polityk RLS

### Krok 1: Zweryfikuj obecny stan (OPCJONALNIE)

W Supabase SQL Editor wykonaj:

**Otwórz plik**: `supabase/verify_policies.sql`  
**Skopiuj i wklej** do SQL Editor  
**Kliknij Run**

To pokaże Ci obecne polityki i czy mają problemy.

---

### Krok 2: Wykonaj KOMPLETNY FIX (GŁÓWNE ROZWIĄZANIE)

**⚠️ WAŻNE: To jest JEDYNY skrypt który musisz wykonać**

1. **Otwórz plik**: `supabase/fix_rls_complete.sql`
2. **Skopiuj CAŁĄ zawartość** (wszystkie 250+ linii)
3. **Przejdź do Supabase Dashboard**:
   - https://supabase.com/dashboard/project/ljimahizqgewhvrgqhyx
   - Kliknij **SQL Editor** (lewa sidebar)
   - Kliknij **+ New query**
4. **Wklej** całą zawartość pliku
5. **Kliknij Run** (lub Cmd+Enter)

**Czego oczekiwać**:
- Skrypt zajmie ~2-3 sekundy
- Na końcu zobaczysz: `RLS policies updated successfully! ✅`
- Liczba polityk powinna być >= 20
- workspace_members powinien mieć 5 polityk

---

### Krok 3: Zweryfikuj że fix zadziałał

W tym samym SQL Editor wykonaj test:

```sql
-- Test 1: Sprawdź czy możemy czytać z workspace_members
SELECT COUNT(*) FROM workspace_members;

-- Jeśli nie ma błędu "infinite recursion" = FIX ZADZIAŁAŁ! ✅

-- Test 2: Sprawdź dane użytkownika
SELECT 
    wm.role,
    w.name as workspace_name
FROM workspace_members wm
LEFT JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = '1548b6e5-f1d5-4e57-be32-af3a3005d8c8';

-- Powinno zwrócić 1 wiersz z role='owner' i workspace_name
```

**Jeśli widzisz błąd "infinite recursion"** = skrypt nie został wykonany poprawnie, spróbuj ponownie.

---

### Krok 4: Test w przeglądarce

1. **Otwórz NOWE okno incognito** (Cmd+Shift+N lub Ctrl+Shift+N)
2. Przejdź do: `https://77.42.79.46/login`
3. Zaloguj się: `info@craftweb.pl` / `Dawid132?`
4. **Otwórz Console (F12)**

**Czego oczekiwać w konsoli**:
```
✅ 🔍 Current user ID: 1548b6e5-f1d5-4e57-be32-af3a3005d8c8
✅ 📋 User memberships: [{workspace_id: "...", role: "owner"}]
✅ 🏢 Workspaces found: [{id: "...", name: "Dawid Kawalec's Workspace", ...}]
✅ ✅ Final workspace list: [...]
✅ ✅ Current workspace set to: {...}
```

**NIE powinno być**:
```
❌ Error fetching workspace members: {code: '42P17', message: 'infinite recursion...'}
❌ 500 (Internal Server Error)
```

---

## Co robi ten skrypt?

1. **Wyłącza RLS** na wszystkich tabelach
2. **Usuwa WSZYSTKIE stare polityki** (loop przez pg_policies)
3. **Włącza RLS** z powrotem
4. **Tworzy NOWE poprawne polityki** bez rekursji
5. **Weryfikuje** że polityki zostały utworzone

## Kluczowa różnica

**STARA polityka** (powodowała rekursję):
```sql
workspace_id IN (
  SELECT workspace_id FROM workspace_members  -- ❌ rekursja!
  WHERE user_id = auth.uid()
)
```

**NOWA polityka** (bez rekursji):
```sql
user_id = auth.uid()  -- ✅ bezpośrednie sprawdzenie NAJPIERW
OR EXISTS (
  SELECT 1 FROM workspace_members my_membership  -- ✅ alias tabeli
  WHERE my_membership.workspace_id = workspace_members.workspace_id
  AND my_membership.user_id = auth.uid()
)
```

---

## Jeśli NADAL nie działa

**Wykonaj w Supabase SQL Editor**:

```sql
-- Sprawdź czy polityki istnieją
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'workspace_members';

-- Powinno zwrócić 5 wierszy:
-- 1. Users can view own workspace members
-- 2. Users can create own memberships
-- 3. Admins can add members
-- 4. Admins can update member roles
-- 5. Admins can remove members
```

Jeśli nie ma 5 polityk lub mają inne nazwy = **skrypt nie został wykonany, spróbuj ponownie**.

---

## Dlaczego Docker restart nie pomoże?

**RLS policies są w Supabase**, nie na VPS. To są reguły w PostgreSQL hostowanym przez Supabase.

VPS/Docker obsługuje tylko frontend i backend API. Problem jest w bazie danych Supabase, więc:
- ✅ Fix: Zmiana polityk w Supabase SQL Editor
- ❌ Nie pomoże: Docker restart, frontend rebuild, VPS restart

---

## Pliki utworzone

1. **`supabase/verify_policies.sql`** - Skrypt weryfikacyjny (opcjonalny)
2. **`supabase/fix_rls_complete.sql`** - GŁÓWNY SKRYPT NAPRAWCZY (użyj tego!)

## Status

- [ ] Wykonałem `fix_rls_complete.sql` w Supabase SQL Editor
- [ ] Zobaczyłem "RLS policies updated successfully! ✅"
- [ ] Test `SELECT COUNT(*) FROM workspace_members;` działa bez błędu
- [ ] Zalogowałem się ponownie w trybie incognito
- [ ] Dashboard się ładuje i widzę workspace w konsoli

Jeśli wszystkie checkboxy zaznaczone = **NAPRAWIONE!** ✅
