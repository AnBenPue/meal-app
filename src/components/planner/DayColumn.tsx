import type { Recipe, MealType, MealPlan } from '@/types';
import { sumNutrition, ZERO_NUTRITION } from '@/lib/nutrition';
import { MealSlot } from '@/components/planner/MealSlot';
import { cn } from '@/lib/utils';

interface DayColumnProps {
  date: string;
  plan: MealPlan | undefined;
  recipesById: Record<string, Recipe>;
  isToday: boolean;
  allRecipes: Recipe[];
  frequency: Record<string, number>;
  onRemove: (date: string, mealType: MealType, recipeId: string) => void;
  onAdd: (date: string, mealType: MealType, recipeId: string) => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
  };
}

export function DayColumn({
  date,
  plan,
  recipesById,
  isToday,
  allRecipes,
  frequency,
  onRemove,
  onAdd,
}: DayColumnProps) {
  const { dayName, dayNum } = formatDay(date);

  // Compute daily nutrition from all assigned recipes
  const allRecipeIds = MEAL_TYPES.flatMap((mt) => plan?.meals[mt] ?? []);
  const dayRecipes = allRecipeIds
    .map((id) => recipesById[id])
    .filter(Boolean);
  const dayNutrition = dayRecipes.length > 0
    ? sumNutrition(...dayRecipes.map((r) => r.nutrition))
    : ZERO_NUTRITION;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border p-2 min-w-[130px]',
        isToday && 'ring-2 ring-primary/30',
      )}
    >
      {/* Day header */}
      <div className="text-center mb-2">
        <div className="text-xs text-muted-foreground">{dayName}</div>
        <div className={cn('text-lg font-bold', isToday && 'text-primary')}>
          {dayNum}
        </div>
      </div>

      {/* Meal slots */}
      <div className="flex-1 space-y-1">
        {MEAL_TYPES.map((mt) => {
          const recipeIds = plan?.meals[mt] ?? [];
          const slotRecipes = recipeIds
            .map((id) => recipesById[id])
            .filter(Boolean);
          return (
            <MealSlot
              key={mt}
              date={date}
              mealType={mt}
              recipes={slotRecipes}
              allRecipes={allRecipes}
              frequency={frequency}
              onRemove={onRemove}
              onAdd={onAdd}
            />
          );
        })}
      </div>

      {/* Day nutrition summary */}
      {dayRecipes.length > 0 && (
        <div className="mt-2 pt-2 border-t text-center text-[10px] text-muted-foreground">
          {dayNutrition.calories} cal
        </div>
      )}
    </div>
  );
}
