import { useMemo, useState } from 'react';
import type { MealPlan, Recipe } from '@/types';
import { aggregateIngredients } from '@/lib/shopping';

interface ShoppingListProps {
  plans: Record<string, MealPlan>;
  weekStart: string;
  recipesById: Record<string, Recipe>;
}

function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function ShoppingList({ plans, weekStart, recipesById }: ShoppingListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const { items, recipeCount } = useMemo(() => {
    const dates = getWeekDates(weekStart);
    const allRecipeIds: string[] = [];
    const uniqueRecipeIds = new Set<string>();

    for (const date of dates) {
      const plan = plans[date];
      if (!plan) continue;
      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        for (const id of plan.meals[mealType]) {
          allRecipeIds.push(id);
          if (recipesById[id]) uniqueRecipeIds.add(id);
        }
      }
    }

    return {
      items: aggregateIngredients(allRecipeIds, recipesById),
      recipeCount: uniqueRecipeIds.size,
    };
  }, [plans, weekStart, recipesById]);

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No meals planned this week. Add recipes to your meal plan to generate a shopping list.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {items.length} ingredient{items.length !== 1 ? 's' : ''} from {recipeCount} recipe
        {recipeCount !== 1 ? 's' : ''}
      </p>

      <ul className="divide-border divide-y">
        {items.map((item) => {
          const key = `${item.name.toLowerCase()}|${item.unit.toLowerCase()}`;
          const isChecked = checked.has(key);
          const isQb = item.unit === 'q.b.';
          const amountStr = item.amount % 1 === 0 ? String(item.amount) : item.amount.toFixed(1);

          return (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 py-2 select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleItem(key)}
                  className="size-4 shrink-0 rounded"
                />
                <span className={isChecked ? 'text-muted-foreground line-through' : ''}>
                  {isQb ? (
                    <>
                      <span>{item.name}</span>{' '}
                      <span className="text-muted-foreground">q.b.</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{amountStr}</span>{' '}
                      <span className="text-muted-foreground">{item.unit}</span>{' '}
                      <span>{item.name}</span>
                    </>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
