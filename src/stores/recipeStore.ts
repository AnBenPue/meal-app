import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { recipeFromRow, recipeToInsert, recipeToUpdate } from '@/lib/mappers';
import type { Recipe, MealType } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  searchQuery: string;
  categoryFilter: MealType | 'all';

  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipe: (id: string) => Promise<Recipe | undefined>;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: MealType | 'all') => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  categoryFilter: 'all',

  loadRecipes: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load recipes:', error);
      set({ loading: false });
      return;
    }

    set({ recipes: data.map(recipeFromRow), loading: false });
  },

  addRecipe: async (recipeData) => {
    const row = recipeToInsert(recipeData);
    const { data, error } = await supabase
      .from('recipes')
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add recipe:', error);
      throw error;
    }

    const recipe = recipeFromRow(data);
    set((state) => ({ recipes: [recipe, ...state.recipes] }));
    return recipe;
  },

  updateRecipe: async (id, updates) => {
    const row = recipeToUpdate(updates);
    const { data, error } = await supabase
      .from('recipes')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update recipe:', error);
      throw error ?? new Error('Failed to update recipe: no data returned');
    }

    const updated = recipeFromRow(data);
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? updated : r)),
    }));
  },

  deleteRecipe: async (id) => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete recipe:', error);
      return;
    }

    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }));
  },

  getRecipe: async (id) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return recipeFromRow(data);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}));

/** Derived selector: filtered recipes based on search + category */
export function useFilteredRecipes() {
  const recipes = useRecipeStore((s) => s.recipes);
  const query = useRecipeStore((s) => s.searchQuery);
  const category = useRecipeStore((s) => s.categoryFilter);

  return recipes.filter((r) => {
    const matchesSearch =
      !query || r.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' || r.category === category;
    return matchesSearch && matchesCategory;
  });
}
