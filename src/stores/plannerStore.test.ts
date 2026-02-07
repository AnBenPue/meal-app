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

import { usePlannerStore } from '@/stores/plannerStore';

const emptyMeals = () => ({ breakfast: [] as string[], lunch: [] as string[], dinner: [] as string[], snack: [] as string[] });

const planRow = (id: string, date: string, meals = emptyMeals()) => ({
  id,
  user_id: 'test-user-id',
  date,
  meals,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
});

describe('plannerStore', () => {
  const { getState, setState } = usePlannerStore;

  beforeEach(() => {
    vi.clearAllMocks();
    setState({ plans: {}, loading: false });
  });

  describe('loadWeek', () => {
    it('queries 7 dates and populates plans', async () => {
      const rows = [
        planRow('p1', '2025-06-02', { ...emptyMeals(), breakfast: ['r1'] }),
        planRow('p2', '2025-06-04', { ...emptyMeals(), dinner: ['r2'] }),
      ];
      mockFrom.mockReturnValue(createQueryMock({ data: rows, error: null }));

      await getState().loadWeek('2025-06-02');

      expect(getState().plans['2025-06-02'].meals.breakfast).toEqual(['r1']);
      expect(getState().plans['2025-06-04'].meals.dinner).toEqual(['r2']);
      expect(getState().loading).toBe(false);
    });

    it('throws on DB error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'DB error' } }),
      );

      await expect(getState().loadWeek('2025-06-02')).rejects.toThrow('Failed to load meal plans');
      expect(getState().loading).toBe(false);
    });

    it('preserves existing plans for other dates', async () => {
      setState({
        plans: { '2025-05-26': planRow('old', '2025-05-26') as never },
        loading: false,
      });
      mockFrom.mockReturnValue(createQueryMock({ data: [], error: null }));

      await getState().loadWeek('2025-06-02');
      expect(getState().plans['2025-05-26']).toBeDefined();
    });
  });

  describe('getPlan', () => {
    it('returns plan for existing date', () => {
      setState({ plans: { '2025-06-02': { id: 'p1', date: '2025-06-02', meals: emptyMeals() } }, loading: false });
      expect(getState().getPlan('2025-06-02')).toBeDefined();
    });

    it('returns undefined for missing date', () => {
      expect(getState().getPlan('2025-06-02')).toBeUndefined();
    });
  });

  describe('addRecipeToSlot', () => {
    it('creates new plan when none exists for date', async () => {
      const newPlan = planRow('p1', '2025-06-02', { ...emptyMeals(), lunch: ['r1'] });
      mockFrom.mockReturnValue(createQueryMock({ data: newPlan, error: null }));

      await getState().addRecipeToSlot('2025-06-02', 'lunch', 'r1');

      expect(getState().plans['2025-06-02'].meals.lunch).toEqual(['r1']);
    });

    it('appends to existing slot', async () => {
      setState({
        plans: {
          '2025-06-02': { id: 'p1', date: '2025-06-02', meals: { ...emptyMeals(), lunch: ['r1'] } },
        },
        loading: false,
      });

      const updated = planRow('p1', '2025-06-02', { ...emptyMeals(), lunch: ['r1', 'r2'] });
      mockFrom.mockReturnValue(createQueryMock({ data: updated, error: null }));

      await getState().addRecipeToSlot('2025-06-02', 'lunch', 'r2');
      expect(getState().plans['2025-06-02'].meals.lunch).toEqual(['r1', 'r2']);
    });

    it('throws on DB error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Upsert failed' } }),
      );

      await expect(
        getState().addRecipeToSlot('2025-06-02', 'lunch', 'r1'),
      ).rejects.toThrow('Failed to add recipe to meal plan');
    });
  });

  describe('removeRecipeFromSlot', () => {
    it('removes recipe from slot', async () => {
      setState({
        plans: {
          '2025-06-02': { id: 'p1', date: '2025-06-02', meals: { ...emptyMeals(), lunch: ['r1', 'r2'] } },
        },
        loading: false,
      });

      const updated = planRow('p1', '2025-06-02', { ...emptyMeals(), lunch: ['r2'] });
      mockFrom.mockReturnValue(createQueryMock({ data: updated, error: null }));

      await getState().removeRecipeFromSlot('2025-06-02', 'lunch', 'r1');
      expect(getState().plans['2025-06-02'].meals.lunch).toEqual(['r2']);
    });

    it('throws when no plan exists for date', async () => {
      await expect(
        getState().removeRecipeFromSlot('2025-06-02', 'lunch', 'r1'),
      ).rejects.toThrow('No meal plan found for this date');
    });
  });

});
