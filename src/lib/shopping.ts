import type { Recipe } from '@/types';

export interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
}

/** Unit normalization: singular → plural, Italian → English */
const UNIT_ALIASES: Record<string, string> = {
  // Italian singular → plural
  cucchiaio: 'tbsp',
  cucchiaino: 'tsp',
  cucchiai: 'tbsp',
  cucchiaini: 'tsp',
  spicchio: 'cloves',
  spicchi: 'cloves',
  foglia: 'leaves',
  foglie: 'leaves',
  ciuffo: 'sprigs',
  ciuffi: 'sprigs',
  fetta: 'slices',
  fette: 'slices',
  rametto: 'sprigs',
  rametti: 'sprigs',
  bustina: 'packets',
  bustine: 'packets',
  bicchiere: 'cups',
  bicchieri: 'cups',
  ramo: 'sprigs',
  rami: 'sprigs',
  // English singular → plural
  tbsp: 'tbsp',
  tsp: 'tsp',
  clove: 'cloves',
  leaf: 'leaves',
  slice: 'slices',
  cup: 'cups',
  sprig: 'sprigs',
  packet: 'packets',
  pinch: 'pinch',
  pcs: 'pcs',
  'to taste': 'to taste',
  'q.b.': 'to taste',
};

/** Units that convert to a base unit, with their multiplier */
const METRIC_TO_BASE: Record<string, { base: string; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  l: { base: 'ml', factor: 1000 },
  cl: { base: 'ml', factor: 10 },
  dl: { base: 'ml', factor: 100 },
};

/** After summing, upscale to larger unit if threshold met */
const UPSCALE: Record<string, { big: string; factor: number }> = {
  g: { big: 'kg', factor: 1000 },
  ml: { big: 'l', factor: 1000 },
};

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  // Singular → plural aliases
  if (UNIT_ALIASES[lower]) return UNIT_ALIASES[lower];
  return lower;
}

function toBaseUnit(amount: number, unit: string): { amount: number; unit: string } {
  const conv = METRIC_TO_BASE[unit];
  if (conv) return { amount: amount * conv.factor, unit: conv.base };
  return { amount, unit };
}

function upscaleDisplay(amount: number, unit: string): { amount: number; unit: string } {
  const rule = UPSCALE[unit];
  if (rule && amount >= rule.factor) {
    return { amount: amount / rule.factor, unit: rule.big };
  }
  return { amount, unit };
}

/**
 * Aggregate ingredients from planned recipes into a deduplicated shopping list.
 * - Normalizes unit variants (Italian/English singular→plural)
 * - Converts metric units to base (g, ml) before summing, upscales for display
 * - Deduplicates "to taste" items per ingredient name
 * Display name uses first-seen capitalization.
 */
export function aggregateIngredients(
  recipeIds: string[],
  recipesById: Record<string, Recipe>,
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  for (const id of recipeIds) {
    const recipe = recipesById[id];
    if (!recipe) continue;

    for (const ing of recipe.ingredients) {
      const normUnit = normalizeUnit(ing.unit);
      const isToTaste = normUnit === 'to taste' || normUnit === 'q.b.';

      // For "to taste" / q.b. items, merge key collapses all entries for same name
      if (isToTaste) {
        const key = `${ing.name.toLowerCase()}|to taste`;
        if (!map.has(key)) {
          map.set(key, { name: ing.name, amount: 0, unit: 'to taste' });
        }
        continue;
      }

      // Convert to base metric unit before summing
      const { amount: baseAmt, unit: baseUnit } = toBaseUnit(ing.amount, normUnit);
      const key = `${ing.name.toLowerCase()}|${baseUnit}`;
      const existing = map.get(key);
      if (existing) {
        existing.amount = existing.amount + baseAmt;
      } else {
        map.set(key, { name: ing.name, amount: baseAmt, unit: baseUnit });
      }
    }
  }

  // Upscale display units and round
  const items: ShoppingItem[] = [];
  for (const item of map.values()) {
    if (item.unit === 'to taste') {
      items.push(item);
    } else {
      const { amount, unit } = upscaleDisplay(item.amount, item.unit);
      const rounded = Math.round(amount * 10) / 10;
      items.push({ name: item.name, amount: rounded, unit });
    }
  }

  return items.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
