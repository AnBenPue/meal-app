export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  fdcId?: string;
  nutrition?: NutritionInfo;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: NutritionInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlan {
  id: string;
  date: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
}

export interface LoggedFood {
  name: string;
  portion: number;
  unit: string;
  nutrition: NutritionInfo;
  source: 'manual' | 'ai-photo' | 'database';
  imageUrl?: string;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: LoggedFood[];
}

export interface UserSettings {
  id: string;
  dailyCalorieGoal: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryPreferences: string[];
  allergies: string[];
  theme: 'light' | 'dark' | 'system';
  usdaApiKey: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
