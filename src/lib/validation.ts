import { z } from 'zod';

const MAX_STRING = 500;
const MAX_INSTRUCTION = 2000;
const MAX_CALORIES = 100_000;
const MAX_MACRO = 10_000;
const MAX_SERVINGS = 1000;
const MAX_MINUTES = 10_000;
const MAX_PORTION = 100_000;
const MAX_INGREDIENTS = 200;
const MAX_INSTRUCTIONS = 100;

const nutritionSchema = z.object({
  calories: z.number().min(0).max(MAX_CALORIES),
  protein: z.number().min(0).max(MAX_MACRO),
  carbs: z.number().min(0).max(MAX_MACRO),
  fat: z.number().min(0).max(MAX_MACRO),
});

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(MAX_STRING),
  amount: z.number().min(0).max(MAX_PORTION),
  unit: z.string().trim().min(1).max(50),
  fdcId: z.string().max(50).optional(),
  nutrition: nutritionSchema.optional(),
});

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1, 'Recipe name is required').max(MAX_STRING),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  ingredients: z.array(ingredientSchema).max(MAX_INGREDIENTS),
  instructions: z.array(z.string().trim().min(1).max(MAX_INSTRUCTION)).max(MAX_INSTRUCTIONS),
  prepTime: z.number().int().min(0).max(MAX_MINUTES),
  cookTime: z.number().int().min(0).max(MAX_MINUTES),
  servings: z.number().int().min(1).max(MAX_SERVINGS),
  nutrition: nutritionSchema,
});

export const loggedFoodSchema = z.object({
  name: z.string().trim().min(1, 'Food name is required').max(MAX_STRING),
  portion: z.number().min(0).max(MAX_PORTION),
  unit: z.string().trim().min(1).max(50),
  nutrition: nutritionSchema,
  source: z.enum(['manual', 'ai-photo', 'database']),
  imageUrl: z.string().url().max(2000).optional(),
});

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
export type LoggedFoodInput = z.infer<typeof loggedFoodSchema>;
