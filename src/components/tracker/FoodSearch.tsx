import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchFoods, nutritionFromSearchResult, type USDASearchResult } from '@/lib/api';
import type { LoggedFood } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FoodSearchProps {
  onSelect: (food: LoggedFood) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<USDASearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await searchFoods(trimmed, undefined, 1, 15);
      setResults(res.foods);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [query]);

  function handleSelect(food: USDASearchResult) {
    const nutrition = nutritionFromSearchResult(food);
    onSelect({
      name: food.description,
      portion: 100,
      unit: 'g',
      nutrition,
      source: 'database',
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={!query.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {results.map((food) => {
          const n = nutritionFromSearchResult(food);
          return (
            <button
              key={food.fdcId}
              type="button"
              onClick={() => handleSelect(food)}
              className="w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <div className="font-medium truncate">{food.description}</div>
              <div className="text-xs text-muted-foreground">
                {n.calories} cal &middot; {n.protein}g P &middot; {n.carbs}g C &middot; {n.fat}g F
                <span className="ml-1">(per 100g)</span>
              </div>
            </button>
          );
        })}
        {searched && results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No results found.
          </p>
        )}
      </div>
    </div>
  );
}
