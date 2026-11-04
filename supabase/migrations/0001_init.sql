create table watchlist (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,              -- bildirimde görünen isim
  query         text not null,              -- Nyaa arama terimi
  title_regex   text,                       -- opsiyonel, yanlış eşleşmeleri elemek için
  season        int,                        -- opsiyonel, sadece bu sezon
  min_episode   int default 0,              -- bu bölümden küçükleri yok say (ilk kurulumda spam'i önler)
  groups        text[],                     -- null = tüm gruplar; dolu = sadece bunlar
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table seen_episodes (
  watchlist_id  uuid not null references watchlist(id) on delete cascade,
  season        int not null default 1,
  episode       numeric not null,           -- 12.5 gibi özel bölümler için numeric
  info_hash     text not null,              -- ilk bildirilen release
  release_title text not null,
  notified_at   timestamptz not null default now(),
  primary key (watchlist_id, season, episode)
);

create table seen_hashes (
  info_hash     text primary key,           -- bölüm parse edilemeyen release'ler için fallback dedupe
  seen_at       timestamptz not null default now()
);

-- RLS açık, policy yok: yalnızca service_role erişir
alter table watchlist enable row level security;
alter table seen_episodes enable row level security;
alter table seen_hashes enable row level security;
