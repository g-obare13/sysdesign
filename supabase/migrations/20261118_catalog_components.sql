-- Dynamic Architecture Component Catalog for SysDesign
-- Run this in Supabase SQL Editor (or via `supabase db push`).
-- Once seeded, adding/editing rows here updates both the Sidebar palette and the AI Architect
-- without needing a frontend redeploy.

create table if not exists public.catalog_components (
  subtype text primary key,
  label text not null,
  category text not null check (
    category in (
      'microservice',
      'cloud',
      'database',
      'frontend',
      'networking',
      'security',
      'observability',
      'ai',
      'devops',
      'flow',
      'shape',
      'c4'
    )
  ),
  provider text not null default 'generic' check (
    provider in ('aws', 'gcp', 'azure', 'generic')
  ),
  icon text not null default 'IconBox',
  description text not null default '',
  default_technology text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_components_category_active
  on public.catalog_components (category, is_active);

create index if not exists idx_catalog_components_provider
  on public.catalog_components (provider);

-- Auto-maintain updated_at
create or replace function public.set_catalog_components_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_catalog_components_updated_at on public.catalog_components;
create trigger trg_catalog_components_updated_at
  before update on public.catalog_components
  for each row
  execute function public.set_catalog_components_updated_at();

-- Row Level Security: public read for active items, writes restricted to service_role / Dashboard
alter table public.catalog_components enable row level security;

drop policy if exists "Public can read active catalog components" on public.catalog_components;
create policy "Public can read active catalog components"
  on public.catalog_components
  for select
  using (is_active = true);
