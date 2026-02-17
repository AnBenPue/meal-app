import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = join(__dirname, '..', 'data', 'progress.json');
const BATCH_SIZE = 50;

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  const enriched = progress.enriched as Record<string, any>;
  const recipes = Object.values(enriched);

  console.log(`Reverting ${recipes.length} recipes to original Italian...`);

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const rows = batch.map((r: any) => ({
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

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(recipes.length / BATCH_SIZE);

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} failed: ${error.message}`);
    } else {
      console.log(`  Batch ${batchNum}/${totalBatches} OK`);
    }
  }

  console.log('Done — all recipes reverted to Italian.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
