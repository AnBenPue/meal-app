# Calorie + Meal Planning App MVP

## Overview
A web app combining *FoodiePrep* (meal planning/recipes) and *Cal AI* (calorie tracking) features. Meal planning is the primary focus, with calorie tracking supporting it.

---

## Feature Analysis

### From FoodiePrep (Meal Planning)
- Recipe management with nutritional info
- Weekly meal planner calendar
- Shopping list generation
- Pantry tracking
- AI assistant for recipe suggestions
- Recipe import from URLs/photos

### From Cal AI (Calorie Tracking)
- AI photo food recognition
- Macro tracking (calories, protein, carbs, fats)
- Daily goals with visual progress
- Food database search
- Health score per meal
- Meal history log

---

## MVP Scope (Phase 1)

### Core Features

#### 1. Recipe Management
- Add/edit/delete recipes
- Fields: name, ingredients (with quantities), instructions, prep time, cook time, servings
- Auto-calculate nutrition from ingredients
- Categories: Breakfast, Lunch, Dinner, Snack
- Search and filter

#### 2. Weekly Meal Planner
- 7-day calendar view
- Assign recipes to meal slots
- Daily nutrition summary
- Drag-and-drop interface

#### 3. Food Logging
- *Manual entry*: Search food database (USDA FoodData Central API - free)
- *AI photo recognition*: Upload/capture photo → AI identifies food + estimates portions
- Log portion sizes
- Quick-add from recent foods

#### 4. Daily Dashboard
- Today's planned meals
- Calorie/macro progress rings (like Cal AI)
- Quick actions: Add meal, Log food, View plan

#### 5. Goals & Settings
- Set daily calorie/macro targets
- Dietary preferences (vegetarian, allergies)
- Theme (light/dark)

### Deferred to Phase 2
- Shopping list generation
- Pantry tracking
- Recipe import from URLs
- Water/exercise tracking
- Analytics/trends
- AI meal plan suggestions

---

## Tech Stack


Frontend:       React 18 + Vite
Styling:        TailwindCSS + shadcn/ui components
State:          Zustand (simple, lightweight)
Local DB:       Dexie.js (IndexedDB wrapper)
AI Integration: Anthropic Claude API (for food photo recognition)
Food Data:      USDA FoodData Central API (free, comprehensive)


---

## Project Structure


/src
  /components
    /ui              # shadcn components (Button, Card, Dialog, etc.)
    /recipes         # RecipeCard, RecipeForm, RecipeList
    /planner         # WeeklyCalendar, MealSlot, DayColumn
    /tracker         # FoodLogger, MacroRings, MealEntry
    /dashboard       # DashboardStats, QuickActions
  /pages
    Dashboard.tsx
    Recipes.tsx
    Planner.tsx
    FoodLog.tsx
    Settings.tsx
  /lib
    db.ts            # Dexie database setup
    api.ts           # USDA API calls
    ai.ts            # Claude API for food recognition
    nutrition.ts     # Calorie/macro calculations
  /stores
    recipeStore.ts
    plannerStore.ts
    foodLogStore.ts
    settingsStore.ts
  /types
    index.ts         # TypeScript interfaces
  App.tsx
  main.tsx


---

## Database Schema (IndexedDB via Dexie)

typescript
// Recipes
interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;      // minutes
  cookTime: number;
  servings: number;
  nutrition: NutritionInfo;
  createdAt: Date;
  updatedAt: Date;
}

// Ingredients
interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  fdcId?: string;        // USDA food ID for nutrition lookup
  nutrition?: NutritionInfo;
}

// Meal Plan
interface MealPlan {
  id: string;
  date: string;          // YYYY-MM-DD
  meals: {
    breakfast: string[]; // Recipe IDs
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
}

// Food Log (for non-recipe meals)
interface FoodLogEntry {
  id: string;
  date: string;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: LoggedFood[];
}

interface LoggedFood {
  name: string;
  portion: number;
  unit: string;
  nutrition: NutritionInfo;
  source: 'manual' | 'ai-photo' | 'database';
  imageUrl?: string;
}

// User Settings
interface UserSettings {
  dailyCalorieGoal: number;
  macroGoals: {
    protein: number;    // grams
    carbs: number;
    fat: number;
  };
  dietaryPreferences: string[];
  allergies: string[];
  theme: 'light' | 'dark' | 'system';
}


---

## Key Screens

### 1. Dashboard

┌─────────────────────────────────────────┐
│  Today's Progress                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Cal │ │ Pro │ │Carb │ │ Fat │       │
│  │1800 │ │ 85g │ │200g │ │ 60g │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  Today's Meals                          │
│  ┌─────────────────────────────────┐   │
│  │ Breakfast: Greek Yogurt Parfait │   │
│  │ Lunch: [Empty - tap to add]     │   │
│  │ Dinner: Grilled Salmon          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add Food]  [+ Log Photo]           │
└─────────────────────────────────────────┘


