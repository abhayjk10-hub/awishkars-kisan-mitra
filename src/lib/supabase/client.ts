import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

const hasValidSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      /^https?:\/\//i.test(url) &&
    !url.includes('example.supabase.co') &&
      !url.includes('your_supabase_project_url_here') &&
      key &&
      key.length > 20 &&
    !key.includes('demo-anon-key-placeholder') &&
      !key.includes('your_supabase_anon_key_here')
  );
};

function createFallbackClient(): SupabaseBrowserClient {
  return {
    auth: {
      getSession: async () => {
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('km_user_session');
            if (raw) {
              const user = JSON.parse(raw) as User;
              return { data: { session: { user } as unknown as Session }, error: null };
            }
          }
        } catch {}
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        if (typeof window === 'undefined') {
          return { data: { subscription: { unsubscribe: () => undefined } }, error: null };
        }
        const handler = () => {
          try {
            const raw = localStorage.getItem('km_user_session');
            const user = raw ? JSON.parse(raw) as User : null;
            const session = user ? { user } as unknown as Session : null;
            callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
          } catch {}
        };
        window.addEventListener('km_auth_change', handler);
        return {
          data: {
            subscription: {
              unsubscribe: () => window.removeEventListener('km_auth_change', handler),
            },
          },
          error: null,
        };
      },
      signUp: async ({
        phone,
        email,
        password,
        options,
      }: {
        phone?: string;
        email?: string;
        password?: string;
        options?: { data?: { full_name?: string } };
      }) => {
        const fullName = options?.data?.full_name || 'Farmer';
        const identifier = (phone || email || 'farmer').trim();
        const mockUser = {
          id: 'farmer-' + identifier.replace(/\D/g, '').slice(-10) || 'demo',
          phone: phone || null,
          email: email || null,
          user_metadata: { full_name: fullName },
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`km_reg_${identifier}`, JSON.stringify({ fullName, password }));
          }
        } catch {}
        return { data: { user: mockUser as unknown as User, session: null }, error: null };
      },
      signInWithOtp: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase Phone Auth is not configured. Add your real Supabase URL and anon key to .env.local.'),
      }),
      verifyOtp: async () => ({
        data: {
          user: null,
          session: null,
        },
        error: new Error('Supabase Phone Auth is not configured. Add your real Supabase URL and anon key to .env.local.'),
      }),
      signInWithPassword: async ({ phone, email, password }: { phone?: string; email?: string; password?: string }) => {
        if (!password || password.length < 6) {
          return { data: { user: null, session: null }, error: new Error('Password must be at least 6 characters.') };
        }
        const identifier = (phone || email || '+919876543210').trim();
        let storedName = 'Registered Farmer';
        try {
          if (typeof window !== 'undefined') {
            const registered = localStorage.getItem(`km_reg_${identifier}`);
            if (registered) {
              const parsed = JSON.parse(registered);
              if (parsed.fullName) storedName = parsed.fullName;
              if (parsed.password && parsed.password !== password) {
                return { data: { user: null, session: null }, error: new Error('Incorrect password. Please verify or reset.') };
              }
            }
          }
        } catch {}
        const mockUser = {
          id: 'farmer-' + identifier.replace(/\D/g, '').slice(-10) || 'demo',
          phone: phone || (!identifier.includes('@') ? identifier : null),
          email: email || (identifier.includes('@') ? identifier : null),
          user_metadata: { full_name: storedName },
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('km_user_session', JSON.stringify(mockUser));
            window.dispatchEvent(new Event('km_auth_change'));
          }
        } catch {}
        return {
          data: {
            user: mockUser as unknown as User,
            session: { user: mockUser, access_token: 'mock-session-token' } as unknown as Session,
          },
          error: null,
        };
      },
      updateUser: async () => ({
        data: { user: { id: 'demo-farmer' } as unknown as User },
        error: null,
      }),
      signOut: async () => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('km_user_session');
            window.dispatchEvent(new Event('km_auth_change'));
          }
        } catch {}
        return { error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
    }),
  } as unknown as SupabaseBrowserClient;
}

export function createClient() {
  if (!hasValidSupabaseConfig()) {
    return createFallbackClient();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
