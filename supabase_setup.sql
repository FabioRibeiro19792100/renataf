create table if not exists public.spa_dashboard_inputs (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.spa_dashboard_inputs enable row level security;

drop policy if exists "spa_dashboard_inputs_select_anon" on public.spa_dashboard_inputs;
create policy "spa_dashboard_inputs_select_anon"
  on public.spa_dashboard_inputs
  for select
  to anon
  using (true);

drop policy if exists "spa_dashboard_inputs_insert_anon" on public.spa_dashboard_inputs;
create policy "spa_dashboard_inputs_insert_anon"
  on public.spa_dashboard_inputs
  for insert
  to anon
  with check (true);

drop policy if exists "spa_dashboard_inputs_update_anon" on public.spa_dashboard_inputs;
create policy "spa_dashboard_inputs_update_anon"
  on public.spa_dashboard_inputs
  for update
  to anon
  using (true)
  with check (true);
