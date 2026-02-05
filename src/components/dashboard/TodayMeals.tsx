import type { Recipe, MealType, MealPlan, FoodLogEntry } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TodayMealsProps {
  plan: MealPlan | undefined;
  logEntries: FoodLogEntry[];
  recipesById: Record<string, Recipe>;
}

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { type: 'lunch', label: 'Lunch', icon: '☀️' },
  { type: 'dinner', label: 'Dinner', icon: '🌙' },
  { type: 'snack', label: 'Snack', icon: '🍎' },
];

export function TodayMeals({ plan, logEntries, recipesById }: TodayMealsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Meals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {MEAL_TYPES.map(({ type, label, icon }) => {
          const plannedIds = plan?.meals[type] ?? [];
          const plannedRecipes = plannedIds
            .map((id) => recipesById[id])
            .filter(Boolean);
          const loggedEntry = logEntries.find((e) => e.mealType === type);

          const hasContent = plannedRecipes.length > 0 || (loggedEntry && loggedEntry.foods.length > 0);

          return (
            <div key={type} className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                {hasContent ? (
                  <div className="space-y-0.5 mt-0.5">
                    {/* Planned recipes */}
                    {plannedRecipes.map((r) => (
                      <div key={r.id} className="text-xs text-muted-foreground truncate">
                        {r.name}
                        <span className="ml-1 text-[10px]">
                          ({r.nutrition.calories} cal)
                        </span>
                      </div>
                    ))}
                    {/* Logged foods */}
                    {loggedEntry?.foods.map((food, i) => (
                      <div key={i} className="text-xs text-muted-foreground truncate">
                        {food.name}
                        <span className="ml-1 text-[10px]">
                          ({food.nutrition.calories} cal)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Nothing planned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
