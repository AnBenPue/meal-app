import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockInvoke } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    functions: { invoke: mockInvoke },
  },
}));

import { extractNutrition, nutritionFromSearchResult, searchFoods, getFoodDetails } from '@/lib/api';

describe('extractNutrition', () => {
  it('extracts nutrition by nutrientId', () => {
    const nutrients = [
      { nutrientId: 1008, amount: 255 },
      { nutrientId: 1003, amount: 26.1 },
      { nutrientId: 1005, amount: 0 },
      { nutrientId: 1004, amount: 15.7 },
    ];
    const result = extractNutrition(nutrients);
    expect(result).toEqual({ calories: 255, protein: 26.1, carbs: 0, fat: 15.7 });
  });

  it('falls back to number field when nutrientId is missing', () => {
    const nutrients = [
      { number: '1008', amount: 100 },
      { number: '1003', amount: 8.5 },
      { number: '1005', amount: 12.3 },
      { number: '1004', amount: 3.2 },
    ];
    const result = extractNutrition(nutrients);
    expect(result).toEqual({ calories: 100, protein: 8.5, carbs: 12.3, fat: 3.2 });
  });

  it('falls back to value field when amount is missing', () => {
    const nutrients = [
      { nutrientId: 1008, value: 200 },
      { nutrientId: 1003, value: 10 },
      { nutrientId: 1005, value: 25 },
      { nutrientId: 1004, value: 5 },
    ];
    const result = extractNutrition(nutrients);
    expect(result).toEqual({ calories: 200, protein: 10, carbs: 25, fat: 5 });
  });

  it('returns zeros for missing nutrients', () => {
    const result = extractNutrition([]);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('rounds values appropriately', () => {
    const nutrients = [
      { nutrientId: 1008, amount: 255.7 },
      { nutrientId: 1003, amount: 26.15 },
      { nutrientId: 1005, amount: 12.34 },
      { nutrientId: 1004, amount: 3.99 },
    ];
    const result = extractNutrition(nutrients);
    expect(result.calories).toBe(256);
    expect(result.protein).toBe(26.2);
    expect(result.carbs).toBe(12.3);
    expect(result.fat).toBe(4);
  });
});

describe('nutritionFromSearchResult', () => {
  it('extracts nutrition from search result foodNutrients', () => {
    const food = {
      fdcId: 12345,
      description: 'Chicken breast',
      foodNutrients: [
        { nutrientId: 1008, nutrientName: 'Energy', value: 165, unitName: 'KCAL' },
        { nutrientId: 1003, nutrientName: 'Protein', value: 31, unitName: 'G' },
        { nutrientId: 1005, nutrientName: 'Carbs', value: 0, unitName: 'G' },
        { nutrientId: 1004, nutrientName: 'Fat', value: 3.6, unitName: 'G' },
      ],
    };
    const result = nutritionFromSearchResult(food);
    expect(result).toEqual({ calories: 165, protein: 31, carbs: 0, fat: 3.6 });
  });

  it('returns zeros for empty foodNutrients', () => {
    const food = {
      fdcId: 0,
      description: 'Unknown',
      foodNutrients: [],
    };
    const result = nutritionFromSearchResult(food);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('searchFoods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
  });

  it('calls usda-proxy with search action and returns data', async () => {
    const mockResponse = { foods: [], totalHits: 0, currentPage: 1, totalPages: 0 };
    mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

    const result = await searchFoods('chicken');
    expect(mockInvoke).toHaveBeenCalledWith('usda-proxy', {
      body: { action: 'search', query: 'chicken', pageNumber: 1, pageSize: 20 },
    });
    expect(result).toEqual(mockResponse);
  });

  it('passes custom page params', async () => {
    mockInvoke.mockResolvedValue({ data: { foods: [] }, error: null });

    await searchFoods('rice', undefined, 3, 10);
    expect(mockInvoke).toHaveBeenCalledWith('usda-proxy', {
      body: { action: 'search', query: 'rice', pageNumber: 3, pageSize: 10 },
    });
  });

  it('throws when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(searchFoods('test')).rejects.toThrow('Not authenticated');
  });

  it('throws on proxy error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Rate limited' },
    });

    await expect(searchFoods('test')).rejects.toThrow('Rate limited');
  });
});

describe('getFoodDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
  });

  it('calls usda-proxy with details action and returns parsed result', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        description: 'Chicken breast',
        foodNutrients: [
          { nutrientId: 1008, amount: 165 },
          { nutrientId: 1003, amount: 31 },
          { nutrientId: 1005, amount: 0 },
          { nutrientId: 1004, amount: 3.6 },
        ],
      },
      error: null,
    });

    const result = await getFoodDetails(12345);
    expect(result.description).toBe('Chicken breast');
    expect(result.nutrition).toEqual({ calories: 165, protein: 31, carbs: 0, fat: 3.6 });
    expect(mockInvoke).toHaveBeenCalledWith('usda-proxy', {
      body: { action: 'details', fdcId: 12345, nutrients: '1008,1003,1004,1005' },
    });
  });

  it('handles missing foodNutrients gracefully', async () => {
    mockInvoke.mockResolvedValue({
      data: { description: 'Unknown food' },
      error: null,
    });

    const result = await getFoodDetails(99999);
    expect(result.nutrition).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
