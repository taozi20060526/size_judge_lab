-- Supabase 建表与 RLS、anon 表级授权（赵钰涛 · 课程作业用）
-- 新库：整段执行。已有表仅缺权限：只执行最后一行 GRANT 即可。

create table if not exists public.experiment_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  subject_id text,
  payload jsonb not null
);

create unique index if not exists experiment_sessions_session_id_key
  on public.experiment_sessions (session_id);

alter table public.experiment_sessions enable row level security;

drop policy if exists "exp_sess_insert_anon" on public.experiment_sessions;
create policy "exp_sess_insert_anon"
  on public.experiment_sessions for insert
  to anon
  with check (true);

drop policy if exists "exp_sess_select_anon" on public.experiment_sessions;
create policy "exp_sess_select_anon"
  on public.experiment_sessions for select
  to anon
  using (true);

drop policy if exists "exp_sess_update_anon" on public.experiment_sessions;
create policy "exp_sess_update_anon"
  on public.experiment_sessions for update
  to anon
  using (true)
  with check (true);

-- 表级权限：仅有 RLS 不够时会出现 401 / permission denied。表已建好时也可单独执行本行：
grant select, insert, update on public.experiment_sessions to anon;
