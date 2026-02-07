import { Plus, X } from 'lucide-react';
import type { Recipe, MealType } from '@/types';
import { cn } from '@/lib/utils';
import { RecipePicker } from '@/components/planner/RecipePicker';

interface MealSlotProps {
  date: string;
  mealType: MealType;
  recipes: Recipe[];
  allRecipes: Recipe[];
  frequency: Record<string, number>;
  onRemove: (date: string, mealType: MealType, recipeId: string) => void;
  onAdd: (date: string, mealType: MealType, recipeId: string) => void;
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D',
  snack: 'S',
};

const mealColors: Record<MealType, string> = {
  breakfast: 'text-amber-600 dark:text-amber-400',
  lunch: 'text-blue-600 dark:text-blue-400',
  dinner: 'text-purple-600 dark:text-purple-400',
  snack: 'text-green-600 dark:text-green-400',
};

export function MealSlot({
  date,
  mealType,
  recipes,
  allRecipes,
  frequency,
  onRemove,
  onAdd,
}: MealSlotProps) {
  return (
    <div className="min-h-[3rem] rounded-md p-1.5">
      <div className={cn('text-[10px] font-semibold mb-0.5', mealColors[mealType])}>
        {mealLabels[mealType]}
      </div>
      <div className="space-y-0.5">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] group"
          >
            <span className="truncate flex-1">{recipe.name}</span>
            <button
              onClick={() => onRemove(date, mealType, recipe.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
        <RecipePicker
          mealType={mealType}
          recipes={allRecipes}
          frequency={frequency}
          onSelect={(recipeId) => onAdd(date, mealType, recipeId)}
        >
          <button className="w-full flex items-center justify-center rounded border border-dashed border-muted-foreground/30 py-0.5 text-muted-foreground/50 hover:border-primary/50 hover:text-primary/50 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </RecipePicker>
      </div>
    </div>
  );
}
