-- Dynamic Category Color Palettes for SysDesign
-- Run this in Supabase SQL Editor (or via `supabase db push`).
-- Once seeded, updating rows here updates node icon & category colors without a frontend redeploy.

create table if not exists public.catalog_categories (
  id text primary key,
  label text not null,
  color text not null,
  bg text not null,
  border text not null,
  text_color text not null,
  pill text not null,
  dark_color text,
  dark_bg text,
  dark_border text,
  dark_text_color text,
  dark_pill text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_categories_active
  on public.catalog_categories (is_active, sort_order);

-- Auto-maintain updated_at
create or replace function public.set_catalog_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_catalog_categories_updated_at on public.catalog_categories;
create trigger trg_catalog_categories_updated_at
  before update on public.catalog_categories
  for each row
  execute function public.set_catalog_categories_updated_at();

-- Row Level Security: public read for active categories, writes restricted to service_role / Dashboard
alter table public.catalog_categories enable row level security;

drop policy if exists "Public can read active catalog categories" on public.catalog_categories;
create policy "Public can read active catalog categories"
  on public.catalog_categories
  for select
  using (is_active = true);
