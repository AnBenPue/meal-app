import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFoodLogStore, useDailyNutrition } from '@/stores/foodLogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { LoggedFood, MealType } from '@/types';
import { goalProgress } from '@/lib/nutrition';
import { MealEntry } from '@/components/tracker/MealEntry';
import { FoodLogger } from '@/components/tracker/FoodLogger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function FoodLog() {
  const [date, setDate] = useState(todayStr);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    entries,
    loadEntriesByDate,
    addEntry,
    deleteEntry,
    removeFoodFromEntry,
  } = useFoodLogStore();

  const { settings, loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const dailyNutrition = useDailyNutrition(date);

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
  }, [settingsLoaded, loadSettings]);

  useEffect(() => {
    loadEntriesByDate(date);
  }, [date, loadEntriesByDate]);

  async function handleLogFood(mealType: MealType, food: LoggedFood) {
    // Find an existing entry for this meal type today, or create one
    const existing = entries.find(
      (e) => e.date === date && e.mealType === mealType,
    );

    if (existing) {
      await useFoodLogStore.getState().addFoodToEntry(existing.id, food);
    } else {
      await addEntry(date, mealType, [food]);
    }
  }

  const isToday = date === todayStr();

  // Sort entries by meal order
  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sortedEntries = [...entries].sort(
    (a, b) => mealOrder.indexOf(a.mealType) - mealOrder.indexOf(b.mealType),
  );

  return (
    <div className="space-y-6">
      {/* Header with date nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Food Log</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Food
        </Button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(shiftDate(date, -1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={() => setDate(todayStr())}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {isToday ? 'Today' : formatDate(date)}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(shiftDate(date, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Daily nutrition summary */}
      <div className="grid grid-cols-4 gap-3">
        <NutrientSummary
          label="Calories"
          current={dailyNutrition.calories}
          goal={settings.dailyCalorieGoal}
          unit=""
        />
        <NutrientSummary
          label="Protein"
          current={dailyNutrition.protein}
          goal={settings.macroGoals.protein}
          unit="g"
        />
        <NutrientSummary
          label="Carbs"
          current={dailyNutrition.carbs}
          goal={settings.macroGoals.carbs}
          unit="g"
        />
        <NutrientSummary
          label="Fat"
          current={dailyNutrition.fat}
          goal={settings.macroGoals.fat}
          unit="g"
        />
      </div>

      {/* Meal entries */}
      {sortedEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No foods logged for this day. Tap "Log Food" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEntries.map((entry) => (
            <MealEntry
              key={entry.id}
              entry={entry}
              onDeleteEntry={deleteEntry}
              onRemoveFood={removeFoodFromEntry}
            />
          ))}
        </div>
      )}

      {/* Food logger dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Food</DialogTitle>
            <DialogDescription>
              Search the USDA database or enter food manually.
            </DialogDescription>
          </DialogHeader>
          <FoodLogger
            apiKey={settings.usdaApiKey}
            onLog={(mealType, food) => {
              handleLogFood(mealType, food);
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NutrientSummary({
  label,
  current,
  goal,
  unit,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
}) {
  const pct = goalProgress(current, goal);
  const rounded = Math.round(current);

  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-lg font-bold">
        {rounded}
        {unit}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {pct}% of {goal}
        {unit}
      </div>
    </div>
  );
}
