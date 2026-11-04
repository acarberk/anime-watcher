-- Web Push: one row per browser/device a user turned notifications on for.
create table push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  -- references profiles so the worker can embed profiles(…, push_subscriptions(…))
  user_id          uuid not null default auth.uid() references profiles(user_id) on delete cascade,
  endpoint         text not null unique,
  p256dh           text not null,
  auth             text not null,
  device_label     text,                -- "iPhone", "Windows · Chrome", shown in settings
  created_at       timestamptz not null default now(),
  last_success_at  timestamptz,         -- null until the push service accepted a message for this device
  last_error       text
);
create index on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "own push subscriptions" on push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on push_subscriptions to authenticated;
