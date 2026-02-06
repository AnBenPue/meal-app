import type { Recipe, MealPlan, FoodLogEntry, UserSettings, Ingredient, LoggedFood, MealType } from '@/types';
import type { Database, Json } from '@/types/supabase';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];
type MealPlanRow = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];
type FoodLogRow = Database['public']['Tables']['food_log_entries']['Row'];
type FoodLogInsert = Database['public']['Tables']['food_log_entries']['Insert'];
type FoodLogUpdate = Database['public']['Tables']['food_log_entries']['Update'];
type SettingsRow = Database['public']['Tables']['user_settings']['Row'];
type SettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

// ── Recipes ──

export function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Recipe['category'],
    ingredients: row.ingredients as unknown as Ingredient[],
    instructions: row.instructions as unknown as string[],
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    nutrition: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function recipeToInsert(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): RecipeInsert {
  return {
    name: recipe.name,
    category: recipe.category,
    ingredients: recipe.ingredients as unknown as Json,
    instructions: recipe.instructions as unknown as Json,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs,
    fat: recipe.nutrition.fat,
  };
}

export function recipeToUpdate(updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>): RecipeUpdate {
  const row: RecipeUpdate = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.ingredients !== undefined) row.ingredients = updates.ingredients as unknown as Json;
  if (updates.instructions !== undefined) row.instructions = updates.instructions as unknown as Json;
  if (updates.prepTime !== undefined) row.prep_time = updates.prepTime;
  if (updates.cookTime !== undefined) row.cook_time = updates.cookTime;
  if (updates.servings !== undefined) row.servings = updates.servings;
  if (updates.nutrition !== undefined) {
    row.calories = updates.nutrition.calories;
    row.protein = updates.nutrition.protein;
    row.carbs = updates.nutrition.carbs;
    row.fat = updates.nutrition.fat;
  }
  return row;
}

// ── Meal Plans ──

export function mealPlanFromRow(row: MealPlanRow): MealPlan {
  return {
    id: row.id,
    date: row.date,
    meals: row.meals as unknown as MealPlan['meals'],
  };
}

export function mealPlanToUpsert(date: string, meals: MealPlan['meals']): MealPlanInsert {
  return {
    date,
    meals: meals as unknown as Json,
  };
}

export function mealPlanToUpdate(meals: MealPlan['meals']): MealPlanUpdate {
  return {
    meals: meals as unknown as Json,
  };
}

// ── Food Log Entries ──

export function foodLogFromRow(row: FoodLogRow): FoodLogEntry {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    mealType: row.meal_type as MealType,
    foods: row.foods as unknown as LoggedFood[],
  };
}

export function foodLogToInsert(entry: Omit<FoodLogEntry, 'id'>): FoodLogInsert {
  return {
    date: entry.date,
    time: entry.time,
    meal_type: entry.mealType,
    foods: entry.foods as unknown as Json,
  };
}

export function foodLogFoodsToUpdate(foods: LoggedFood[]): FoodLogUpdate {
  return {
    foods: foods as unknown as Json,
  };
}

// ── User Settings ──

export function settingsFromRow(row: SettingsRow): UserSettings {
  return {
    id: row.id,
    dailyCalorieGoal: row.daily_calorie_goal,
    macroGoals: {
      protein: row.protein_goal,
      carbs: row.carbs_goal,
      fat: row.fat_goal,
    },
    dietaryPreferences: row.dietary_preferences as unknown as string[],
    allergies: row.allergies as unknown as string[],
    theme: 'system',
    usdaApiKey: row.usda_api_key,
  };
}

export function settingsToUpdate(updates: Partial<Omit<UserSettings, 'id'>>): SettingsUpdate {
  const row: SettingsUpdate = { updated_at: new Date().toISOString() };
  if (updates.dailyCalorieGoal !== undefined) row.daily_calorie_goal = updates.dailyCalorieGoal;
  if (updates.macroGoals !== undefined) {
    row.protein_goal = updates.macroGoals.protein;
    row.carbs_goal = updates.macroGoals.carbs;
    row.fat_goal = updates.macroGoals.fat;
  }
  if (updates.dietaryPreferences !== undefined) row.dietary_preferences = updates.dietaryPreferences as unknown as Json;
  if (updates.allergies !== undefined) row.allergies = updates.allergies as unknown as Json;
  if (updates.usdaApiKey !== undefined) row.usda_api_key = updates.usdaApiKey;
  return row;
}
