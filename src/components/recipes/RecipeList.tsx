import { Search } from 'lucide-react';
import type { Recipe, MealType } from '@/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeCard } from '@/components/recipes/RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  searchQuery: string;
  categoryFilter: MealType | 'all';
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: MealType | 'all') => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export function RecipeList({
  recipes,
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onEdit,
  onDelete,
}: RecipeListProps) {
  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={categoryFilter}
          onValueChange={(v) => onCategoryChange(v as MealType | 'all')}
        >
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || categoryFilter !== 'all'
            ? 'No recipes match your search.'
            : 'No recipes yet. Add your first recipe!'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
