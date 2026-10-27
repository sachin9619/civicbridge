"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import type { User, SupabaseClient } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient();
      } catch {
        setIsLoading(false);
        return null;
      }
    }
    return supabaseRef.current;
  };

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Construct resilient profile fallback from authenticated user metadata
        const u = currentUser || user;
        const fallback: Profile = {
          id: userId,
          email: u?.email || "",
          full_name: (u?.user_metadata?.full_name as string) || u?.email?.split("@")[0] || "Citizen User",
          role: (u?.user_metadata?.role as any) || "citizen",
          department_id: null,
          ward_id: null,
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallback);
      }
    } catch {
      // Gracefully retain current profile
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user);
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const getSession = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser);
        }
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
