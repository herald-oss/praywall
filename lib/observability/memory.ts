// Node-only: periodic memory logging to compare with Railway's metric.
// Loaded from instrumentation.ts only in the Node.js runtime.
export function startMemoryLogging(): void {
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
