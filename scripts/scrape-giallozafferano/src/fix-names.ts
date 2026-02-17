import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 50;
const PAGE_SIZE = 1000;

/** Corrupted prefix → correct replacement (case-insensitive match at start of name) */
const CORRUPTION_FIXES: [RegExp, string][] = [
  [/^atte\b/, 'Latte'],
  [/^ievito\b/, 'Lievito'],
  [/^imoni\b/, 'Limoni'],
  [/^imone\b/, 'Limone'],
  [/^rana\b/, 'Grana'],
  [/^orgonzola/, 'Gorgonzola'],
  [/^uanciale/, 'Guanciale'],
  [/^roviera/, 'Groviera'],
  [/^ruyère/, 'Gruyère'],
  [/^elatina/, 'Gelatina'],
  [/^enticchie/, 'Lenticchie'],
  [/^asagne/, 'Lasagne'],
  [/^attuga/, 'Lattuga'],
  [/^occe\b/, 'Gocce'],
  [/^rappa/, 'Grappa'],
  [/^ranella/, 'Granella'],
  [/^iquore/, 'Liquore'],
  [/^ermogli/, 'Germogli'],
  [/^onza\b/, 'Lonza'],
];

/** Italian singular → plural unit normalization */
const UNIT_ALIASES: Record<string, string> = {
  cucchiaio: 'cucchiai',
  cucchiaino: 'cucchiaini',
  spicchio: 'spicchi',
  foglia: 'foglie',
  ciuffo: 'ciuffi',
  fetta: 'fette',
  rametto: 'rametti',
  bustina: 'bustine',
  bicchiere: 'bicchieri',
  ramo: 'rami',
};

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  nutrition?: { calories: number; protein: number; carbs: number; fat: number };
}

interface CatalogRow {
  id: string;
  source_url: string;
  ingredients: Ingredient[];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&frac12;/g, '½')
    .replace(/&frac14;/g, '¼')
    .replace(/&frac34;/g, '¾');
}

function fixIngredientName(name: string): string {
  for (const [pattern, replacement] of CORRUPTION_FIXES) {
    if (pattern.test(name)) {
      return name.replace(pattern, replacement);
    }
  }
  return name;
}

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  return UNIT_ALIASES[lower] ?? unit;
}

function fixIngredient(ing: Ingredient): { ingredient: Ingredient; changed: boolean } {
  let changed = false;

  const fixedName = fixIngredientName(ing.name);
  const decodedName = decodeHtmlEntities(fixedName);
  if (decodedName !== ing.name) changed = true;

  const normUnit = normalizeUnit(ing.unit);
  if (normUnit !== ing.unit) changed = true;

  return {
    ingredient: { ...ing, name: decodedName, unit: normUnit },
    changed,
  };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all catalog recipes (paginated)
  const allRows: CatalogRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('catalog_recipes')
      .select('id, source_url, ingredients')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch failed at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...(data as CatalogRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Fetched ${allRows.length} catalog recipes.`);

  // Process each recipe's ingredients
  const modified: { id: string; source_url: string; ingredients: Ingredient[] }[] = [];
  let totalIngsFixed = 0;

  for (const row of allRows) {
    let recipeChanged = false;
    const fixedIngs: Ingredient[] = [];

    for (const ing of row.ingredients) {
      const { ingredient, changed } = fixIngredient(ing);
      fixedIngs.push(ingredient);
      if (changed) {
        recipeChanged = true;
        totalIngsFixed++;
      }
    }

    if (recipeChanged) {
      modified.push({ id: row.id, source_url: row.source_url, ingredients: fixedIngs });
    }
  }

  console.log(`${modified.length} recipes need updates (${totalIngsFixed} ingredients fixed).`);

  if (modified.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  // Update each recipe by id (update only the ingredients column)
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < modified.length; i += BATCH_SIZE) {
    const batch = modified.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(modified.length / BATCH_SIZE);

    const results = await Promise.all(
      batch.map((r) =>
        supabase
          .from('catalog_recipes')
          .update({ ingredients: r.ingredients })
          .eq('id', r.id)
      ),
    );

    let batchFails = 0;
    for (const { error } of results) {
      if (error) {
        batchFails++;
        failCount++;
      } else {
        successCount++;
      }
    }

    if (batchFails > 0) {
      console.error(`  Batch ${batchNum}/${totalBatches}: ${batch.length - batchFails} ok, ${batchFails} failed`);
    } else {
      console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length} updated`);
    }
  }

  console.log(`Updated ${successCount} recipes, ${failCount} failed.`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
