import type { Recipe } from '@/types';

export interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
}

/**
 * Aggregate ingredients from planned recipes into a deduplicated shopping list.
 * Merge key: lowercase(name) + "|" + lowercase(unit) — same ingredient+unit = sum amounts.
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
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.amount = existing.amount + ing.amount;
      } else {
        map.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
