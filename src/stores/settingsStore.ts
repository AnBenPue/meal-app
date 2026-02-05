import { create } from 'zustand';
import { db } from '@/lib/db';
import type { UserSettings } from '@/types';

const SETTINGS_ID = 'user-settings';

const DEFAULT_SETTINGS: UserSettings = {
  id: SETTINGS_ID,
  dailyCalorieGoal: 2000,
  macroGoals: {
    protein: 150,
    carbs: 200,
    fat: 65,
  },
  dietaryPreferences: [],
  allergies: [],
  theme: 'system',
  usdaApiKey: '',
};

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Omit<UserSettings, 'id'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const existing = await db.settings.get(SETTINGS_ID);
    if (existing) {
      set({ settings: existing, loaded: true });
    } else {
      await db.settings.add(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS, loaded: true });
    }
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    const updated: UserSettings = { ...current, ...updates };
    await db.settings.put(updated);
    set({ settings: updated });
  },
}));
