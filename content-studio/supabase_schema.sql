-- Run this once in the Supabase SQL editor for your project.

create table if not exists kv_store (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table kv_store enable row level security;

create policy "Users manage their own kv_store rows"
on kv_store
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
