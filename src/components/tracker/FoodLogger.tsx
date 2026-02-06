import { useState } from 'react';
import type { LoggedFood, MealType } from '@/types';
import { FoodSearch } from '@/components/tracker/FoodSearch';
import { ManualFoodEntry } from '@/components/tracker/ManualFoodEntry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FoodLoggerProps {
  onLog: (mealType: MealType, food: LoggedFood) => void;
}

export function FoodLogger({ onLog }: FoodLoggerProps) {
  const [mealType, setMealType] = useState<MealType>(() => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 14) return 'lunch';
    if (hour < 17) return 'snack';
    return 'dinner';
  });

  function handleAdd(food: LoggedFood) {
    onLog(mealType, food);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Meal Type</Label>
        <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="w-full">
          <TabsTrigger value="search" className="flex-1">Database Search</TabsTrigger>
          <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-3">
          <FoodSearch onSelect={handleAdd} />
        </TabsContent>
        <TabsContent value="manual" className="mt-3">
          <ManualFoodEntry onAdd={handleAdd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
