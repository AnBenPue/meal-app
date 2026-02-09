import { createClient } from '@supabase/supabase-js';
import type { EnrichedRecipe } from './types.js';

const BATCH_SIZE = 50;

export async function uploadRecipes(recipes: EnrichedRecipe[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Uploading ${recipes.length} recipes in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const rows = batch.map((r) => ({
      name: r.name,
      source_url: r.sourceUrl,
      source_category: r.sourceCategory,
      category: r.category,
      image_url: r.imageUrl ?? null,
      ingredients: r.ingredients,
      instructions: r.instructions,
      prep_time: r.prepTime,
      cook_time: r.cookTime,
      servings: r.servings,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
    }));

    const { error } = await supabase
      .from('catalog_recipes')
      .upsert(rows, { onConflict: 'source_url' });

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
    } else {
      console.log(`  Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recipes.length / BATCH_SIZE)}`);
    }
  }

  console.log('Upload complete.');
}
