import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
  },
}));

import { requireAuth } from '@/lib/auth';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user ID when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const userId = await requireAuth();
    expect(userId).toBe('user-123');
  });

  it('throws when user is null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(requireAuth()).rejects.toThrow('Not authenticated');
  });

  it('throws when there is an auth error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    });

    await expect(requireAuth()).rejects.toThrow('Not authenticated');
  });
});
