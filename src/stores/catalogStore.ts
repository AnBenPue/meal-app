import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { catalogRecipeFromRow } from '@/lib/mappers';
import type { CatalogRecipe, MealType } from '@/types';

const PAGE_SIZE = 24;

interface CatalogState {
  recipes: CatalogRecipe[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  searchQuery: string;
  categoryFilter: MealType | 'all';

  loadCatalog: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: MealType | 'all') => void;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  recipes: [],
  totalCount: 0,
  page: 0,
  hasMore: false,
  loading: false,
  searchQuery: '',
  categoryFilter: 'all',

  loadCatalog: async (reset = true) => {
    await requireAuth();
    const { searchQuery, categoryFilter } = get();
    const page = reset ? 0 : get().page;

    set({ loading: true });

    let query = supabase
      .from('catalog_recipes')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to load catalog');
      set({ loading: false });
      return;
    }

    const mapped = (data ?? []).map(catalogRecipeFromRow);
    const total = count ?? 0;

    set({
      recipes: reset ? mapped : [...get().recipes, ...mapped],
      totalCount: total,
      page,
      hasMore: (page + 1) * PAGE_SIZE < total,
      loading: false,
    });
  },

  loadMore: async () => {
    const { hasMore, loading, page } = get();
    if (!hasMore || loading) return;
    set({ page: page + 1 });
    await get().loadCatalog(false);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}));
