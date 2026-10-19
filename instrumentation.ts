// Opt-in memory logging to compare Railway's metric with what Node itself
// reports. Enable with LOG_MEMORY=1 (interval: LOG_MEMORY_INTERVAL_MS,
// default 5 minutes). Off by default: no work, no timers.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.LOG_MEMORY !== "1") return;

  const interval = Number(process.env.LOG_MEMORY_INTERVAL_MS) || 5 * 60_000;
  const mb = (n: number) => Math.round(n / 1024 / 1024);
  const log = () => {
    const m = process.memoryUsage();
    console.log(
      `[memory] rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB heapTotal=${mb(m.heapTotal)}MB external=${mb(m.external)}MB`
    );
  };
  log();
  setInterval(log, interval).unref();
}
