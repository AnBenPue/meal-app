import Dexie, { type EntityTable } from 'dexie';
import type { Recipe, MealPlan, FoodLogEntry, UserSettings } from '@/types';

const db = new Dexie('MealAppDB') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>;
  mealPlans: EntityTable<MealPlan, 'id'>;
  foodLogs: EntityTable<FoodLogEntry, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
};

db.version(1).stores({
  recipes: 'id, name, category, createdAt',
  mealPlans: 'id, date',
  foodLogs: 'id, date, mealType',
  settings: 'id',
});

export { db };
