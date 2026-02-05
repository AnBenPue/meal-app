import { useState } from 'react';
import { X } from 'lucide-react';
import type { Recipe, MealType } from '@/types';
import { cn } from '@/lib/utils';

interface MealSlotProps {
  date: string;
  mealType: MealType;
  recipes: Recipe[];
  onRemove: (date: string, mealType: MealType, recipeId: string) => void;
  onDrop: (date: string, mealType: MealType, recipeId: string) => void;
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

export function MealSlot({ date, mealType, recipes, onRemove, onDrop }: MealSlotProps) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const recipeId = e.dataTransfer.getData('text/plain');
    if (recipeId) {
      onDrop(date, mealType, recipeId);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'min-h-[3rem] rounded-md border border-dashed p-1.5 transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-transparent',
      )}
    >
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
      </div>
    </div>
  );
}
