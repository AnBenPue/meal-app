import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Recipe, MealType, MealPlan } from '@/types';
import { DayColumn } from '@/components/planner/DayColumn';
import { Button } from '@/components/ui/button';

interface WeeklyCalendarProps {
  weekStart: string;
  plans: Record<string, MealPlan>;
  recipesById: Record<string, Recipe>;
  allRecipes: Recipe[];
  frequency: Record<string, number>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onRemove: (date: string, mealType: MealType, recipeId: string) => void;
  onAdd: (date: string, mealType: MealType, recipeId: string) => void;
}

function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatWeekRange(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function WeeklyCalendar({
  weekStart,
  plans,
  recipesById,
  allRecipes,
  frequency,
  onPrevWeek,
  onNextWeek,
  onToday,
  onRemove,
  onAdd,
}: WeeklyCalendarProps) {
  const dates = getWeekDates(weekStart);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {formatWeekRange(weekStart)}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      {/* Day columns — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-2 min-w-[700px] md:min-w-0">
          {dates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              plan={plans[date]}
              recipesById={recipesById}
              isToday={date === todayStr}
              allRecipes={allRecipes}
              frequency={frequency}
              onRemove={onRemove}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
