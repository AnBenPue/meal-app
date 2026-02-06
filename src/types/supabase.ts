export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          ingredients: Json;
          instructions: Json;
          prep_time: number;
          cook_time: number;
          servings: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          category: string;
          ingredients: Json;
          instructions: Json;
          prep_time: number;
          cook_time: number;
          servings: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          ingredients?: Json;
          instructions?: Json;
          prep_time?: number;
          cook_time?: number;
          servings?: number;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meals: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          meals: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          meals?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      food_log_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          time: string;
          meal_type: string;
          foods: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          time: string;
          meal_type: string;
          foods: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          time?: string;
          meal_type?: string;
          foods?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          daily_calorie_goal: number;
          protein_goal: number;
          carbs_goal: number;
          fat_goal: number;
          dietary_preferences: Json;
          allergies: Json;
          usda_api_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          daily_calorie_goal?: number;
          protein_goal?: number;
          carbs_goal?: number;
          fat_goal?: number;
          dietary_preferences?: Json;
          allergies?: Json;
          usda_api_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_calorie_goal?: number;
          protein_goal?: number;
          carbs_goal?: number;
          fat_goal?: number;
          dietary_preferences?: Json;
          allergies?: Json;
          usda_api_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
