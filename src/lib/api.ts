import type { NutritionInfo } from '@/types';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

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
 * Search the USDA FoodData Central database.
 * Requires an API key — get one free at https://fdc.nal.usda.gov/api-key-signup.html
 */
export async function searchFoods(
  query: string,
  apiKey: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<USDASearchResponse> {
  const res = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      pageNumber,
      pageSize,
      dataType: ['Foundation', 'SR Legacy', 'Branded'],
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
    }),
  });

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Get detailed nutrition info for a specific food by FDC ID.
 */
export async function getFoodDetails(
  fdcId: number,
  apiKey: string,
): Promise<{ description: string; nutrition: NutritionInfo }> {
  const res = await fetch(
    `${USDA_BASE_URL}/food/${fdcId}?api_key=${apiKey}&nutrients=${Object.values(NUTRIENT_IDS).join(',')}`,
  );

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    description: data.description,
    nutrition: extractNutrition(data.foodNutrients ?? []),
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
