-- Multi-user: every user has their own watchlist and notification channel.
create table profiles (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ntfy_topic  text,                         -- the user's ntfy topic; while empty, episodes are marked seen silently
  created_at  timestamptz not null default now()
);

-- null user_id = row added via the CLI with service_role; notified through the env channels, hidden from the UI
alter table watchlist add column user_id uuid default auth.uid() references profiles(user_id) on delete cascade;
create index on watchlist (user_id);

-- First scan happens in the cron: for a row with seeded=false, what's already on Nyaa is marked seen without notifying.
-- Existing rows become true, new rows start false.
alter table watchlist add column seeded boolean not null default true;
alter table watchlist alter column seeded set default false;

-- The web app uses the publishable key: each user only sees their own rows
alter table profiles enable row level security;

create policy "own profile" on profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own watchlist" on watchlist for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own seen episodes" on seen_episodes for select to authenticated
  using (exists (select 1 from watchlist w where w.id = watchlist_id and w.user_id = (select auth.uid())));

grant select, insert, update, delete on profiles, watchlist to authenticated;
grant select on seen_episodes to authenticated;
