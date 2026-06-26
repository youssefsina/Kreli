"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser } from "@/lib/api";
import { saveAuth, clearAuth, getStoredUser, getToken } from "@/lib/auth";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setIsLoading(false);
  }, []);

  function login(tok: string, u: AuthUser, rememberMe = true) {
    saveAuth(tok, u, rememberMe);
    setToken(tok);
    setUser(u);
  }

  function logout() {
    clearAuth();
    setToken(null);
    setUser(null);
  }

  function updateUser(u: AuthUser) {
    saveAuth(token ?? "", u);
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
