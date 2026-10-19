let counter = 0;

/** A distinct client IP per call, so rate-limit buckets never collide between tests. */
export function uniqueIp(): string {
  counter += 1;
  const n = (Date.now() % 50_000) + counter;
  return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
}
