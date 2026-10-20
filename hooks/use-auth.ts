"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiError, readErrorCode } from "@/lib/errors";

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

// Simple in-memory store so all hook instances share state.
// "Started" and "loaded" are separate: a component that mounts while the
// first session fetch is still in flight must keep waiting, not assume
// "loaded, nobody logged in" (that made the account page bounce to home).
let globalUser: AuthUser | null = null;
let fetchStarted = false;
let globalLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function setGlobalUser(user: AuthUser | null) {
  globalUser = user;
  globalLoaded = true;
  notify();
}

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

    // Fetch the session once, on the first mount anywhere in the app.
    if (!fetchStarted) {
      fetchStarted = true;
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
        })
        .catch(() => {})
        .finally(() => {
          globalLoaded = true;
          notify();
        });
    } else if (globalLoaded) {
      update();
    }

    return () => {
      listeners.delete(update);
    };
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, displayName: string) => {
      const res = await postJson("/api/auth/signup", { username, password, displayName });
      if (!res.ok) throw new ApiError(await readErrorCode(res));
      const data = await res.json();
      setGlobalUser(data.user);
      return data;
    },
    []
  );

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await postJson("/api/auth/login", { username, password });
    if (!res.ok) throw new ApiError(await readErrorCode(res));
    const data = await res.json();
    setGlobalUser(data.user);
    return data;
  }, []);

  // Only clears local state once the server confirms the session is gone —
  // otherwise the UI would say "signed out" while the cookie still works
  // (a real problem on shared devices).
  const signOut = useCallback(async () => {
    const res = await postJson("/api/auth/sign-out", {});
    if (!res.ok) throw new ApiError("sign_out_failed");
    setGlobalUser(null);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const res = await postJson("/api/auth/delete-user", { password });
    if (!res.ok) throw new ApiError(await readErrorCode(res));
    setGlobalUser(null);
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    if (!res.ok) throw new ApiError(await readErrorCode(res));
    const data = (await res.json()) as { user: { name: string } };
    if (globalUser) setGlobalUser({ ...globalUser, name: data.user.name });
  }, []);

  // Also signs out every other device, in case the old password leaked.
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await postJson("/api/auth/change-password", {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (!res.ok) throw new ApiError(await readErrorCode(res));
  }, []);

  return { ...state, signUp, signIn, signOut, deleteAccount, updateDisplayName, changePassword };
}
