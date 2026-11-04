-- Çok kullanıcılı yapı: her kullanıcının kendi watchlist'i ve bildirim kanalı var.
create table profiles (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ntfy_topic  text,                         -- kullanıcının ntfy topic'i; boşsa bölümler bildirimsiz görüldü sayılır
  created_at  timestamptz not null default now()
);

-- null user_id = CLI ile service_role'den eklenmiş kayıt; env'deki kanallara gider, arayüzde görünmez
alter table watchlist add column user_id uuid default auth.uid() references profiles(user_id) on delete cascade;
create index on watchlist (user_id);

-- İlk tarama cron'da: seeded=false olan kayıtta Nyaa'daki mevcut bölümler bildirimsiz görüldü sayılır.
-- Var olan kayıtlar true olur, yeni kayıtlar false başlar.
alter table watchlist add column seeded boolean not null default true;
alter table watchlist alter column seeded set default false;

-- Arayüz publishable key ile çalışır: her kullanıcı yalnızca kendi satırlarını görür
alter table profiles enable row level security;

create policy "own profile" on profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own watchlist" on watchlist for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own seen episodes" on seen_episodes for select to authenticated
  using (exists (select 1 from watchlist w where w.id = watchlist_id and w.user_id = (select auth.uid())));

grant select, insert, update, delete on profiles, watchlist to authenticated;
grant select on seen_episodes to authenticated;
