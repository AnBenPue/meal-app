import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { mealPlanFromRow, mealPlanToUpsert, mealPlanToUpdate } from '@/lib/mappers';
import type { MealPlan, MealType } from '@/types';

const emptyMeals = (): MealPlan['meals'] => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

interface PlannerState {
  plans: Record<string, MealPlan>;
  loading: boolean;

  loadWeek: (startDate: string) => Promise<void>;
  getPlan: (date: string) => MealPlan | undefined;
  addRecipeToSlot: (date: string, mealType: MealType, recipeId: string) => Promise<void>;
  removeRecipeFromSlot: (date: string, mealType: MealType, recipeId: string) => Promise<void>;
  moveRecipe: (
    fromDate: string,
    fromMeal: MealType,
    toDate: string,
    toMeal: MealType,
    recipeId: string,
  ) => Promise<void>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plans: {},
  loading: false,

  loadWeek: async (startDate) => {
    set({ loading: true });
    const dates = getWeekDates(startDate);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .in('date', dates);

    if (error) {
      console.error('Failed to load week:', error);
      set({ loading: false });
      return;
    }

    const planMap: Record<string, MealPlan> = { ...get().plans };
    for (const row of data) {
      const plan = mealPlanFromRow(row);
      planMap[plan.date] = plan;
    }
    set({ plans: planMap, loading: false });
  },

  getPlan: (date) => get().plans[date],

  addRecipeToSlot: async (date, mealType, recipeId) => {
    const existing = get().plans[date];
    const meals = existing
      ? { ...existing.meals, [mealType]: [...existing.meals[mealType], recipeId] }
      : { ...emptyMeals(), [mealType]: [recipeId] };

    const row = mealPlanToUpsert(date, meals);
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add recipe to slot:', error);
      return;
    }

    const plan = mealPlanFromRow(data);
    set((state) => ({
      plans: { ...state.plans, [date]: plan },
    }));
  },

  removeRecipeFromSlot: async (date, mealType, recipeId) => {
    const existing = get().plans[date];
    if (!existing) return;

    const meals = {
      ...existing.meals,
      [mealType]: existing.meals[mealType].filter((id) => id !== recipeId),
    };

    const { data, error } = await supabase
      .from('meal_plans')
      .update(mealPlanToUpdate(meals))
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to remove recipe from slot:', error);
      return;
    }

    const plan = mealPlanFromRow(data);
    set((state) => ({
      plans: { ...state.plans, [date]: plan },
    }));
  },

  moveRecipe: async (fromDate, fromMeal, toDate, toMeal, recipeId) => {
    await get().removeRecipeFromSlot(fromDate, fromMeal, recipeId);
    await get().addRecipeToSlot(toDate, toMeal, recipeId);
  },
}));

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
