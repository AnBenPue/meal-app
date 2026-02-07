import { describe, it, expect } from 'vitest';
import { recipeFormSchema, loggedFoodSchema } from '@/lib/validation';

const validNutrition = { calories: 200, protein: 10, carbs: 30, fat: 5 };

describe('recipeFormSchema', () => {
  const validRecipe = {
    name: 'Test Recipe',
    category: 'dinner' as const,
    ingredients: [{ name: 'Chicken', amount: 200, unit: 'g' }],
    instructions: ['Cook it'],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    nutrition: validNutrition,
  };

  it('accepts a valid recipe', () => {
    const result = recipeFormSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 500 characters', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, name: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, category: 'brunch' });
    expect(result.success).toBe(false);
  });

  it.each(['breakfast', 'lunch', 'dinner', 'snack'] as const)('accepts category: %s', (category) => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, category });
    expect(result.success).toBe(true);
  });

  it('rejects servings < 1', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, servings: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects servings > 1000', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, servings: 1001 });
    expect(result.success).toBe(false);
  });

  it('accepts servings at boundaries (1 and 1000)', () => {
    expect(recipeFormSchema.safeParse({ ...validRecipe, servings: 1 }).success).toBe(true);
    expect(recipeFormSchema.safeParse({ ...validRecipe, servings: 1000 }).success).toBe(true);
  });

  it('validates nested ingredient nutrition', () => {
    const recipe = {
      ...validRecipe,
      ingredients: [{ name: 'Egg', amount: 50, unit: 'g', nutrition: { calories: -1, protein: 6, carbs: 0, fat: 5 } }],
    };
    const result = recipeFormSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it('accepts ingredients without nutrition (optional)', () => {
    const recipe = {
      ...validRecipe,
      ingredients: [{ name: 'Salt', amount: 5, unit: 'g' }],
    };
    const result = recipeFormSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it('rejects non-integer prepTime', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, prepTime: 10.5 });
    expect(result.success).toBe(false);
  });
});

describe('loggedFoodSchema', () => {
  const validFood = {
    name: 'Apple',
    portion: 150,
    unit: 'g',
    nutrition: validNutrition,
    source: 'manual' as const,
  };

  it('accepts a valid food entry', () => {
    const result = loggedFoodSchema.safeParse(validFood);
    expect(result.success).toBe(true);
  });

  it.each(['manual', 'ai-photo', 'database'] as const)('accepts source: %s', (source) => {
    const result = loggedFoodSchema.safeParse({ ...validFood, source });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source', () => {
    const result = loggedFoodSchema.safeParse({ ...validFood, source: 'barcode' });
    expect(result.success).toBe(false);
  });

  it('rejects portion < 0', () => {
    const result = loggedFoodSchema.safeParse({ ...validFood, portion: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects portion > 100000', () => {
    const result = loggedFoodSchema.safeParse({ ...validFood, portion: 100_001 });
    expect(result.success).toBe(false);
  });

  it('accepts optional imageUrl when valid', () => {
    const result = loggedFoodSchema.safeParse({ ...validFood, imageUrl: 'https://example.com/photo.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid imageUrl', () => {
    const result = loggedFoodSchema.safeParse({ ...validFood, imageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('works without imageUrl (optional)', () => {
    const result = loggedFoodSchema.safeParse(validFood);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBeUndefined();
    }
  });
});