### 2. Weekly Planner

┌─────────────────────────────────────────┐
│  Week of Jan 27 - Feb 2         < >     │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ B:  │ B:  │ B:  │     │     │     │     │
│ L:  │ L:  │ L:  │     │     │     │     │
│ D:  │ D:  │ D:  │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
│  Drag recipes from sidebar to plan      │
└─────────────────────────────────────────┘


### 3. Food Logger (with AI Photo)

┌─────────────────────────────────────────┐
│  Log Food                               │
│                                         │
│  [Camera Icon - Take Photo]             │
│  [Gallery Icon - Upload Photo]          │
│                                         │
│  ─── OR ───                             │
│                                         │
│  [Search foods...]                      │
│                                         │
│  Recent Foods:                          │
│  • Apple (95 cal)                       │
│  • Chicken Breast (165 cal)             │
│  • Brown Rice (216 cal)                 │
└─────────────────────────────────────────┘


---

## Implementation Plan

### Step 1: Project Setup
- Initialize Vite + React + TypeScript
- Install TailwindCSS
- Set up shadcn/ui
- Configure Dexie.js database
- Create basic routing (React Router)

### Step 2: Core Data Layer
- Define TypeScript types
- Set up Dexie database with tables
- Create Zustand stores for state management
- Implement USDA API integration for food search

### Step 3: Recipe Management
- RecipeForm component (add/edit)
- RecipeList with search/filter
- RecipeCard display
- Nutrition calculator from ingredients

### Step 4: Food Logging
- Food search with USDA API
- Manual food entry form
- Recent foods list
- AI photo recognition integration (Claude API)

### Step 5: Meal Planner
- Weekly calendar component
- Drag-and-drop meal assignment
- Daily nutrition summary

### Step 6: Dashboard
- Macro progress rings
- Today's meal overview
- Quick action buttons

### Step 7: Settings & Polish
- User goals configuration
- Theme toggle
- Responsive design optimization

---

## API Keys Required

1. *USDA FoodData Central* (free)
   - Register at: https://fdc.nal.usda.gov/api-key-signup.html
   - Used for: Food search and nutrition data

2. *Anthropic Claude* (paid, ~$0.01 per image)
   - For AI food photo recognition
   - Can be deferred - start with manual entry only

---

## MVP Simplifications

1. *No user accounts* - All data stored locally in IndexedDB
2. *No backend* - Pure client-side app
3. *No sync* - Single device only (export/import JSON for backup)
4. *Simple AI* - Photo recognition returns food name + estimated nutrition; user can edit
5. *Basic nutrition* - Focus on calories, protein, carbs, fat only

---

## Files to Create


/package.json
/vite.config.ts
/tsconfig.json
/tailwind.config.js
/postcss.config.js
/index.html
/src/main.tsx
/src/App.tsx
/src/index.css
/src/lib/db.ts
/src/lib/api.ts
/src/lib/nutrition.ts
/src/types/index.ts
/src/stores/recipeStore.ts
/src/stores/settingsStore.ts
/src/components/ui/... (shadcn components)
/src/components/recipes/RecipeForm.tsx
/src/components/recipes/RecipeList.tsx
/src/components/recipes/RecipeCard.tsx
/src/components/tracker/FoodLogger.tsx
/src/components/tracker/MacroRings.tsx
/src/components/planner/WeeklyCalendar.tsx
/src/pages/Dashboard.tsx
/src/pages/Recipes.tsx
/src/pages/Planner.tsx
/src/pages/FoodLog.tsx
/src/pages/Settings.tsx


---

## Verification

1. *Recipe CRUD*: Can add, edit, view, delete recipes
2. *Nutrition calc*: Adding ingredients auto-calculates macros
3. *Meal planning*: Can drag recipes to weekly calendar
4. *Food logging*: Can search and log foods manually
5. *AI photo*: Can upload photo and get food suggestions
6. *Dashboard*: Shows today's progress and planned meals
7. *Local storage*: Data persists after browser refresh
8. *Responsive*: Works on mobile and desktop