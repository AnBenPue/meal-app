export interface RawIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RawRecipe {
  name: string;
  sourceUrl: string;
  sourceCategory: string;
  imageUrl?: string;
  ingredients: RawIngredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
}

export interface IngredientNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface EnrichedIngredient extends RawIngredient {
  nutrition: IngredientNutrition;
}

export interface EnrichedRecipe extends Omit<RawRecipe, 'ingredients'> {
  category: string;
  ingredients: EnrichedIngredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Progress {
  discoveredUrls: string[];
  scrapedUrls: string[];
  estimatedUrls: string[];
  uploadedUrls: string[];
  recipes: Record<string, RawRecipe>;
  enriched: Record<string, EnrichedRecipe>;
}
