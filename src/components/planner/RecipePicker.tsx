import { useState, useMemo, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import type { Recipe, MealType } from '@/types';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RecipePickerProps {
  mealType: MealType;
  recipes: Recipe[];
  frequency: Record<string, number>;
  onSelect: (recipeId: string) => void;
  children: ReactNode;
}

export function RecipePicker({
  mealType,
  recipes,
  frequency,
  onSelect,
  children,
}: RecipePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const matching: Recipe[] = [];
    const other: Recipe[] = [];
    for (const r of recipes) {
      if (r.category === mealType) matching.push(r);
      else other.push(r);
    }
    const byFreqAlpha = (a: Recipe, b: Recipe) => {
      const fa = frequency[a.id] ?? 0;
      const fb = frequency[b.id] ?? 0;
      if (fb !== fa) return fb - fa;
      return a.name.localeCompare(b.name);
    };
    matching.sort(byFreqAlpha);
    other.sort(byFreqAlpha);
    return [...matching, ...other];
  }, [recipes, mealType, frequency]);

  const filtered = useMemo(() => {
    if (!search) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((r) => r.name.toLowerCase().includes(q));
  }, [sorted, search]);

  function handleSelect(recipeId: string) {
    onSelect(recipeId);
    setOpen(false);
    setSearch('');
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {recipes.length === 0 ? 'No recipes yet.' : 'No matches.'}
            </p>
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe.id)}
                className="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors truncate"
              >
                {recipe.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
