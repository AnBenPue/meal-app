import { describe, it, expect } from 'vitest';
import {
  scaleNutrition,
  sumNutrition,
  calculateRecipeNutrition,
  perServingNutrition,
  goalProgress,
  ZERO_NUTRITION,
} from '@/lib/nutrition';
import type { NutritionInfo, Ingredient, Recipe } from '@/types';

describe('scaleNutrition', () => {
  const per100g: NutritionInfo = { calories: 200, protein: 10, carbs: 30, fat: 5 };

  it('returns identical values at 100g', () => {
    expect(scaleNutrition(per100g, 100)).toEqual(per100g);
  });

  it('doubles values at 200g', () => {
    expect(scaleNutrition(per100g, 200)).toEqual({
      calories: 400,
      protein: 20,
      carbs: 60,
      fat: 10,
    });
  });

  it('halves values at 50g', () => {
    expect(scaleNutrition(per100g, 50)).toEqual({
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 2.5,
    });
  });

  it('returns zeros at 0g', () => {
    expect(scaleNutrition(per100g, 0)).toEqual(ZERO_NUTRITION);
  });

  it('rounds calories to whole numbers and macros to 1 decimal', () => {
    const result = scaleNutrition({ calories: 155, protein: 7.3, carbs: 22.7, fat: 3.3 }, 33);
    expect(result.calories).toBe(51);
    expect(Number.isInteger(result.calories)).toBe(true);
    // Macros should have at most 1 decimal place
    expect(result.protein).toBe(2.4);
    expect(result.carbs).toBe(7.5);
    expect(result.fat).toBe(1.1);
  });
});

describe('sumNutrition', () => {
  it('sums two items correctly', () => {
    const a: NutritionInfo = { calories: 100, protein: 5, carbs: 20, fat: 3 };
    const b: NutritionInfo = { calories: 200, protein: 10, carbs: 30, fat: 7 };
    expect(sumNutrition(a, b)).toEqual({
      calories: 300,
      protein: 15,
      carbs: 50,
      fat: 10,
    });
  });

  it('returns zeros with no arguments', () => {
    expect(sumNutrition()).toEqual(ZERO_NUTRITION);
  });

  it('handles floating-point accumulation without drift', () => {
    const item: NutritionInfo = { calories: 33, protein: 1.1, carbs: 2.2, fat: 0.3 };
    const result = sumNutrition(item, item, item);
    // 1.1 * 3 = 3.3000000000000003 in JS — should round to 3.3
    expect(result.protein).toBe(3.3);
    expect(result.carbs).toBe(6.6);
    expect(result.fat).toBe(0.9);
    expect(result.calories).toBe(99);
  });
});

describe('calculateRecipeNutrition', () => {
  it('sums nutrition from ingredients that have it', () => {
    const ingredients: Ingredient[] = [
      { name: 'Chicken', amount: 200, unit: 'g', nutrition: { calories: 330, protein: 62, carbs: 0, fat: 7.2 } },
      { name: 'Rice', amount: 150, unit: 'g', nutrition: { calories: 195, protein: 4, carbs: 43, fat: 0.4 } },
    ];
    const result = calculateRecipeNutrition(ingredients);
    expect(result.calories).toBe(525);
    expect(result.protein).toBe(66);
    expect(result.carbs).toBe(43);
    expect(result.fat).toBe(7.6);
  });

  it('skips ingredients without nutrition', () => {
    const ingredients: Ingredient[] = [
      { name: 'Salt', amount: 5, unit: 'g' },
      { name: 'Chicken', amount: 200, unit: 'g', nutrition: { calories: 330, protein: 62, carbs: 0, fat: 7 } },
    ];
    const result = calculateRecipeNutrition(ingredients);
    expect(result.calories).toBe(330);
  });

  it('returns zeros for empty ingredients', () => {
    expect(calculateRecipeNutrition([])).toEqual(ZERO_NUTRITION);
  });
});

describe('perServingNutrition', () => {
  const baseRecipe: Recipe = {
    id: '1',
    name: 'Test',
    category: 'dinner',
    ingredients: [],
    instructions: [],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    nutrition: { calories: 800, protein: 40, carbs: 100, fat: 20 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('divides nutrition by servings', () => {
    expect(perServingNutrition(baseRecipe)).toEqual({
      calories: 200,
      protein: 10,
      carbs: 25,
      fat: 5,
    });
  });

  it('returns total nutrition when servings is 1', () => {
    const recipe = { ...baseRecipe, servings: 1 };
    expect(perServingNutrition(recipe)).toEqual(recipe.nutrition);
  });

  it('returns total nutrition when servings is 0 (guard)', () => {
    const recipe = { ...baseRecipe, servings: 0 };
    expect(perServingNutrition(recipe)).toEqual(recipe.nutrition);
  });

  it('returns total nutrition when servings is negative (guard)', () => {
    const recipe = { ...baseRecipe, servings: -1 };
    expect(perServingNutrition(recipe)).toEqual(recipe.nutrition);
  });
});

describe('goalProgress', () => {
  it('calculates percentage correctly', () => {
    expect(goalProgress(500, 2000)).toBe(25);
    expect(goalProgress(1000, 2000)).toBe(50);
    expect(goalProgress(2000, 2000)).toBe(100);
  });

  it('returns 0 when goal is 0', () => {
    expect(goalProgress(500, 0)).toBe(0);
  });

  it('returns 0 when goal is negative', () => {
    expect(goalProgress(500, -100)).toBe(0);
  });

  it('allows values over 100% (not capped)', () => {
    expect(goalProgress(3000, 2000)).toBe(150);
  });

  it('rounds to nearest integer', () => {
    expect(goalProgress(1, 3)).toBe(33);
    expect(goalProgress(2, 3)).toBe(67);
  });
});
