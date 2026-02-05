import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePlannerStore } from '@/stores/plannerStore';
import { useRecipeStore } from '@/stores/recipeStore';
import type { Recipe, MealType } from '@/types';
import { WeeklyCalendar } from '@/components/planner/WeeklyCalendar';
import { RecipeSidebar } from '@/components/planner/RecipeSidebar';

/** Get Monday of the week containing the given date */
function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function shiftWeek(startDate: string, weeks: number): string {
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

export default function Planner() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [weekStart, setWeekStart] = useState(() => getMonday(todayStr));

  const { plans, loadWeek, addRecipeToSlot, removeRecipeFromSlot } = usePlannerStore();
  const { recipes, loadRecipes } = useRecipeStore();

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    loadWeek(weekStart);
  }, [weekStart, loadWeek]);

  const recipesById = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const r of recipes) map[r.id] = r;
    return map;
  }, [recipes]);

  const handleDrop = useCallback(
    (date: string, mealType: MealType, recipeId: string) => {
      addRecipeToSlot(date, mealType, recipeId);
    },
    [addRecipeToSlot],
  );

  const handleRemove = useCallback(
    (date: string, mealType: MealType, recipeId: string) => {
      removeRecipeFromSlot(date, mealType, recipeId);
    },
    [removeRecipeFromSlot],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meal Planner</h1>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          <WeeklyCalendar
            weekStart={weekStart}
            plans={plans}
            recipesById={recipesById}
            onPrevWeek={() => setWeekStart(shiftWeek(weekStart, -1))}
            onNextWeek={() => setWeekStart(shiftWeek(weekStart, 1))}
            onToday={() => setWeekStart(getMonday(todayStr))}
            onRemove={handleRemove}
            onDrop={handleDrop}
          />
        </div>

        {/* Recipe sidebar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <RecipeSidebar recipes={recipes} />
        </div>
      </div>
    </div>
  );
}
