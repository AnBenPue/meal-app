import type { NutritionInfo, Ingredient, Recipe } from '@/types';

/** Zero nutrition baseline */
export const ZERO_NUTRITION: NutritionInfo = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

/**
 * Scale nutrition values from a per-100g basis to an actual portion.
 * @param per100g - Nutrition per 100g
 * @param grams - Actual portion in grams
 */
export function scaleNutrition(per100g: NutritionInfo, grams: number): NutritionInfo {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
  };
}

/**
 * Sum multiple nutrition objects together.
 */
export function sumNutrition(...items: NutritionInfo[]): NutritionInfo {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: Math.round((total.protein + item.protein) * 10) / 10,
      carbs: Math.round((total.carbs + item.carbs) * 10) / 10,
      fat: Math.round((total.fat + item.fat) * 10) / 10,
    }),
    { ...ZERO_NUTRITION },
  );
}

/**
 * Calculate total nutrition for a recipe from its ingredients.
 * Each ingredient's nutrition is assumed to already be scaled to its amount.
 */
export function calculateRecipeNutrition(ingredients: Ingredient[]): NutritionInfo {
  const withNutrition = ingredients.filter((i) => i.nutrition);
  return sumNutrition(...withNutrition.map((i) => i.nutrition!));
}

/**
 * Get per-serving nutrition from a recipe.
 */
export function perServingNutrition(recipe: Recipe): NutritionInfo {
  if (recipe.servings <= 0) return recipe.nutrition;
  const s = recipe.servings;
  return {
    calories: Math.round(recipe.nutrition.calories / s),
    protein: Math.round((recipe.nutrition.protein / s) * 10) / 10,
    carbs: Math.round((recipe.nutrition.carbs / s) * 10) / 10,
    fat: Math.round((recipe.nutrition.fat / s) * 10) / 10,
  };
}

/**
 * Calculate percentage of a daily goal achieved.
 * Capped at 100 for display purposes (use raw for data).
 */
export function goalProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}
