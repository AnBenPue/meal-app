import { supabase } from '@/lib/supabase';
import type { NutritionInfo } from '@/types';

/** Nutrient IDs from the USDA FoodData Central API */
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
} as const;

export interface USDASearchResult {
  fdcId: number;
  description: string;
  brandName?: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}

export interface USDASearchResponse {
  foods: USDASearchResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Call the USDA proxy Edge Function.
 * The API key is stored server-side and never sent to the client.
 */
async function callUsdaProxy(body: Record<string, unknown>): Promise<unknown> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('usda-proxy', {
    body,
  });

  if (error) {
    throw new Error(error.message || 'USDA proxy request failed');
  }

  return data;
}

/**
 * Search the USDA FoodData Central database.
 * Proxied through a Supabase Edge Function — the API key never leaves the server.
 */
export async function searchFoods(
  query: string,
  _apiKey?: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<USDASearchResponse> {
  const data = await callUsdaProxy({
    action: 'search',
    query,
    pageNumber,
    pageSize,
  });

  return data as USDASearchResponse;
}

/**
 * Get detailed nutrition info for a specific food by FDC ID.
 * Proxied through a Supabase Edge Function — the API key never leaves the server.
 */
export async function getFoodDetails(
  fdcId: number,
  _apiKey?: string,
): Promise<{ description: string; nutrition: NutritionInfo }> {
  const data = await callUsdaProxy({
    action: 'details',
    fdcId,
    nutrients: Object.values(NUTRIENT_IDS).join(','),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = data as any;
  return {
    description: result.description,
    nutrition: extractNutrition(result.foodNutrients ?? []),
  };
}

/**
 * Extract calories, protein, carbs, fat from USDA nutrient array.
 * Values are per 100g serving.
 */
export function extractNutrition(
  nutrients: { nutrientId?: number; number?: string; amount?: number; value?: number }[],
): NutritionInfo {
  const get = (id: number): number => {
    const n = nutrients.find(
      (n) => n.nutrientId === id || Number(n.number) === id,
    );
    return n?.amount ?? n?.value ?? 0;
  };

  return {
    calories: Math.round(get(NUTRIENT_IDS.calories)),
    protein: Math.round(get(NUTRIENT_IDS.protein) * 10) / 10,
    carbs: Math.round(get(NUTRIENT_IDS.carbs) * 10) / 10,
    fat: Math.round(get(NUTRIENT_IDS.fat) * 10) / 10,
  };
}

// ── Recipe URL scraping ──

export interface ScrapedRecipe {
  name: string;
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: NutritionInfo;
  imageUrl?: string;
}

/**
 * Scrape a recipe from a URL via the scrape-recipe Edge Function.
 * The server fetches the page and extracts JSON-LD Recipe data.
 */
export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('scrape-recipe', {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || 'Recipe scraping failed');
  }

  // Edge function returns 200 with { error } for expected failures
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ScrapedRecipe;
}

/**
 * Parse USDA search result into a simplified nutrition object.
 * Nutrition values are per 100g.
 */
export function nutritionFromSearchResult(food: USDASearchResult): NutritionInfo {
  const get = (id: number): number => {
    const n = food.foodNutrients.find((n) => n.nutrientId === id);
    return n?.value ?? 0;
  };

  return {
    calories: Math.round(get(NUTRIENT_IDS.calories)),
    protein: Math.round(get(NUTRIENT_IDS.protein) * 10) / 10,
    carbs: Math.round(get(NUTRIENT_IDS.carbs) * 10) / 10,
    fat: Math.round(get(NUTRIENT_IDS.fat) * 10) / 10,
  };
}
