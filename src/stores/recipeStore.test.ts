import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueryMock } from '@/test/mocks/supabase';

const { mockFrom, mockRequireAuth } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRequireAuth: vi.fn().mockResolvedValue('test-user-id'),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));

import { useRecipeStore } from '@/stores/recipeStore';

const recipeRow = (id: string, name: string) => ({
  id,
  user_id: 'test-user-id',
  name,
  category: 'dinner',
  ingredients: [{ name: 'Pasta', amount: 200, unit: 'g' }],
  instructions: ['Cook'],
  prep_time: 10,
  cook_time: 20,
  servings: 4,
  calories: 400,
  protein: 12,
  carbs: 60,
  fat: 8,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
});

describe('recipeStore', () => {
  const { getState, setState } = useRecipeStore;

  beforeEach(() => {
    vi.clearAllMocks();
    setState({ recipes: [], loading: false, searchQuery: '', categoryFilter: 'all' });
  });

  describe('loadRecipes', () => {
    it('populates recipes from DB', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: [recipeRow('1', 'Pasta'), recipeRow('2', 'Salad')], error: null }),
      );

      await getState().loadRecipes();
      expect(getState().recipes).toHaveLength(2);
      expect(getState().recipes[0].name).toBe('Pasta');
      expect(getState().loading).toBe(false);
    });

    it('sets loading false and keeps empty on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'DB error' } }),
      );

      await getState().loadRecipes();
      expect(getState().recipes).toHaveLength(0);
      expect(getState().loading).toBe(false);
    });
  });

  describe('addRecipe', () => {
    it('inserts and prepends to state', async () => {
      setState({ recipes: [{ id: 'existing', name: 'Old' } as never] });
      mockFrom.mockReturnValue(
        createQueryMock({ data: recipeRow('new', 'New Recipe'), error: null }),
      );

      const result = await getState().addRecipe({
        name: 'New Recipe',
        category: 'dinner',
        ingredients: [],
        instructions: [],
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        nutrition: { calories: 300, protein: 10, carbs: 40, fat: 5 },
      });

      expect(result.name).toBe('New Recipe');
      expect(getState().recipes[0].name).toBe('New Recipe');
      expect(getState().recipes).toHaveLength(2);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Insert failed' } }),
      );

      await expect(
        getState().addRecipe({
          name: 'Fail',
          category: 'lunch',
          ingredients: [],
          instructions: [],
          prepTime: 0,
          cookTime: 0,
          servings: 1,
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        }),
      ).rejects.toThrow('Failed to add recipe');
    });
  });

  describe('updateRecipe', () => {
    it('updates recipe in state', async () => {
      setState({ recipes: [{ id: 'r1', name: 'Old', category: 'dinner' } as never] });
      mockFrom.mockReturnValue(
        createQueryMock({ data: recipeRow('r1', 'Updated'), error: null }),
      );

      await getState().updateRecipe('r1', { name: 'Updated' });
      expect(getState().recipes[0].name).toBe('Updated');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Update failed' } }),
      );

      await expect(getState().updateRecipe('r1', { name: 'Fail' })).rejects.toThrow(
        'Failed to update recipe',
      );
    });
  });

  describe('deleteRecipe', () => {
    it('removes recipe from state', async () => {
      setState({
        recipes: [
          { id: 'r1', name: 'Keep' } as never,
          { id: 'r2', name: 'Delete' } as never,
        ],
      });
      mockFrom.mockReturnValue(createQueryMock({ data: null, error: null }));

      await getState().deleteRecipe('r2');
      expect(getState().recipes).toHaveLength(1);
      expect(getState().recipes[0].id).toBe('r1');
    });

    it('does not remove on error', async () => {
      setState({ recipes: [{ id: 'r1', name: 'Keep' } as never] });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Delete failed' } }),
      );

      await getState().deleteRecipe('r1');
      expect(getState().recipes).toHaveLength(1);
    });
  });

  describe('filters', () => {
    it('setSearchQuery updates state', () => {
      getState().setSearchQuery('pasta');
      expect(getState().searchQuery).toBe('pasta');
    });

    it('setCategoryFilter updates state', () => {
      getState().setCategoryFilter('lunch');
      expect(getState().categoryFilter).toBe('lunch');
    });
  });
});
