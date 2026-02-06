import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { foodLogFromRow, foodLogToInsert, foodLogFoodsToUpdate } from '@/lib/mappers';
import type { Database } from '@/types/supabase';
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
    await requireAuth();
    set({ loading: true });
    const { data, error } = await supabase
      .from('food_log_entries')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      console.error('Failed to load food log');
      set({ loading: false });
      return;
    }

    set({ entries: data.map(foodLogFromRow), loading: false });
  },

  addEntry: async (date, mealType, foods) => {
    await requireAuth();
    const now = new Date();
    const row = foodLogToInsert({
      date,
      time: now.toTimeString().slice(0, 5),
      mealType,
      foods,
    });

    const { data, error } = await supabase
      .from('food_log_entries')
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add food log entry');
      throw new Error('Failed to add food log entry');
    }

    const entry = foodLogFromRow(data);
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: async (id, updates) => {
    await requireAuth();
    const dbUpdates: Database['public']['Tables']['food_log_entries']['Update'] = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.mealType !== undefined) dbUpdates.meal_type = updates.mealType;
    if (updates.foods !== undefined) dbUpdates.foods = updates.foods as unknown as Database['public']['Tables']['food_log_entries']['Update']['foods'];

    const { data, error } = await supabase
      .from('food_log_entries')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update food log entry');
      return;
    }

    const updated = foodLogFromRow(data);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
    }));
  },

  deleteEntry: async (id) => {
    await requireAuth();
    const { error } = await supabase
      .from('food_log_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete food log entry');
      return;
    }

    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  addFoodToEntry: async (entryId, food) => {
    await requireAuth();
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;

    const updatedFoods = [...entry.foods, food];
    const { data, error } = await supabase
      .from('food_log_entries')
      .update(foodLogFoodsToUpdate(updatedFoods))
      .eq('id', entryId)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add food to entry');
      return;
    }

    const updated = foodLogFromRow(data);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entryId ? updated : e)),
    }));
  },

  removeFoodFromEntry: async (entryId, foodIndex) => {
    await requireAuth();
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;

    const updatedFoods = entry.foods.filter((_, i) => i !== foodIndex);
    const { data, error } = await supabase
      .from('food_log_entries')
      .update(foodLogFoodsToUpdate(updatedFoods))
      .eq('id', entryId)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to remove food from entry');
      return;
    }

    const updated = foodLogFromRow(data);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entryId ? updated : e)),
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
