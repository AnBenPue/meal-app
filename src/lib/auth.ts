import { supabase } from '@/lib/supabase';

/**
 * Verify the user is authenticated and return their user ID.
 * Throws if not authenticated. Use as a guard at the top of store actions.
 */
export async function requireAuth(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}
