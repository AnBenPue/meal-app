import { vi } from 'vitest';

interface QueryResult {
  data: unknown;
  error: unknown;
}

/**
 * Creates a chainable mock that resolves to { data, error } for any chain depth.
 * Supports: select, eq, in, order, limit, single, insert, update, upsert, delete
 */
export function createQueryMock(result: QueryResult) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        // Make it thenable — resolve to result
        return (resolve: (v: QueryResult) => void) => resolve(result);
      }
      // Any chained method returns the same proxy
      return vi.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

/**
 * Creates a full mock Supabase client with auth, functions, and from().
 */
export function createMockSupabase() {
  const mock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token', user: { id: 'test-user-id' } } },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
  };
  return mock;
}
