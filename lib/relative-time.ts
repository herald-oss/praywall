/** "ahora", "hace 5 min", "hace 3 h", "hace 2 días" — or a date after 30 days. */
export function formatRelativeTime(date: Date, now: number, locale: string): string {
  const diffSec = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86_400 * 30) return rtf.format(Math.round(diffSec / 86_400), "day");
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
