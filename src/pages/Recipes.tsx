import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRecipeStore, useFilteredRecipes } from '@/stores/recipeStore';
import type { Recipe } from '@/types';
import { RecipeList } from '@/components/recipes/RecipeList';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  function handleAdd() {
    setEditingRecipe(undefined);
    setDialogOpen(true);
  }

  function handleEdit(recipe: Recipe) {
    setEditingRecipe(recipe);
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
  }

  async function handleDelete(id: string) {
    await deleteRecipe(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
            </DialogTitle>
            <DialogDescription>
              {editingRecipe
                ? 'Update the recipe details below.'
                : 'Fill in the details to create a new recipe.'}
            </DialogDescription>
          </DialogHeader>
          <RecipeForm
            key={editingRecipe?.id ?? 'new'}
            initial={editingRecipe}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
