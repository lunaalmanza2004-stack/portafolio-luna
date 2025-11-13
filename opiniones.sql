create extension if not exists "pgcrypto";

create table if not exists public.opiniones (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  name text,
  text text not null,
  rating int not null default 0,
  ts bigint,
  created_at timestamp with time zone default now()
);

alter table public.opiniones enable row level security;

create policy "Opiniones: lectura pública"
on public.opiniones for select
using (true);

create policy "Opiniones: inserción pública"
on public.opiniones for insert
with check (true);
