-- AniList link (cover art, next airing countdown in the web app) and per-row scan health.
alter table watchlist
  add column anilist_id       int,           -- AniList media id, null for manually added rows
  add column cover_url        text,          -- AniList cover image
  add column cover_color      text,          -- dominant cover color, used as the image placeholder
  add column last_scanned_at  timestamptz,   -- set by the cron after each scan of this row
  add column last_match_count int;           -- matching releases in the last scan (before the seen filter)
