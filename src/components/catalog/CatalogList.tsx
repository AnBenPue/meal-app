import { Search, Loader2 } from 'lucide-react';
import type { CatalogRecipe, MealType } from '@/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CatalogCard } from '@/components/catalog/CatalogCard';

interface CatalogListProps {
  recipes: CatalogRecipe[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  searchQuery: string;
  categoryFilter: MealType | 'all';
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: MealType | 'all') => void;
  onLoadMore: () => void;
  onClick: (recipe: CatalogRecipe) => void;
  onImport: (recipe: CatalogRecipe) => void;
}

const CATEGORIES: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export function CatalogList({
  recipes,
  totalCount,
  hasMore,
  loading,
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onLoadMore,
  onClick,
  onImport,
}: CatalogListProps) {
  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Italian recipes..."
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

      {/* Count */}
      {totalCount > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {recipes.length} of {totalCount} recipes
        </p>
      )}

      {/* Recipe grid */}
      {loading && recipes.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || categoryFilter !== 'all'
            ? 'No recipes match your search.'
            : 'No recipes in the catalog yet.'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <CatalogCard
                key={recipe.id}
                recipe={recipe}
                onClick={onClick}
                onImport={onImport}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
