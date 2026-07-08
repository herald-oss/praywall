"use client";

import { useState, useEffect, useCallback } from "react";

type AuthUser = {
  id: string;
  username: string;
  name: string;
};

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
};

// Simple in-memory store so all hook instances share state
let globalUser: AuthUser | null = null;
let globalLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: globalUser,
    isLoggedIn: !!globalUser,
    isLoading: !globalLoaded,
  });

  useEffect(() => {
    const update = () => {
      setState({
        user: globalUser,
        isLoggedIn: !!globalUser,
        isLoading: false,
      });
    };
    listeners.add(update);

    // Fetch session on first mount
    if (!globalLoaded) {
      globalLoaded = true;
      fetch("/api/auth/session")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            globalUser = {
              id: data.user.id,
              username: data.user.username || "",
              name: data.user.name || "",
            };
          }
          notify();
        })
        .catch(() => notify());
    }

    return () => {
      listeners.delete(update);
    };
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, displayName: string) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign up");
      }

      const data = await res.json();
      globalUser = data.user;
      notify();
      return data;
    },
    []
  );

  const signIn = useCallback(
    async (username: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid credentials");
      }

      const data = await res.json();
      globalUser = data.user;
      notify();
      return data;
    },
    []
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    globalUser = null;
    notify();
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const res = await fetch("/api/auth/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || data?.error || "Failed to delete account");
    }

    globalUser = null;
    notify();
  }, []);

  return { ...state, signUp, signIn, signOut, deleteAccount };
}
