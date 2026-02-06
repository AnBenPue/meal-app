import { useState } from 'react';
import type { LoggedFood } from '@/types';
import { loggedFoodSchema } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ManualFoodEntryProps {
  onAdd: (food: LoggedFood) => void;
}

export function ManualFoodEntry({ onAdd }: ManualFoodEntryProps) {
  const [name, setName] = useState('');
  const [portion, setPortion] = useState(100);
  const [unit, setUnit] = useState('g');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      portion,
      unit,
      nutrition: { calories, protein, carbs, fat },
      source: 'manual' as const,
    };
    const result = loggedFoodSchema.safeParse(data);
    if (!result.success) {
      alert(result.error.issues.map((i) => i.message).join('\n'));
      return;
    }
    onAdd(result.data);
    setName('');
    setPortion(100);
    setUnit('g');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="food-name">Food Name</Label>
        <Input
          id="food-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken breast"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="portion">Portion</Label>
          <Input
            id="portion"
            type="number"
            min={0}
            step="any"
            value={portion}
            onChange={(e) => setPortion(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="g, oz, cup..."
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <Label htmlFor="m-cal">Calories</Label>
          <Input
            id="m-cal"
            type="number"
            min={0}
            value={calories || ''}
            onChange={(e) => setCalories(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="m-pro">Protein (g)</Label>
          <Input
            id="m-pro"
            type="number"
            min={0}
            step="any"
            value={protein || ''}
            onChange={(e) => setProtein(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="m-carb">Carbs (g)</Label>
          <Input
            id="m-carb"
            type="number"
            min={0}
            step="any"
            value={carbs || ''}
            onChange={(e) => setCarbs(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="m-fat">Fat (g)</Label>
          <Input
            id="m-fat"
            type="number"
            min={0}
            step="any"
            value={fat || ''}
            onChange={(e) => setFat(Number(e.target.value))}
          />
        </div>
      </div>

      <Button type="submit" disabled={!name.trim()} className="w-full">
        Add Food
      </Button>
    </form>
  );
}
