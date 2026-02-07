import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  recipeFromRow,
  recipeToInsert,
  recipeToUpdate,
  mealPlanFromRow,
  mealPlanToUpsert,
  mealPlanToUpdate,
  foodLogFromRow,
  foodLogToInsert,
  foodLogFoodsToUpdate,
  settingsFromRow,
  settingsToUpdate,
} from '@/lib/mappers';

describe('recipe mappers', () => {
  const recipeRow = {
    id: 'r1',
    user_id: 'u1',
    name: 'Pasta',
    category: 'dinner',
    ingredients: [{ name: 'Noodles', amount: 200, unit: 'g' }],
    instructions: ['Boil', 'Drain'],
    prep_time: 5,
    cook_time: 15,
    servings: 2,
    calories: 400,
    protein: 12,
    carbs: 60,
    fat: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  describe('recipeFromRow', () => {
    it('maps snake_case row to camelCase Recipe', () => {
      const recipe = recipeFromRow(recipeRow as never);
      expect(recipe.id).toBe('r1');
      expect(recipe.name).toBe('Pasta');
      expect(recipe.prepTime).toBe(5);
      expect(recipe.cookTime).toBe(15);
      expect(recipe.nutrition).toEqual({ calories: 400, protein: 12, carbs: 60, fat: 8 });
      expect(recipe.createdAt).toBeInstanceOf(Date);
      expect(recipe.updatedAt).toBeInstanceOf(Date);
    });

    it('flattens nutrition from separate columns', () => {
      const recipe = recipeFromRow(recipeRow as never);
      expect(recipe.nutrition.calories).toBe(400);
      expect(recipe.nutrition.protein).toBe(12);
      expect(recipe.nutrition.carbs).toBe(60);
      expect(recipe.nutrition.fat).toBe(8);
    });

    it('preserves ingredients and instructions as arrays', () => {
      const recipe = recipeFromRow(recipeRow as never);
      expect(recipe.ingredients).toEqual([{ name: 'Noodles', amount: 200, unit: 'g' }]);
      expect(recipe.instructions).toEqual(['Boil', 'Drain']);
    });
  });

  describe('recipeToInsert', () => {
    it('maps camelCase to snake_case insert', () => {
      const input = {
        name: 'Salad',
        category: 'lunch' as const,
        ingredients: [{ name: 'Lettuce', amount: 100, unit: 'g' }],
        instructions: ['Wash', 'Toss'],
        prepTime: 10,
        cookTime: 0,
        servings: 1,
        nutrition: { calories: 150, protein: 5, carbs: 10, fat: 8 },
      };
      const row = recipeToInsert(input);
      expect(row.name).toBe('Salad');
      expect(row.prep_time).toBe(10);
      expect(row.cook_time).toBe(0);
      expect(row.calories).toBe(150);
      expect(row.protein).toBe(5);
    });
  });

  describe('recipeToUpdate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('always includes updated_at', () => {
      const row = recipeToUpdate({});
      expect(row.updated_at).toBe('2025-06-01T12:00:00.000Z');
    });

    it('maps only provided fields', () => {
      const row = recipeToUpdate({ name: 'New Name' });
      expect(row.name).toBe('New Name');
      expect(row.category).toBeUndefined();
      expect(row.prep_time).toBeUndefined();
    });

    it('unfolds nutrition to separate columns', () => {
      const row = recipeToUpdate({ nutrition: { calories: 500, protein: 20, carbs: 60, fat: 15 } });
      expect(row.calories).toBe(500);
      expect(row.protein).toBe(20);
      expect(row.carbs).toBe(60);
      expect(row.fat).toBe(15);
    });
  });
});

