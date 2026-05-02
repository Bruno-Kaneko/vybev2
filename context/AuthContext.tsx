import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { ensureProfile, updateLastSeen } from '@/lib/db';

async function clearStaleTokens() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(k => k.includes('supabase') || k.includes('sb-'));
    if (authKeys.length) await AsyncStorage.multiRemove(authKeys);
  } catch {}
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        clearStaleTokens();
        supabase.auth.signOut().catch(() => {});
        setSession(null);
      } else {
        setSession(session);
      }
      setLoading(false);
    }).catch(() => {
      clearStaleTokens();
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession(session);
        if (session?.user) {
          ensureProfile(
            session.user.id,
            session.user.email ?? '',
            session.user.user_metadata?.username
          ).catch(() => {});
          updateLastSeen(session.user.id).catch(() => {});
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
