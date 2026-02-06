-- ============================================
-- Meal App: Tables + RLS policies
-- ============================================

-- 1. RECIPES
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  category text not null,
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  prep_time integer not null default 0,
  cook_time integer not null default 0,
  servings integer not null default 1,
  calories real not null default 0,
  protein real not null default 0,
  carbs real not null default 0,
  fat real not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.recipes enable row level security;

create policy "Users can read own recipes"
  on public.recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes"
  on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes"
  on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes"
  on public.recipes for delete using (auth.uid() = user_id);

-- 2. MEAL PLANS
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date date not null,
  meals jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.meal_plans enable row level security;

create policy "Users can read own meal_plans"
  on public.meal_plans for select using (auth.uid() = user_id);
create policy "Users can insert own meal_plans"
  on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own meal_plans"
  on public.meal_plans for update using (auth.uid() = user_id);
create policy "Users can delete own meal_plans"
  on public.meal_plans for delete using (auth.uid() = user_id);

-- 3. FOOD LOG ENTRIES
create table public.food_log_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date date not null,
  time text not null,
  meal_type text not null,
  foods jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table public.food_log_entries enable row level security;

create policy "Users can read own food_log_entries"
  on public.food_log_entries for select using (auth.uid() = user_id);
create policy "Users can insert own food_log_entries"
  on public.food_log_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own food_log_entries"
  on public.food_log_entries for update using (auth.uid() = user_id);
create policy "Users can delete own food_log_entries"
  on public.food_log_entries for delete using (auth.uid() = user_id);

-- 4. USER SETTINGS
create table public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid() unique,
  daily_calorie_goal integer not null default 2000,
  protein_goal integer not null default 150,
  carbs_goal integer not null default 250,
  fat_goal integer not null default 65,
  dietary_preferences jsonb not null default '[]',
  allergies jsonb not null default '[]',
  usda_api_key text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings"
  on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings"
  on public.user_settings for update using (auth.uid() = user_id);
