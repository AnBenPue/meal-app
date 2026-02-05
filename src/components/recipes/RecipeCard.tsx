import { Clock, Users, Pencil, Trash2 } from 'lucide-react';
import type { Recipe } from '@/types';
import { perServingNutrition } from '@/lib/nutrition';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  snack: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const perServing = perServingNutrition(recipe);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{recipe.name}</CardTitle>
          <Badge
            variant="outline"
            className={categoryColors[recipe.category]}
          >
            {recipe.category}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {recipe.prepTime + recipe.cookTime}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {recipe.servings} servings
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(recipe)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(recipe.id)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <NutrientPill label="Cal" value={perServing.calories} unit="" />
          <NutrientPill label="Protein" value={perServing.protein} unit="g" />
          <NutrientPill label="Carbs" value={perServing.carbs} unit="g" />
          <NutrientPill label="Fat" value={perServing.fat} unit="g" />
        </div>
      </CardContent>
    </Card>
  );
}

function NutrientPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-md bg-muted px-2 py-1">
      <div className="font-medium">
        {value}
        {unit}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
