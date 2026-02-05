import { create } from 'zustand';
import { db } from '@/lib/db';
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
    const recipes = await db.recipes.toArray();
    set({ recipes, loading: false });
  },

  addRecipe: async (recipeData) => {
    const now = new Date();
    const recipe: Recipe = {
      ...recipeData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.recipes.add(recipe);
    set((state) => ({ recipes: [...state.recipes, recipe] }));
    return recipe;
  },

  updateRecipe: async (id, updates) => {
    const updatedFields = { ...updates, updatedAt: new Date() };
    await db.recipes.update(id, updatedFields);
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, ...updatedFields } : r
      ),
    }));
  },

  deleteRecipe: async (id) => {
    await db.recipes.delete(id);
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }));
  },

  getRecipe: async (id) => {
    return db.recipes.get(id);
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
