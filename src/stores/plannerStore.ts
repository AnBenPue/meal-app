import { create } from 'zustand';
import { db } from '@/lib/db';
import type { MealPlan, MealType } from '@/types';

const emptyMeals = (): MealPlan['meals'] => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

interface PlannerState {
  /** Meal plans keyed by date string (YYYY-MM-DD) */
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
    const plans = await db.mealPlans
      .where('date')
      .anyOf(dates)
      .toArray();

    const planMap: Record<string, MealPlan> = { ...get().plans };
    for (const plan of plans) {
      planMap[plan.date] = plan;
    }
    set({ plans: planMap, loading: false });
  },

  getPlan: (date) => get().plans[date],

  addRecipeToSlot: async (date, mealType, recipeId) => {
    const existing = get().plans[date];
    const plan: MealPlan = existing
      ? { ...existing, meals: { ...existing.meals, [mealType]: [...existing.meals[mealType], recipeId] } }
      : { id: crypto.randomUUID(), date, meals: { ...emptyMeals(), [mealType]: [recipeId] } };

    await db.mealPlans.put(plan);
    set((state) => ({
      plans: { ...state.plans, [date]: plan },
    }));
  },

  removeRecipeFromSlot: async (date, mealType, recipeId) => {
    const existing = get().plans[date];
    if (!existing) return;

    const updated: MealPlan = {
      ...existing,
      meals: {
        ...existing.meals,
        [mealType]: existing.meals[mealType].filter((id) => id !== recipeId),
      },
    };

    await db.mealPlans.put(updated);
    set((state) => ({
      plans: { ...state.plans, [date]: updated },
    }));
  },

  moveRecipe: async (fromDate, fromMeal, toDate, toMeal, recipeId) => {
    await get().removeRecipeFromSlot(fromDate, fromMeal, recipeId);
    await get().addRecipeToSlot(toDate, toMeal, recipeId);
  },
}));

/** Get an array of YYYY-MM-DD strings for the week starting at startDate */
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
