import { useEffect, useState, useCallback, useRef } from 'react';
import { useCatalogStore } from '@/stores/catalogStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { catalogToUserRecipe } from '@/lib/mappers';
import type { CatalogRecipe } from '@/types';
import { CatalogList } from '@/components/catalog/CatalogList';
import { CatalogDetailDialog } from '@/components/catalog/CatalogDetailDialog';

export default function Catalog() {
  const {
    recipes,
    totalCount,
    hasMore,
    loading,
    searchQuery,
    categoryFilter,
    loadCatalog,
    loadMore,
    setSearchQuery,
    setCategoryFilter,
  } = useCatalogStore();

  const addRecipe = useRecipeStore((s) => s.addRecipe);

  const [detailRecipe, setDetailRecipe] = useState<CatalogRecipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounced search
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        loadCatalog();
      }, 300);
    },
    [setSearchQuery, loadCatalog],
  );

  const handleCategoryChange = useCallback(
    (category: typeof categoryFilter) => {
      setCategoryFilter(category);
      // Category change triggers immediate reload
      // Need to use setTimeout(0) so state is set before loadCatalog reads it
      setTimeout(() => loadCatalog(), 0);
    },
    [setCategoryFilter, loadCatalog],
  );

  function handleClick(recipe: CatalogRecipe) {
    setDetailRecipe(recipe);
    setDetailOpen(true);
  }

  async function handleImport(recipe: CatalogRecipe) {
    await addRecipe(catalogToUserRecipe(recipe));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recipe Catalog</h1>
      </div>

      <CatalogList
        recipes={recipes}
        totalCount={totalCount}
        hasMore={hasMore}
        loading={loading}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onLoadMore={loadMore}
        onClick={handleClick}
        onImport={handleImport}
      />

      <CatalogDetailDialog
        recipe={detailRecipe}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onImport={handleImport}
      />
    </div>
  );
}
