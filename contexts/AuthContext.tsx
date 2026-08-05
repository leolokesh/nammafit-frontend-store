"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nf_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await authApi.login(username, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("nf_user", JSON.stringify(data.user));
      setUser(data.user);
      router.push("/ai-dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("nf_user");
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, setUser }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
