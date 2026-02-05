import { useState } from 'react';
import { Search, GripVertical } from 'lucide-react';
import type { Recipe } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface RecipeSidebarProps {
  recipes: Recipe[];
}

const categoryColors: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dinner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  snack: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function RecipeSidebar({ recipes }: RecipeSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = recipes.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDragStart(e: React.DragEvent, recipeId: string) {
    e.dataTransfer.setData('text/plain', recipeId);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Recipes</h3>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {recipes.length === 0
              ? 'No recipes yet. Add some in the Recipes tab.'
              : 'No matches.'}
          </p>
        ) : (
          filtered.map((recipe) => (
            <div
              key={recipe.id}
              draggable
              onDragStart={(e) => handleDragStart(e, recipe.id)}
              className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{recipe.name}</span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${categoryColors[recipe.category]}`}
              >
                {recipe.category.charAt(0).toUpperCase()}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
