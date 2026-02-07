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

import { useFoodLogStore } from '@/stores/foodLogStore';
import type { LoggedFood } from '@/types';

const makeFood = (name: string, calories: number): LoggedFood => ({
  name,
  portion: 100,
  unit: 'g',
  nutrition: { calories, protein: 10, carbs: 20, fat: 5 },
  source: 'manual',
});

const entryRow = (id: string, date: string, foods: LoggedFood[] = []) => ({
  id,
  user_id: 'test-user-id',
  date,
  time: '12:00',
  meal_type: 'lunch',
  foods,
  created_at: '2025-01-01T00:00:00Z',
});

describe('foodLogStore', () => {
  const { getState, setState } = useFoodLogStore;

  beforeEach(() => {
    vi.clearAllMocks();
    setState({ entries: [], loading: false });
  });

  describe('loadEntriesByDate', () => {
    it('loads entries for a date', async () => {
      const rows = [
        entryRow('e1', '2025-06-01', [makeFood('Apple', 95)]),
        entryRow('e2', '2025-06-01', [makeFood('Rice', 200)]),
      ];
      mockFrom.mockReturnValue(createQueryMock({ data: rows, error: null }));

      await getState().loadEntriesByDate('2025-06-01');
      expect(getState().entries).toHaveLength(2);
      expect(getState().loading).toBe(false);
    });

    it('keeps empty on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'DB error' } }),
      );

      await getState().loadEntriesByDate('2025-06-01');
      expect(getState().entries).toHaveLength(0);
      expect(getState().loading).toBe(false);
    });
  });

  describe('addEntry', () => {
    it('inserts and appends to state', async () => {
      const foods = [makeFood('Banana', 105)];
      const newRow = entryRow('e1', '2025-06-01', foods);
      mockFrom.mockReturnValue(createQueryMock({ data: newRow, error: null }));

      const entry = await getState().addEntry('2025-06-01', 'lunch', foods);
      expect(entry.id).toBe('e1');
      expect(getState().entries).toHaveLength(1);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Insert failed' } }),
      );

      await expect(
        getState().addEntry('2025-06-01', 'lunch', []),
      ).rejects.toThrow('Failed to add food log entry');
    });
  });

  describe('updateEntry', () => {
    it('updates entry in state', async () => {
      setState({
        entries: [{ id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [] }],
        loading: false,
      });

      const updatedRow = { ...entryRow('e1', '2025-06-01'), time: '13:00' };
      mockFrom.mockReturnValue(createQueryMock({ data: updatedRow, error: null }));

      await getState().updateEntry('e1', { time: '13:00' });
      expect(getState().entries[0].time).toBe('13:00');
    });

    it('does not update state on error', async () => {
      setState({
        entries: [{ id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [] }],
        loading: false,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Update failed' } }),
      );

      await getState().updateEntry('e1', { time: '13:00' });
      expect(getState().entries[0].time).toBe('12:00');
    });
  });

  describe('deleteEntry', () => {
    it('removes entry from state', async () => {
      setState({
        entries: [
          { id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [] },
          { id: 'e2', date: '2025-06-01', time: '18:00', mealType: 'dinner', foods: [] },
        ],
        loading: false,
      });
      mockFrom.mockReturnValue(createQueryMock({ data: null, error: null }));

      await getState().deleteEntry('e1');
      expect(getState().entries).toHaveLength(1);
      expect(getState().entries[0].id).toBe('e2');
    });

    it('does not remove on error', async () => {
      setState({
        entries: [{ id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [] }],
        loading: false,
      });
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Delete failed' } }),
      );

      await getState().deleteEntry('e1');
      expect(getState().entries).toHaveLength(1);
    });
  });

  describe('addFoodToEntry', () => {
    it('appends food to entry', async () => {
      const existingFood = makeFood('Apple', 95);
      setState({
        entries: [{ id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [existingFood] }],
        loading: false,
      });

      const newFood = makeFood('Banana', 105);
      const updatedRow = entryRow('e1', '2025-06-01', [existingFood, newFood]);
      mockFrom.mockReturnValue(createQueryMock({ data: updatedRow, error: null }));

      await getState().addFoodToEntry('e1', newFood);
      expect(getState().entries[0].foods).toHaveLength(2);
      expect(getState().entries[0].foods[1].name).toBe('Banana');
    });

    it('does nothing if entry not found', async () => {
      await getState().addFoodToEntry('nonexistent', makeFood('Apple', 95));
      expect(getState().entries).toHaveLength(0);
    });
  });

  describe('removeFoodFromEntry', () => {
    it('removes food by index', async () => {
      const food1 = makeFood('Apple', 95);
      const food2 = makeFood('Banana', 105);
      setState({
        entries: [{ id: 'e1', date: '2025-06-01', time: '12:00', mealType: 'lunch', foods: [food1, food2] }],
        loading: false,
      });

      const updatedRow = entryRow('e1', '2025-06-01', [food2]);
      mockFrom.mockReturnValue(createQueryMock({ data: updatedRow, error: null }));

      await getState().removeFoodFromEntry('e1', 0);
      expect(getState().entries[0].foods).toHaveLength(1);
      expect(getState().entries[0].foods[0].name).toBe('Banana');
    });

    it('does nothing if entry not found', async () => {
      await getState().removeFoodFromEntry('nonexistent', 0);
      expect(getState().entries).toHaveLength(0);
    });
  });
});
