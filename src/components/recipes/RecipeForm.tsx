import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Recipe, Ingredient, MealType, NutritionInfo } from '@/types';
import { calculateRecipeNutrition, ZERO_NUTRITION } from '@/lib/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RecipeFormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

interface RecipeFormProps {
  initial?: Recipe;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
}

const EMPTY_INGREDIENT: Ingredient = {
  name: '',
  amount: 0,
  unit: 'g',
  nutrition: { ...ZERO_NUTRITION },
};

const UNITS = ['g', 'oz', 'ml', 'cup', 'tbsp', 'tsp', 'piece', 'slice'];

export function RecipeForm({ initial, onSubmit, onCancel }: RecipeFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<MealType>(initial?.category ?? 'dinner');
  const [prepTime, setPrepTime] = useState(initial?.prepTime ?? 0);
  const [cookTime, setCookTime] = useState(initial?.cookTime ?? 0);
  const [servings, setServings] = useState(initial?.servings ?? 1);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients.length ? initial.ingredients : [{ ...EMPTY_INGREDIENT }],
  );
  const [instructions, setInstructions] = useState<string[]>(
    initial?.instructions.length ? initial.instructions : [''],
  );

  const totalNutrition = useMemo(() => calculateRecipeNutrition(ingredients), [ingredients]);

  function updateIngredient(index: number, field: keyof Ingredient, value: string | number) {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== index) return ing;
        const updated = { ...ing, [field]: value };
        // When nutrition fields are edited manually via amount, recalc is done
        // at submission time or via USDA lookup (Step 4)
        return updated;
      }),
    );
  }

  function updateIngredientNutrition(index: number, field: keyof NutritionInfo, value: number) {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== index) return ing;
        return {
          ...ing,
          nutrition: { ...(ing.nutrition ?? ZERO_NUTRITION), [field]: value },
        };
      }),
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, value: string) {
    setInstructions((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addInstruction() {
    setInstructions((prev) => [...prev, '']);
  }

  function removeInstruction(index: number) {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validInstructions = instructions.filter((s) => s.trim());
    onSubmit({
      name: name.trim(),
      category,
      ingredients: validIngredients,
      instructions: validInstructions,
      prepTime,
      cookTime,
      servings,
      nutrition: calculateRecipeNutrition(validIngredients),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Recipe Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grilled Chicken Salad"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as MealType)}>
            <SelectTrigger id="category">
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
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="prep">Prep (min)</Label>
            <Input
              id="prep"
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="cook">Cook (min)</Label>
            <Input
              id="cook"
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Ingredients</Label>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="space-y-1 rounded-md border p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Amt"
                  value={ing.amount || ''}
                  onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                  className="w-20"
                />
                <Select
                  value={ing.unit}
                  onValueChange={(v) => updateIngredient(idx, 'unit', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length === 1}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              {/* Manual nutrition per ingredient */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Cal"
                    value={ing.nutrition?.calories || ''}
                    onChange={(e) =>
                      updateIngredientNutrition(idx, 'calories', Number(e.target.value))
                    }
                    className="text-xs h-7"
                  />
                  <span className="text-[10px] text-muted-foreground">Cal</span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Pro"
                    value={ing.nutrition?.protein || ''}
                    onChange={(e) =>
                      updateIngredientNutrition(idx, 'protein', Number(e.target.value))
                    }
                    className="text-xs h-7"
                  />
                  <span className="text-[10px] text-muted-foreground">Protein (g)</span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Carb"
                    value={ing.nutrition?.carbs || ''}
                    onChange={(e) =>
                      updateIngredientNutrition(idx, 'carbs', Number(e.target.value))
                    }
                    className="text-xs h-7"
                  />
                  <span className="text-[10px] text-muted-foreground">Carbs (g)</span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Fat"
                    value={ing.nutrition?.fat || ''}
                    onChange={(e) =>
                      updateIngredientNutrition(idx, 'fat', Number(e.target.value))
                    }
                    className="text-xs h-7"
                  />
                  <span className="text-[10px] text-muted-foreground">Fat (g)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition summary */}
      <div className="rounded-md bg-muted p-3">
        <Label className="mb-1">Total Nutrition</Label>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="font-semibold">{totalNutrition.calories}</div>
            <div className="text-xs text-muted-foreground">Cal</div>
          </div>
          <div>
            <div className="font-semibold">{totalNutrition.protein}g</div>
            <div className="text-xs text-muted-foreground">Protein</div>
          </div>
          <div>
            <div className="font-semibold">{totalNutrition.carbs}g</div>
            <div className="text-xs text-muted-foreground">Carbs</div>
          </div>
          <div>
            <div className="font-semibold">{totalNutrition.fat}g</div>
            <div className="text-xs text-muted-foreground">Fat</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Instructions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
            <Plus className="h-3 w-3 mr-1" /> Add Step
          </Button>
        </div>
        <div className="space-y-2">
          {instructions.map((step, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="mt-2 text-xs text-muted-foreground w-6 shrink-0">
                {idx + 1}.
              </span>
              <Textarea
                value={step}
                onChange={(e) => updateInstruction(idx, e.target.value)}
                placeholder={`Step ${idx + 1}`}
                rows={2}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeInstruction(idx)}
                disabled={instructions.length === 1}
                className="mt-1"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {initial ? 'Update Recipe' : 'Add Recipe'}
        </Button>
      </div>
    </form>
  );
}
