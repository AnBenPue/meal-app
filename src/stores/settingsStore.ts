import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { settingsFromRow, settingsToUpdate } from '@/lib/mappers';
import type { UserSettings } from '@/types';

const VALID_THEMES: UserSettings['theme'][] = ['light', 'dark', 'system'];

function getSavedTheme(): UserSettings['theme'] {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme');
  return VALID_THEMES.includes(stored as UserSettings['theme'])
    ? (stored as UserSettings['theme'])
    : 'system';
}

const DEFAULT_SETTINGS: UserSettings = {
  id: '',
  dailyCalorieGoal: 2000,
  macroGoals: {
    protein: 150,
    carbs: 200,
    fat: 65,
  },
  dietaryPreferences: [],
  allergies: [],
  theme: getSavedTheme(),
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
    const userId = await requireAuth();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      set({ settings: DEFAULT_SETTINGS, loaded: true });
      return;
    }

    const settings = settingsFromRow(data);
    settings.theme = getSavedTheme();
    set({ settings, loaded: true });
  },

  updateSettings: async (updates) => {
    await requireAuth();
    const current = get().settings;
    const updated: UserSettings = { ...current, ...updates };

    if (updates.theme !== undefined) {
      localStorage.setItem('theme', updates.theme);
    }

    const dbUpdates = settingsToUpdate(updates);
    const hasDbFields = Object.keys(dbUpdates).some((k) => k !== 'updated_at');
    if (hasDbFields) {
      const { error } = await supabase
        .from('user_settings')
        .update(dbUpdates)
        .eq('id', current.id);

      if (error) {
        console.error('Failed to update settings');
        return;
      }
    }

    set({ settings: updated });
  },
}));
