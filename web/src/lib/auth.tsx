import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  /** true until the stored session (or a ?code= in the URL) has been resolved */
  loading: boolean;
  /** set when the user arrived through a password-reset link */
  recovering: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, loading: true, recovering: false });

export function AuthProvider({ children, onSignOut }: { children: ReactNode; onSignOut?: () => void }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, recovering: false });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState((s) => ({ ...s, session: data.session, loading: false })));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        loading: false,
        recovering: event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : s.recovering,
      }));
      if (event === "SIGNED_OUT") onSignOut?.();
    });
    return () => data.subscription.unsubscribe();
  }, [onSignOut]);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);
