import { Trash2, X } from 'lucide-react';
import type { FoodLogEntry } from '@/types';
import { sumNutrition } from '@/lib/nutrition';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MealEntryProps {
  entry: FoodLogEntry;
  onDeleteEntry: (id: string) => void;
  onRemoveFood: (entryId: string, foodIndex: number) => void;
}

const mealLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function MealEntry({ entry, onDeleteEntry, onRemoveFood }: MealEntryProps) {
  const totals = sumNutrition(...entry.foods.map((f) => f.nutrition));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            {mealLabels[entry.mealType]}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {entry.time}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {totals.calories} cal &middot; {totals.protein}g P &middot; {totals.carbs}g C &middot; {totals.fat}g F
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDeleteEntry(entry.id)}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {entry.foods.map((food, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <div>
                <span className="font-medium">{food.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {food.portion}{food.unit} &middot; {food.nutrition.calories} cal
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onRemoveFood(entry.id, idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {entry.foods.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No foods logged.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
