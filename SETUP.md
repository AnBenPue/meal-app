# Meal App — Setup & Integration Guide

## Prerequisites

- Docker & Docker Compose
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A [Google Cloud Console](https://console.cloud.google.com) project (for OAuth)

---

## 1. Local Development (Docker)

No Node.js installation required on the host — everything runs in a container.

```bash
# First run (builds the image and installs deps)
docker compose up --build

# Subsequent runs
docker compose up
```

The app is available at `http://localhost:5173` with hot-reload.

### Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name, password, and region
4. Once created, go to **Settings > API** to find your project URL and anon key

### 2.2 Supabase CLI

The CLI is used via `npx` (no global install needed):

```bash
# Check version
npx supabase --version

# Login (generates a token at supabase.com/dashboard/account/tokens)
npx supabase login

# Link to your remote project
npx supabase link --project-ref <your-project-ref>
```

The project ref is the subdomain in your Supabase URL:
`https://<project-ref>.supabase.co`

### 2.3 Database Migrations

Migrations live in `supabase/migrations/`. To push them to your remote database:

```bash
npx supabase db push
```

This creates the following tables with Row Level Security (RLS) enabled:

| Table | Purpose | RLS |
|-------|---------|-----|
| `recipes` | User recipes with nutrition data | Per-user CRUD |
| `meal_plans` | Weekly meal calendar (unique per user+date) | Per-user CRUD |
| `food_log_entries` | Daily food intake log | Per-user CRUD |
| `user_settings` | Calorie/macro goals, preferences | Per-user CRU (no delete) |

All tables have `user_id` referencing `auth.users(id)` with `ON DELETE CASCADE`, and default to `auth.uid()` so the logged-in user is automatically associated.

### 2.4 Generate TypeScript Types

After schema changes, regenerate the types:

```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

### 2.5 Creating New Migrations

```bash
# Create a new empty migration file
npx supabase migration new <migration_name>

# Edit the file in supabase/migrations/
# Then push to remote
npx supabase db push
```

---

## 3. Google OAuth Setup

### 3.1 Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URI**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

### 3.2 Supabase Auth Provider

1. In Supabase Dashboard, go to **Authentication > Providers > Google**
2. Toggle **Enable**
3. Paste the Client ID and Client Secret from Google
4. Save

### 3.3 Redirect URLs

In Supabase Dashboard, go to **Authentication > URL Configuration**:

- **Site URL**: Your production URL (e.g. `https://your-app.vercel.app`)
- **Redirect URLs** (add all):
  ```
  http://localhost:5173
  http://localhost:5173/**
  https://your-app.vercel.app
  https://your-app.vercel.app/**
  ```

---

## 4. Vercel Deployment

### 4.1 Initial Setup

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 4.2 Environment Variables

In Vercel Dashboard > your project > **Settings > Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### 4.3 SPA Routing

The `vercel.json` file handles client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4.4 Deploy

Vercel auto-deploys on push to `main`. To deploy manually:

```bash
npx vercel --prod
```

---

## 5. Project Structure

```
meal_app_ws/
├── src/
│   ├── components/      # UI components (recipes, planner, tracker, dashboard)
│   ├── pages/           # Route pages (Dashboard, Recipes, Planner, FoodLog, Settings, Login)
│   ├── stores/          # Zustand stores (auth, recipes, planner, foodLog, settings)
│   ├── lib/             # Supabase client, USDA API, mappers, nutrition utils
│   ├── types/           # TypeScript types (app types + generated Supabase types)
│   ├── hooks/           # Custom hooks (useTheme)
│   ├── App.tsx          # Router + auth gate
│   └── main.tsx         # Entry point
├── supabase/
│   ├── config.toml      # Supabase local config
│   └── migrations/      # SQL migration files
├── Dockerfile           # Node 20 Alpine dev container
├── docker-compose.yml   # Dev environment with hot-reload
├── vercel.json          # SPA rewrite rules
└── .env.local           # Local environment variables (not committed)
```

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | TailwindCSS 4 + shadcn/ui + Radix UI |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| Food Data | USDA FoodData Central API |
| Hosting | Vercel |
| Dev Environment | Docker |
