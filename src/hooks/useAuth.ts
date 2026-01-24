/**
 * Auth Hook - Synchronize NextAuth session with Zustand store
 * Provides unified auth state management across the app
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store";

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, setUser, setLoading, logout } = useAuthStore();

  // Sync NextAuth session with Zustand store
  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser({
        id: (session.user as any).id,
        email: session.user.email || "",
        name: session.user.name || "",
        role: (session.user as any).role || "CASHIER",
      });
    } else {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: status === "loading",
    logout,
  };
}
