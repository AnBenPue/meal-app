import { Clock, Users, ExternalLink, Import } from 'lucide-react';
import type { CatalogRecipe } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CatalogDetailDialogProps {
  recipe: CatalogRecipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (recipe: CatalogRecipe) => void;
}

const categoryColors: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  snack: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function CatalogDetailDialog({
  recipe,
  open,
  onOpenChange,
  onImport,
}: CatalogDetailDialogProps) {
  if (!recipe) return null;

  const s = recipe.servings > 0 ? recipe.servings : 1;
  const perServing = {
    calories: Math.round(recipe.nutrition.calories / s),
    protein: Math.round((recipe.nutrition.protein / s) * 10) / 10,
    carbs: Math.round((recipe.nutrition.carbs / s) * 10) / 10,
    fat: Math.round((recipe.nutrition.fat / s) * 10) / 10,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{recipe.name}</DialogTitle>
            <Badge
              variant="outline"
              className={categoryColors[recipe.category]}
            >
              {recipe.category}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recipe.prepTime + recipe.cookTime}m
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings} servings
            </span>
            <span className="text-xs italic text-muted-foreground">
              {recipe.sourceCategory}
            </span>
          </DialogDescription>
        </DialogHeader>

        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="h-56 w-full rounded-md object-cover"
          />
        )}

        {/* Nutrition per serving */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-md bg-muted px-2 py-1">
            <div className="font-medium">{perServing.calories}</div>
            <div className="text-muted-foreground">Cal</div>
          </div>
          <div className="rounded-md bg-muted px-2 py-1">
            <div className="font-medium">{perServing.protein}g</div>
            <div className="text-muted-foreground">Protein</div>
          </div>
          <div className="rounded-md bg-muted px-2 py-1">
            <div className="font-medium">{perServing.carbs}g</div>
            <div className="text-muted-foreground">Carbs</div>
          </div>
          <div className="rounded-md bg-muted px-2 py-1">
            <div className="font-medium">{perServing.fat}g</div>
            <div className="text-muted-foreground">Fat</div>
          </div>
        </div>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Ingredients</h3>
            <ul className="space-y-1 text-sm">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {ing.amount} {ing.unit}
                  </span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" asChild>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View Original
            </a>
          </Button>
          <Button
            onClick={() => {
              onImport(recipe);
              onOpenChange(false);
            }}
          >
            <Import className="h-4 w-4" />
            Import to My Recipes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
