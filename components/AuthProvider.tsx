"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = { user: User | null; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, loading: false });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Renders children only for signed-in users; sends everyone else to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted">Loading…</div>;
  }
  return <>{children}</>;
}
