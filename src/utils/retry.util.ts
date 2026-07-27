export async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const timeout = options.timeout ?? 10_000;
  const interval = options.interval ?? 250;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const value = await fn();
    if (predicate(value)) return value;
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`pollUntil timed out after ${timeout}ms`);
}
