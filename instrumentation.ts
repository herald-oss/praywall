// Opt-in memory logging to compare Railway's metric with what Node itself
// reports. Enable with LOG_MEMORY=1 (interval: LOG_MEMORY_INTERVAL_MS,
// default 5 minutes). Off by default: no work, no timers.
//
// The Node-only code is imported dynamically inside the runtime check, as
// Next.js recommends, so it never ends up in an Edge bundle.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.LOG_MEMORY === "1") {
    const { startMemoryLogging } = await import("./lib/observability/memory");
    startMemoryLogging();
  }
}
