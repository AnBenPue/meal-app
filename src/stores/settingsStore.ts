import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { settingsFromRow, settingsToUpdate } from '@/lib/mappers';
import type { UserSettings } from '@/types';

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
  theme: (typeof window !== 'undefined'
    ? (localStorage.getItem('theme') as UserSettings['theme'])
    : null) || 'system',
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
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      set({ settings: DEFAULT_SETTINGS, loaded: true });
      return;
    }

    const settings = settingsFromRow(data);
    settings.theme = (localStorage.getItem('theme') as UserSettings['theme']) || 'system';
    set({ settings, loaded: true });
  },

  updateSettings: async (updates) => {
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
        console.error('Failed to update settings:', error);
        return;
      }
    }

    set({ settings: updated });
  },
}));
