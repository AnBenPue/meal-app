import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = join(__dirname, '..', 'data', 'translate-progress.json');
const PAGE_SIZE = 1000;
const DELAY_MS = 2000;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 15000;

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  nutrition?: { calories: number; protein: number; carbs: number; fat: number };
}

interface CatalogRow {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
}

// Static unit translation map — more reliable than machine-translating abbreviations
const UNIT_MAP: Record<string, string> = {
  cucchiai: 'tbsp',
  cucchiaio: 'tbsp',
  cucchiaini: 'tsp',
  cucchiaino: 'tsp',
  spicchi: 'cloves',
  spicchio: 'cloves',
  foglie: 'leaves',
  foglia: 'leaves',
  fette: 'slices',
  fetta: 'slices',
  bicchieri: 'cups',
  bicchiere: 'cups',
  ciuffi: 'sprigs',
  ciuffo: 'sprigs',
  rametti: 'sprigs',
  rametto: 'sprigs',
  rami: 'sprigs',
  ramo: 'sprigs',
  bustine: 'packets',
  bustina: 'packets',
  pizzico: 'pinch',
  pizzichi: 'pinch',
  pz: 'pcs',
  'q.b.': 'to taste',
  // Keep metric units as-is
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  cl: 'cl',
  dl: 'dl',
};

function translateUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  if (UNIT_MAP[lower] !== undefined) return UNIT_MAP[lower];
  return unit;
}

function loadProgress(): Set<string> {
  if (existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    return new Set(data as string[]);
  }
  return new Set();
}

function saveProgress(ids: Set<string>): void {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...ids], null, 2));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call translate.googleapis.com directly (the endpoint Chrome uses).
 * Has more lenient rate limits than translate.google.com.
 */
async function googleTranslate(text: string): Promise<string> {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'it');
  url.searchParams.set('tl', 'en');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  // Response format: [[["translated","original",null,null,X], ...], null, "it", ...]
  const segments = data[0] as [string, string, ...unknown[]][];
  return segments.map((s) => s[0]).join('');
}

/**
 * Build a single translatable text block for one recipe.
 * Format: name\n---\ningredient names (one per line)\n---\ninstruction steps (one per line)
 */
function buildTranslatableText(recipe: CatalogRow): string {
  const ingredientNames = recipe.ingredients.map((ing) => ing.name).join('\n');
  const instructions = recipe.instructions.join('\n');
  return `${recipe.name}\n---\n${ingredientNames}\n---\n${instructions}`;
}

/**
 * Parse the translated text block back into structured fields.
 * Returns null if the structure doesn't match expectations.
 */
function parseTranslatedText(
  text: string,
  recipe: CatalogRow,
): { name: string; ingredientNames: string[]; instructions: string[] } | null {
  // Try exact separator first, then looser patterns
  let parts = text.split('\n---\n');
  if (parts.length !== 3) {
    parts = text.split(/\n-{3,}\n/);
  }
  if (parts.length !== 3) {
    // Google sometimes adds spaces around ---
    parts = text.split(/\n\s*-{3,}\s*\n/);
  }
  if (parts.length !== 3) {
    console.error(`  Parse error: expected 3 sections, got ${parts.length}`);
    return null;
  }

  const name = parts[0].trim();
  const ingredientNames = parts[1].split('\n').map((s) => s.trim()).filter(Boolean);
  const instructions = parts[2].split('\n').map((s) => s.trim()).filter(Boolean);

  if (ingredientNames.length !== recipe.ingredients.length) {
    console.error(
      `  Ingredient count mismatch: expected ${recipe.ingredients.length}, got ${ingredientNames.length}`,
    );
    return null;
  }

  if (instructions.length !== recipe.instructions.length) {
    console.error(
      `  Instruction count mismatch: expected ${recipe.instructions.length}, got ${instructions.length}`,
    );
    return null;
  }

  return { name, ingredientNames, instructions };
}

interface TranslateResult {
  data: { name: string; ingredientNames: string[]; instructions: string[] } | null;
  wasRateLimited: boolean;
}

/**
 * Translate a single recipe with exponential backoff on rate limiting.
 */
async function translateRecipe(recipe: CatalogRow): Promise<TranslateResult> {
  const text = buildTranslatableText(recipe);
  let wasRateLimited = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const translated = await googleTranslate(text);
      return { data: parseTranslatedText(translated, recipe), wasRateLimited };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many');

      if (is429) {
        wasRateLimited = true;
        if (attempt < MAX_RETRIES) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.warn(`  Rate limited, waiting ${backoff / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(backoff);
          continue;
        }
      }

      console.error(`  Translation error: ${errMsg}`);
      return { data: null, wasRateLimited };
    }
  }

  return { data: null, wasRateLimited };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all catalog recipes (paginated)
  console.log('Fetching catalog recipes...');
  const allRows: CatalogRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('catalog_recipes')
      .select('id, name, ingredients, instructions')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch failed at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...(data as CatalogRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Fetched ${allRows.length} recipes.`);

  // Load progress and filter
  const progress = loadProgress();
  const pending = allRows.filter((r) => !progress.has(r.id));
  console.log(`Already translated: ${progress.size}, remaining: ${pending.length}`);

  if (pending.length === 0) {
    console.log('All recipes already translated.');
    return;
  }

  let translated = 0;
  let skipped = 0;

  for (let i = 0; i < pending.length; i++) {
    const recipe = pending[i];
    const num = i + 1;
    process.stdout.write(`[${num}/${pending.length}] "${recipe.name}" ... `);

    const { data: result, wasRateLimited } = await translateRecipe(recipe);

    if (!result) {
      console.log('SKIPPED');
      skipped++;
      await sleep(wasRateLimited ? 60000 : DELAY_MS);
      continue;
    }

    // Extra cooldown if we hit rate limits but eventually succeeded
    if (wasRateLimited) {
      await sleep(30000);
    }

    // Merge translated fields onto original, preserving amount + nutrition
    const mergedIngredients: Ingredient[] = recipe.ingredients.map((ing, k) => ({
      ...ing,
      name: result.ingredientNames[k],
      unit: translateUnit(ing.unit),
    }));

    // Update DB
    const { error } = await supabase
      .from('catalog_recipes')
      .update({
        name: result.name,
        ingredients: mergedIngredients,
        instructions: result.instructions,
      })
      .eq('id', recipe.id);

    if (error) {
      console.log(`DB ERROR: ${error.message}`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    progress.add(recipe.id);
    translated++;
    console.log('OK');

    // Save progress every 10 recipes
    if (translated % 10 === 0) {
      saveProgress(progress);
    }

    await sleep(DELAY_MS);
  }

  // Final progress save
  saveProgress(progress);
  console.log(`\nDone. Translated: ${translated}, skipped: ${skipped}, total progress: ${progress.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
