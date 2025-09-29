import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  role: "admin" | "executive";
  name: string;
  email: string;
  avatar?: string | null;
};

const KEY = "ems_auth_v1"; // single-key store with role inside

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!r.ok) throw new Error("unauthorized");
        const u: AuthUser = await r.json();

        // If local storage has a different role, purge stale UI state
        const cached = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
        const prev = cached ? (JSON.parse(cached) as AuthUser) : null;
        if (prev && prev.role !== u.role) {
          localStorage.removeItem(KEY);
        }

        if (!cancelled) {
          setUser(u);
          localStorage.setItem(KEY, JSON.stringify(u));
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { 
    user, 
    loading, 
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin", 
    isExecutive: user?.role === "executive" 
  };
}
