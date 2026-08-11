create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  teams jsonb not null,
  games_per_week integer not null check (games_per_week between 1 and 7),
  fixtures jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.leagues enable row level security;

create policy "Players can read their leagues" on public.leagues
  for select using (owner_id = auth.uid());

create policy "Players can create their leagues" on public.leagues
  for insert with check (owner_id = auth.uid());

create policy "Players can update their leagues" on public.leagues
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Players can delete their leagues" on public.leagues
  for delete using (owner_id = auth.uid());
