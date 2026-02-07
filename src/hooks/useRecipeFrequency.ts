import { useMemo } from 'react';
import type { MealPlan } from '@/types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

/**
 * Counts how often each recipe ID appears across all loaded plans.
 */
export function useRecipeFrequency(plans: Record<string, MealPlan>): Record<string, number> {
  return useMemo(() => {
    const freq: Record<string, number> = {};
    for (const plan of Object.values(plans)) {
      for (const mt of MEAL_TYPES) {
        for (const id of plan.meals[mt]) {
          freq[id] = (freq[id] ?? 0) + 1;
        }
      }
    }
    return freq;
  }, [plans]);
}
