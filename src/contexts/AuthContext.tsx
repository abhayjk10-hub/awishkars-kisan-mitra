'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { type AuthChangeEvent, type Session, type User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const syncUser = useCallback(async () => {
    try {
      // 1. Check Supabase active session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        return;
      }
    } catch {}

    // 2. Fallback to local user session
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('km_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.id || parsed.phone || parsed.email)) {
            setUser(parsed as User);
            setLoading(false);
            return;
          }
        }
      }
    } catch {}

    setUser(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Hydrate the auth state from Supabase and browser storage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncUser();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
        } else {
          syncUser();
        }
      }
    );

    // Listen to custom km_auth_change and standard cross-tab storage events
    const handleAuthEvent = () => {
      syncUser();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('km_auth_change', handleAuthEvent);
      window.addEventListener('storage', handleAuthEvent);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('km_auth_change', handleAuthEvent);
        window.removeEventListener('storage', handleAuthEvent);
      }
    };
  }, [supabase, syncUser]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('km_user_session');
        window.dispatchEvent(new Event('km_auth_change'));
      }
    } catch {}

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser: syncUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