describe('meal plan mappers', () => {
  const meals = { breakfast: ['r1'], lunch: [], dinner: ['r2', 'r3'], snack: [] };

  describe('mealPlanFromRow', () => {
    it('maps row to MealPlan', () => {
      const row = { id: 'mp1', user_id: 'u1', date: '2025-06-01', meals, created_at: '', updated_at: '' };
      const plan = mealPlanFromRow(row as never);
      expect(plan.id).toBe('mp1');
      expect(plan.date).toBe('2025-06-01');
      expect(plan.meals.breakfast).toEqual(['r1']);
      expect(plan.meals.dinner).toEqual(['r2', 'r3']);
    });
  });

  describe('mealPlanToUpsert', () => {
    it('creates insert row with date and meals', () => {
      const row = mealPlanToUpsert('2025-06-01', meals);
      expect(row.date).toBe('2025-06-01');
      expect(row.meals).toEqual(meals);
    });
  });

  describe('mealPlanToUpdate', () => {
    it('creates update row with meals only', () => {
      const row = mealPlanToUpdate(meals);
      expect(row.meals).toEqual(meals);
      expect(Object.keys(row)).toEqual(['meals']);
    });
  });
});

describe('food log mappers', () => {
  const foods = [
    { name: 'Apple', portion: 150, unit: 'g', nutrition: { calories: 78, protein: 0.4, carbs: 20, fat: 0.2 }, source: 'manual' as const },
  ];

  describe('foodLogFromRow', () => {
    it('maps row to FoodLogEntry', () => {
      const row = { id: 'fl1', user_id: 'u1', date: '2025-06-01', time: '12:30', meal_type: 'lunch', foods, created_at: '' };
      const entry = foodLogFromRow(row as never);
      expect(entry.id).toBe('fl1');
      expect(entry.mealType).toBe('lunch');
      expect(entry.foods).toEqual(foods);
    });
  });

  describe('foodLogToInsert', () => {
    it('maps camelCase to snake_case insert', () => {
      const row = foodLogToInsert({ date: '2025-06-01', time: '12:30', mealType: 'lunch', foods });
      expect(row.meal_type).toBe('lunch');
      expect(row.foods).toEqual(foods);
    });
  });

  describe('foodLogFoodsToUpdate', () => {
    it('wraps foods array in update object', () => {
      const row = foodLogFoodsToUpdate(foods);
      expect(row.foods).toEqual(foods);
      expect(Object.keys(row)).toEqual(['foods']);
    });
  });
});

describe('settings mappers', () => {
  describe('settingsFromRow', () => {
    it('maps row to UserSettings with nested macroGoals', () => {
      const row = {
        id: 's1',
        user_id: 'u1',
        daily_calorie_goal: 2500,
        protein_goal: 180,
        carbs_goal: 250,
        fat_goal: 70,
        dietary_preferences: ['vegetarian'],
        allergies: ['nuts'],
        usda_api_key: 'key123',
        created_at: '',
        updated_at: '',
      };
      const settings = settingsFromRow(row as never);
      expect(settings.id).toBe('s1');
      expect(settings.dailyCalorieGoal).toBe(2500);
      expect(settings.macroGoals).toEqual({ protein: 180, carbs: 250, fat: 70 });
      expect(settings.dietaryPreferences).toEqual(['vegetarian']);
      expect(settings.allergies).toEqual(['nuts']);
      expect(settings.theme).toBe('system'); // always set to 'system' by mapper
    });
  });

  describe('settingsToUpdate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('always includes updated_at', () => {
      const row = settingsToUpdate({});
      expect(row.updated_at).toBe('2025-06-01T12:00:00.000Z');
    });

    it('maps macroGoals to separate columns', () => {
      const row = settingsToUpdate({ macroGoals: { protein: 200, carbs: 300, fat: 80 } });
      expect(row.protein_goal).toBe(200);
      expect(row.carbs_goal).toBe(300);
      expect(row.fat_goal).toBe(80);
    });

    it('does not include theme in DB update (theme is localStorage only)', () => {
      const row = settingsToUpdate({ theme: 'dark' });
      expect(row).not.toHaveProperty('theme');
    });

    it('maps dailyCalorieGoal', () => {
      const row = settingsToUpdate({ dailyCalorieGoal: 1800 });
      expect(row.daily_calorie_goal).toBe(1800);
    });
  });
});
