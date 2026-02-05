import { create } from 'zustand';
import { db } from '@/lib/db';
import type { FoodLogEntry, LoggedFood, MealType } from '@/types';

interface FoodLogState {
  entries: FoodLogEntry[];
  loading: boolean;

  loadEntriesByDate: (date: string) => Promise<void>;
  addEntry: (
    date: string,
    mealType: MealType,
    foods: LoggedFood[],
  ) => Promise<FoodLogEntry>;
  updateEntry: (id: string, updates: Partial<Omit<FoodLogEntry, 'id'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addFoodToEntry: (entryId: string, food: LoggedFood) => Promise<void>;
  removeFoodFromEntry: (entryId: string, foodIndex: number) => Promise<void>;
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  entries: [],
  loading: false,

  loadEntriesByDate: async (date) => {
    set({ loading: true });
    const entries = await db.foodLogs.where('date').equals(date).toArray();
    set({ entries, loading: false });
  },

  addEntry: async (date, mealType, foods) => {
    const now = new Date();
    const entry: FoodLogEntry = {
      id: crypto.randomUUID(),
      date,
      time: now.toTimeString().slice(0, 5),
      mealType,
      foods,
    };
    await db.foodLogs.add(entry);
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: async (id, updates) => {
    await db.foodLogs.update(id, updates);
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  deleteEntry: async (id) => {
    await db.foodLogs.delete(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  addFoodToEntry: async (entryId, food) => {
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;

    const updatedFoods = [...entry.foods, food];
    await db.foodLogs.update(entryId, { foods: updatedFoods });
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, foods: updatedFoods } : e
      ),
    }));
  },

  removeFoodFromEntry: async (entryId, foodIndex) => {
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;

    const updatedFoods = entry.foods.filter((_, i) => i !== foodIndex);
    await db.foodLogs.update(entryId, { foods: updatedFoods });
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, foods: updatedFoods } : e
      ),
    }));
  },
}));

/** Get total nutrition for all entries on a given date */
export function useDailyNutrition(date: string) {
  const entries = useFoodLogStore((s) => s.entries);
  const dayEntries = entries.filter((e) => e.date === date);

  return dayEntries.reduce(
    (totals, entry) => {
      for (const food of entry.foods) {
        totals.calories += food.nutrition.calories;
        totals.protein += food.nutrition.protein;
        totals.carbs += food.nutrition.carbs;
        totals.fat += food.nutrition.fat;
      }
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
