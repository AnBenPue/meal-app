import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFoodLogStore, useDailyNutrition } from '@/stores/foodLogStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useRecipeStore } from '@/stores/recipeStore';
import type { Recipe } from '@/types';
import { MacroRings } from '@/components/dashboard/MacroRings';
import { TodayMeals } from '@/components/dashboard/TodayMeals';
import { QuickActions } from '@/components/dashboard/QuickActions';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const today = todayStr();

  const { settings, loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const { entries, loadEntriesByDate } = useFoodLogStore();
  const { loadWeek, getPlan } = usePlannerStore();
  const { recipes, loadRecipes } = useRecipeStore();

  const dailyNutrition = useDailyNutrition(today);
  const todayPlan = getPlan(today);

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
    loadEntriesByDate(today);
    loadWeek(getMonday(today));
    loadRecipes();
  }, [settingsLoaded, loadSettings, loadEntriesByDate, loadWeek, loadRecipes, today]);

  const recipesById = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const r of recipes) map[r.id] = r;
    return map;
  }, [recipes]);

  const todayEntries = entries.filter((e) => e.date === today);

  const goals = useMemo(() => ({
    calories: settings.dailyCalorieGoal,
    protein: settings.macroGoals.protein,
    carbs: settings.macroGoals.carbs,
    fat: settings.macroGoals.fat,
  }), [settings.dailyCalorieGoal, settings.macroGoals.protein, settings.macroGoals.carbs, settings.macroGoals.fat]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Macro progress rings */}
      <MacroRings
        current={dailyNutrition}
        goals={goals}
      />

      {/* Quick actions */}
      <QuickActions />

      {/* Today's meals */}
      <TodayMeals
        plan={todayPlan}
        logEntries={todayEntries}
        recipesById={recipesById}
      />
    </div>
  );
}
