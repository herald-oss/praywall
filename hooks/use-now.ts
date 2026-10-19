"use client";

import { useSyncExternalStore } from "react";

// A shared clock that ticks once a minute for every component that needs
// "now" (relative times). Returns 0 during SSR and hydration, so server and
// client render the same markup and the real time fills in right after.

let current = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = Date.now(); // the clock may have been idle for a while
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (!current) current = Date.now();
  return current;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

/** true on the client after hydration, false during SSR. */
const noopSubscribe = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
