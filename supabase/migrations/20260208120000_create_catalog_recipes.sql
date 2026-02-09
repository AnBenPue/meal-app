-- ============================================
-- Catalog Recipes: shared read-only recipe catalog
-- ============================================

create extension if not exists pg_trgm;

create table public.catalog_recipes (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  source_url      text not null unique,
  source_category text not null,
  category        text not null,
  image_url       text,
  ingredients     jsonb not null default '[]',
  instructions    jsonb not null default '[]',
  prep_time       integer not null default 0,
  cook_time       integer not null default 0,
  servings        integer not null default 1,
  calories        real not null default 0,
  protein         real not null default 0,
  carbs           real not null default 0,
  fat             real not null default 0,
  created_at      timestamptz default now()
);

alter table public.catalog_recipes enable row level security;

create policy "Authenticated users can read catalog"
  on public.catalog_recipes for select
  using (auth.role() = 'authenticated');

create index idx_catalog_category on public.catalog_recipes(category);
create index idx_catalog_name_trgm on public.catalog_recipes using gin (name gin_trgm_ops);
