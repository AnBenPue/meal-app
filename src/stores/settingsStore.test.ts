import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueryMock } from '@/test/mocks/supabase';

const { mockFrom, mockRequireAuth, localStorageStore, mockGetItem, mockSetItem } = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return {
    mockFrom: vi.fn(),
    mockRequireAuth: vi.fn().mockResolvedValue('test-user-id'),
    localStorageStore: store,
    mockGetItem: vi.fn((key: string) => store[key] ?? null),
    mockSetItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));

vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
});

import { useSettingsStore } from '@/stores/settingsStore';

const settingsRow = {
  id: 's1',
  user_id: 'test-user-id',
  daily_calorie_goal: 2500,
  protein_goal: 180,
  carbs_goal: 250,
  fat_goal: 70,
  dietary_preferences: ['vegetarian'],
  allergies: ['nuts'],
  usda_api_key: '',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('settingsStore', () => {
  const { getState, setState } = useSettingsStore;

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore localStorage mock implementations after clearAllMocks
    mockGetItem.mockImplementation((key: string) => localStorageStore[key] ?? null);
    mockSetItem.mockImplementation((key: string, value: string) => { localStorageStore[key] = value; });
    mockRequireAuth.mockResolvedValue('test-user-id');
    for (const key of Object.keys(localStorageStore)) {
      delete localStorageStore[key];
    }
    setState({
      settings: {
        id: '',
        dailyCalorieGoal: 2000,
        macroGoals: { protein: 150, carbs: 200, fat: 65 },
        dietaryPreferences: [],
        allergies: [],
        theme: 'system',
        usdaApiKey: '',
      },
      loaded: false,
    });
  });

  describe('loadSettings', () => {
    it('loads settings from DB', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: settingsRow, error: null }),
      );

      await getState().loadSettings();
      expect(getState().settings.dailyCalorieGoal).toBe(2500);
      expect(getState().settings.macroGoals.protein).toBe(180);
      expect(getState().loaded).toBe(true);
    });

    it('falls back to defaults on error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'Not found' } }),
      );

      await getState().loadSettings();
      expect(getState().settings.dailyCalorieGoal).toBe(2000);
      expect(getState().loaded).toBe(true);
    });

    it('uses localStorage theme over DB', async () => {
      // getSavedTheme() checks `typeof window === 'undefined'` — stub window for node env
      vi.stubGlobal('window', {});
      localStorageStore['theme'] = 'dark';
      mockFrom.mockReturnValue(
        createQueryMock({ data: settingsRow, error: null }),
      );

      await getState().loadSettings();
      expect(getState().settings.theme).toBe('dark');
      vi.unstubAllGlobals();
      // Re-stub localStorage after unstubbing
      vi.stubGlobal('localStorage', {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      });
    });
  });

  describe('updateSettings', () => {
    beforeEach(() => {
      setState({
        settings: { ...getState().settings, id: 's1' },
        loaded: true,
      });
    });

    it('saves theme to localStorage', async () => {
      mockFrom.mockReturnValue(createQueryMock({ data: null, error: null }));

      await getState().updateSettings({ theme: 'dark' });
      expect(mockSetItem).toHaveBeenCalledWith('theme', 'dark');
      expect(getState().settings.theme).toBe('dark');
    });

    it('skips DB call when only theme changes', async () => {
      await getState().updateSettings({ theme: 'light' });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls DB when non-theme fields change', async () => {
      mockFrom.mockReturnValue(createQueryMock({ data: null, error: null }));

      await getState().updateSettings({ dailyCalorieGoal: 1800 });
      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(getState().settings.dailyCalorieGoal).toBe(1800);
    });

    it('does not update state on DB error', async () => {
      mockFrom.mockReturnValue(
        createQueryMock({ data: null, error: { message: 'DB error' } }),
      );

      await getState().updateSettings({ dailyCalorieGoal: 1800 });
      expect(getState().settings.dailyCalorieGoal).toBe(2000);
    });
  });
});
