import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
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
    await requireAuth();
    set({ loading: true });
    const dates = getWeekDates(startDate);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .in('date', dates);

    if (error) {
      set({ loading: false });
      throw new Error('Failed to load meal plans');
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
    await requireAuth();
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
      throw new Error('Failed to add recipe to meal plan');
    }

    const plan = mealPlanFromRow(data);
    set((state) => ({
      plans: { ...state.plans, [date]: plan },
    }));
  },

  removeRecipeFromSlot: async (date, mealType, recipeId) => {
    await requireAuth();
    const existing = get().plans[date];
    if (!existing) {
      throw new Error('No meal plan found for this date');
    }

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
      throw new Error('Failed to remove recipe from meal plan');
    }

    const plan = mealPlanFromRow(data);
    set((state) => ({
      plans: { ...state.plans, [date]: plan },
    }));
  },

  moveRecipe: async (fromDate, fromMeal, toDate, toMeal, recipeId) => {
    await requireAuth();
    // Compute both updated meal sets before making any DB calls
    const fromPlan = get().plans[fromDate];
    if (!fromPlan) {
      throw new Error('No meal plan found for the source date');
    }

    const fromMeals = {
      ...fromPlan.meals,
      [fromMeal]: fromPlan.meals[fromMeal].filter((id) => id !== recipeId),
    };

    // Step 1: Remove from source
    const { data: removedData, error: removeError } = await supabase
      .from('meal_plans')
      .update(mealPlanToUpdate(fromMeals))
      .eq('id', fromPlan.id)
      .select()
      .single();

    if (removeError || !removedData) {
      throw new Error('Failed to move recipe');
    }

    // Step 2: Add to target
    const toPlan = fromDate === toDate
      ? mealPlanFromRow(removedData)
      : get().plans[toDate];
    const toMeals = toPlan
      ? { ...toPlan.meals, [toMeal]: [...toPlan.meals[toMeal], recipeId] }
      : { ...emptyMeals(), [toMeal]: [recipeId] };

    const row = mealPlanToUpsert(toDate, toMeals);
    const { data: addedData, error: addError } = await supabase
      .from('meal_plans')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (addError || !addedData) {
      // Rollback: restore the source plan
      await supabase
        .from('meal_plans')
        .update(mealPlanToUpdate(fromPlan.meals))
        .eq('id', fromPlan.id);

      throw new Error('Failed to move recipe');
    }

    // Single state update with both changes
    const updatedFrom = mealPlanFromRow(removedData);
    const updatedTo = mealPlanFromRow(addedData);
    set((state) => ({
      plans: {
        ...state.plans,
        [fromDate]: updatedFrom,
        [toDate]: updatedTo,
      },
    }));
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
