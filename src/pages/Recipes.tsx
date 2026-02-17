import { useEffect, useState } from 'react';
import { Plus, Link, Loader2 } from 'lucide-react';
import { useRecipeStore, useFilteredRecipes } from '@/stores/recipeStore';
import type { Recipe } from '@/types';
import { scrapeRecipe } from '@/lib/api';
import { scrapedToRecipeFormData } from '@/lib/mappers';
import { RecipeList } from '@/components/recipes/RecipeList';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Recipes() {
  const {
    loadRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    searchQuery,
    categoryFilter,
    setSearchQuery,
    setCategoryFilter,
  } = useRecipeStore();

  const filteredRecipes = useFilteredRecipes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();

  // Import from URL state
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [prefillData, setPrefillData] = useState<
    Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | undefined
  >();

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  function handleAdd() {
    setEditingRecipe(undefined);
    setPrefillData(undefined);
    setDialogOpen(true);
  }

  function handleEdit(recipe: Recipe) {
    setEditingRecipe(recipe);
    setPrefillData(undefined);
    setDialogOpen(true);
  }

  async function handleSubmit(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, data);
    } else {
      await addRecipe(data);
    }
    setDialogOpen(false);
    setEditingRecipe(undefined);
    setPrefillData(undefined);
  }

  async function handleDelete(id: string) {
    await deleteRecipe(id);
  }

  async function handleImport() {
    const trimmed = importUrl.trim();
    if (!trimmed) return;

    setImportLoading(true);
    setImportError('');

    try {
      const scraped = await scrapeRecipe(trimmed);
      const formData = scrapedToRecipeFormData(scraped);
      setImportOpen(false);
      setImportUrl('');
      setEditingRecipe(undefined);
      setPrefillData(formData);
      setDialogOpen(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import recipe');
    } finally {
      setImportLoading(false);
    }
  }

  const dialogTitle = editingRecipe
    ? 'Edit Recipe'
    : prefillData
      ? 'Review Imported Recipe'
      : 'New Recipe';

  const dialogDescription = editingRecipe
    ? 'Update the recipe details below.'
    : prefillData
      ? 'Review and adjust the imported recipe, then save.'
      : 'Fill in the details to create a new recipe.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportOpen(true); setImportError(''); setImportUrl(''); }}>
            <Link className="h-4 w-4 mr-2" />
            Import from URL
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        </div>
      </div>

      <RecipeList
        recipes={filteredRecipes}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Import from URL dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Recipe from URL</DialogTitle>
            <DialogDescription>
              Paste a recipe URL to automatically fill in the details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://example.com/recipe/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleImport(); } }}
              disabled={importLoading}
            />
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importLoading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importLoading || !importUrl.trim()}>
                {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <RecipeForm
            key={editingRecipe?.id ?? (prefillData ? 'import' : 'new')}
            initial={editingRecipe}
            defaultValues={prefillData}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
