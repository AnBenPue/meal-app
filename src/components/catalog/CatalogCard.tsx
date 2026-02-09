import { Clock, Users, Import } from 'lucide-react';
import type { CatalogRecipe } from '@/types';
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

interface CatalogCardProps {
  recipe: CatalogRecipe;
  onClick: (recipe: CatalogRecipe) => void;
  onImport: (recipe: CatalogRecipe) => void;
}

const categoryColors: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  snack: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function CatalogCard({ recipe, onClick, onImport }: CatalogCardProps) {
  const s = recipe.servings > 0 ? recipe.servings : 1;
  const perServing = {
    calories: Math.round(recipe.nutrition.calories / s),
    protein: Math.round((recipe.nutrition.protein / s) * 10) / 10,
    carbs: Math.round((recipe.nutrition.carbs / s) * 10) / 10,
    fat: Math.round((recipe.nutrition.fat / s) * 10) / 10,
  };

  return (
    <Card className="cursor-pointer" onClick={() => onClick(recipe)}>
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="h-40 w-full rounded-t-lg object-cover"
          loading="lazy"
        />
      )}
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base line-clamp-1">{recipe.name}</CardTitle>
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
          <Button
            variant="outline"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onImport(recipe);
            }}
          >
            <Import />
            Import
          </Button>
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
