-- Manual migration for Supabase (remote): Projects + Project Members + RLS.
--
-- Why manual:
-- - Repo has full supabase/schema.sql + policies.sql, but re-running them on an existing
--   project can fail due to triggers/policies already existing.
-- - This file is idempotent and scoped only to the new "projects" feature.
--
-- Run in Supabase Dashboard -> SQL Editor (connected to PRIMARY DB).

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'member', 'viewer')),
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_projects_workspace on public.projects(workspace_id);
create index if not exists idx_projects_url on public.projects(url);
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (re-use existing helper if present)
-- ---------------------------------------------------------------------------

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_projects_updated_at'
  ) then
    create trigger update_projects_updated_at
    before update on public.projects
    for each row execute function public.update_updated_at_column();
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- ---------------------------------------------------------------------------
-- Policies (idempotent via pg_policies checks)
-- ---------------------------------------------------------------------------

do $$
begin
  -- projects: select
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='projects' and policyname='Members can view workspace projects'
  ) then
    execute $p$
      create policy "Members can view workspace projects"
      on public.projects
      for select
      using (
        workspace_id in (
          select workspace_id from public.workspace_members
          where user_id = auth.uid()
        )
        or id in (
          select project_id from public.project_members
          where user_id = auth.uid()
        )
      )
    $p$;
  end if;

  -- projects: insert
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='projects' and policyname='Admins can create projects'
  ) then
    execute $p$
      create policy "Admins can create projects"
      on public.projects
      for insert
      with check (
        workspace_id in (
          select workspace_id from public.workspace_members
          where user_id = auth.uid() and role in ('owner', 'admin')
        )
        and (created_by = auth.uid() or created_by is null)
      )
    $p$;
  end if;

  -- projects: update
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='projects' and policyname='Admins or managers can update projects'
  ) then
    execute $p$
      create policy "Admins or managers can update projects"
      on public.projects
      for update
      using (
        workspace_id in (
          select workspace_id from public.workspace_members
          where user_id = auth.uid() and role in ('owner', 'admin')
        )
        or id in (
          select project_id from public.project_members
          where user_id = auth.uid() and role = 'manager'
        )
      )
    $p$;
  end if;

  -- projects: delete
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='projects' and policyname='Admins can delete projects'
  ) then
    execute $p$
      create policy "Admins can delete projects"
      on public.projects
      for delete
      using (
        workspace_id in (
          select workspace_id from public.workspace_members
          where user_id = auth.uid() and role in ('owner', 'admin')
        )
      )
    $p$;
  end if;

  -- project_members: select
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_members' and policyname='Workspace members can view project members'
  ) then
    execute $p$
      create policy "Workspace members can view project members"
      on public.project_members
      for select
      using (
        project_id in (
          select id from public.projects
          where workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = auth.uid()
          )
        )
        or project_id in (
          select project_id from public.project_members
          where user_id = auth.uid()
        )
      )
    $p$;
  end if;

  -- project_members: insert
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_members' and policyname='Admins or managers can add project members'
  ) then
    execute $p$
      create policy "Admins or managers can add project members"
      on public.project_members
      for insert
      with check (
        project_id in (
          select id from public.projects
          where workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = auth.uid() and role in ('owner', 'admin')
          )
        )
        or project_id in (
          select project_id from public.project_members
          where user_id = auth.uid() and role = 'manager'
        )
      )
    $p$;
  end if;

  -- project_members: update
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_members' and policyname='Admins or managers can update project members'
  ) then
    execute $p$
      create policy "Admins or managers can update project members"
      on public.project_members
      for update
      using (
        project_id in (
          select id from public.projects
          where workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = auth.uid() and role in ('owner', 'admin')
          )
        )
        or project_id in (
          select project_id from public.project_members
          where user_id = auth.uid() and role = 'manager'
        )
      )
    $p$;
  end if;

  -- project_members: delete
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_members' and policyname='Admins or managers can remove project members'
  ) then
    execute $p$
      create policy "Admins or managers can remove project members"
      on public.project_members
      for delete
      using (
        project_id in (
          select id from public.projects
          where workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = auth.uid() and role in ('owner', 'admin')
          )
        )
        or project_id in (
          select project_id from public.project_members
          where user_id = auth.uid() and role = 'manager'
        )
      )
    $p$;
  end if;
end$$;

-- Optional: comments (safe to re-run)
comment on table public.projects is 'Projects (one website per workspace)';
comment on table public.project_members is 'Project-level team membership (manager, member, viewer)';

commit;

