import Anthropic from '@anthropic-ai/sdk';
import type { RawRecipe, EnrichedRecipe, EnrichedIngredient } from './types.js';
import { mapCategory } from './category-map.js';

const BATCH_SIZE = 10;

const client = new Anthropic();

interface NutritionEstimate {
  recipeName: string;
  ingredients: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

export async function estimateNutrition(
  recipes: RawRecipe[],
  onProgress?: (url: string, enriched: EnrichedRecipe) => void,
): Promise<Map<string, EnrichedRecipe>> {
  const results = new Map<string, EnrichedRecipe>();

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    console.log(`  Estimating nutrition for batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recipes.length / BATCH_SIZE)}`);

    const prompt = buildPrompt(batch);
    const estimates = await callClaude(prompt);

    for (let j = 0; j < batch.length; j++) {
      const recipe = batch[j];
      const estimate = estimates[j];

      const enriched = enrichRecipe(recipe, estimate ?? {
        recipeName: recipe.name,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        })),
      });
      results.set(recipe.sourceUrl, enriched);
      onProgress?.(recipe.sourceUrl, enriched);
    }
  }

  return results;
}

function buildPrompt(recipes: RawRecipe[]): string {
  const recipeBlocks = recipes.map((r, i) => {
    const ingList = r.ingredients.map((ing) => `  - ${ing.amount} ${ing.unit} ${ing.name}`).join('\n');
    return `Recipe ${i + 1}: "${r.name}" (${r.servings} servings)\n${ingList}`;
  }).join('\n\n');

  return `You are a nutrition expert. Estimate the macronutrient content for each ingredient in these Italian recipes.
For each ingredient, estimate the total calories, protein (g), carbs (g), and fat (g) for the FULL listed amount (not per 100g).

${recipeBlocks}

Respond with ONLY a JSON array (no markdown fences, no extra text). Each element should be:
{
  "recipeName": "...",
  "ingredients": [
    { "name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ]
}

Important:
- Estimate for the FULL quantity listed (e.g., "200 g farina" = nutrition for 200g of flour)
- Use reasonable estimates for Italian ingredients
- If unsure about an amount (e.g., "q.b." = quanto basta), estimate a typical amount
- Round to 1 decimal place for macros, whole numbers for calories`;
}

async function callClaude(prompt: string): Promise<NutritionEstimate[]> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Extract JSON from response (handle possible markdown fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('  No JSON array found in Claude response');
      return [];
    }

    // Repair common JSON issues: trailing commas, truncated output
    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1'); // remove trailing commas
    // If truncated, try to close open brackets
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/\]/g) || []).length;
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    for (let k = 0; k < openBraces - closeBraces; k++) jsonStr += '}';
    for (let k = 0; k < openBrackets - closeBrackets; k++) jsonStr += ']';

    return JSON.parse(jsonStr) as NutritionEstimate[];
  } catch (err) {
    console.error(`  Claude API error: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

function enrichRecipe(raw: RawRecipe, estimate: NutritionEstimate): EnrichedRecipe {
  const enrichedIngredients: EnrichedIngredient[] = raw.ingredients.map((ing, i) => {
    const est = estimate.ingredients[i] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      ...ing,
      nutrition: {
        calories: est.calories,
        protein: est.protein,
        carbs: est.carbs,
        fat: est.fat,
      },
    };
  });

  const totals = enrichedIngredients.reduce(
    (sum, ing) => ({
      calories: sum.calories + ing.nutrition.calories,
      protein: sum.protein + ing.nutrition.protein,
      carbs: sum.carbs + ing.nutrition.carbs,
      fat: sum.fat + ing.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    name: raw.name,
    sourceUrl: raw.sourceUrl,
    sourceCategory: raw.sourceCategory,
    category: mapCategory(raw.sourceCategory),
    imageUrl: raw.imageUrl,
    ingredients: enrichedIngredients,
    instructions: raw.instructions,
    prepTime: raw.prepTime,
    cookTime: raw.cookTime,
    servings: raw.servings,
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}
