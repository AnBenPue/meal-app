import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '@/test/mocks/supabase';

const mockSupabase = createMockSupabase();
vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));

describe('authStore', () => {
  let useAuthStore: typeof import('@/stores/authStore').useAuthStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the module-level `initialized` flag by re-importing
    vi.resetModules();
    const mod = await import('@/stores/authStore');
    useAuthStore = mod.useAuthStore;
  });

  describe('initialize', () => {
    it('sets session and user from getSession', async () => {
      const mockSession = {
        access_token: 'tok',
        user: { id: 'u1', email: 'test@test.com' },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().session).toEqual(mockSession);
      expect(useAuthStore.getState().user).toEqual(mockSession.user);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('sets null user when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('is idempotent — second call is a no-op', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();
      await useAuthStore.getState().initialize();

      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('handles getSession error gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('subscribes to auth state changes', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('signInWithGoogle', () => {
    it('calls signInWithOAuth with google provider', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

      await useAuthStore.getState().signInWithGoogle();

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.any(String) },
      });
    });

    it('throws on OAuth error', async () => {
      const oauthError = new Error('OAuth failed');
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: null, error: oauthError });

      await expect(useAuthStore.getState().signInWithGoogle()).rejects.toThrow(oauthError);
    });
  });

  describe('signOut', () => {
    it('clears user and session', async () => {
      useAuthStore.setState({ user: { id: 'u1' } as never, session: { access_token: 'tok' } as never });
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await useAuthStore.getState().signOut();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
    });
  });
});
