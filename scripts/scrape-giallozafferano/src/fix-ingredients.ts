import 'dotenv/config';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parseItalianIngredient } from './scrape.js';
import { mapCategory } from './category-map.js';
import type { Progress } from './types.js';

const PROGRESS_FILE = new URL('../data/progress.json', import.meta.url).pathname;
const BATCH_SIZE = 50;

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const progress: Progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));

  // Get all enriched recipes (they have nutrition data we want to keep)
  const enrichedEntries = Object.entries(progress.enriched);
  console.log(`Re-parsing ingredients for ${enrichedEntries.length} recipes...`);

  // For each recipe, get the original raw ingredient text from the scraped data,
  // re-parse it, and merge with existing nutrition
  const rows = [];
  let fixedCount = 0;

  for (const [url, enriched] of enrichedEntries) {
    const raw = progress.recipes[url];
    if (!raw) continue;

    // The raw recipe has the original unparsed ingredient objects
    // We need the original text strings from JSON-LD. These are stored
    // in the ingredient name field (since parsing failed, the full text is the name)
    const newIngredients = enriched.ingredients.map((ing) => {
      // Re-parse the name (which contains the full text like "Burro freddo 150 g")
      const parsed = parseItalianIngredient(ing.name);

      // If the re-parse found an amount, use it; otherwise keep original
      if (parsed.amount > 0 || parsed.unit === 'q.b.') {
        fixedCount++;
        return {
          name: parsed.name,
          amount: parsed.amount,
          unit: parsed.unit,
          nutrition: ing.nutrition,
        };
      }

      return ing;
    });

    rows.push({
      source_url: url,
      name: enriched.name,
      source_category: enriched.sourceCategory,
      category: enriched.category,
      image_url: enriched.imageUrl ?? null,
      ingredients: newIngredients,
      instructions: enriched.instructions,
      prep_time: enriched.prepTime,
      cook_time: enriched.cookTime,
      servings: enriched.servings,
      calories: enriched.calories,
      protein: enriched.protein,
      carbs: enriched.carbs,
      fat: enriched.fat,
    });
  }

  console.log(`Fixed ${fixedCount} ingredient quantities`);
  console.log(`Uploading ${rows.length} recipes in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('catalog_recipes')
      .upsert(batch, { onConflict: 'source_url' });

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
    } else {
      console.log(`  Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
