create table watchlist (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,              -- name shown in notifications
  query         text not null,              -- Nyaa search term
  title_regex   text,                       -- optional, filters out false matches
  season        int,                        -- optional, only this season
  min_episode   int default 0,              -- ignore episodes up to this number
  groups        text[],                     -- null = any group; set = only these
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table seen_episodes (
  watchlist_id  uuid not null references watchlist(id) on delete cascade,
  season        int not null default 1,
  episode       numeric not null,           -- numeric for specials like 12.5
  info_hash     text not null,              -- the release that was notified
  release_title text not null,
  notified_at   timestamptz not null default now(),
  primary key (watchlist_id, season, episode)
);

create table seen_hashes (
  info_hash     text primary key,           -- fallback dedupe for releases without a parsable episode
  seen_at       timestamptz not null default now()
);

-- RLS on, no policies: only the service_role key can access these
alter table watchlist enable row level security;
alter table seen_episodes enable row level security;
alter table seen_hashes enable row level security;
