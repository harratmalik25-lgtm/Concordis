type BackoffConfig = {
  maxRetries:   number;
  baseDelayMs:  number;
  maxDelayMs:   number;
  jitterFactor: number;
};

const DEFAULT: BackoffConfig = {
  maxRetries:   3,
  baseDelayMs:  1000,
  maxDelayMs:   30000,
  jitterFactor: 0.25,
};

/**
 * Executes fn with exponential backoff on failure.
 * @param fn    Async function to retry
 * @param cfg   Backoff configuration (defaults apply)
 * @returns     Result of fn on success
 * @throws      Last error after all retries exhausted
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  cfg: Partial<BackoffConfig> = {},
): Promise<T> {
  const c = { ...DEFAULT, ...cfg };
  let lastErr: unknown;

  for (let attempt = 0; attempt <= c.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === c.maxRetries) break;

      const base  = c.baseDelayMs * Math.pow(2, attempt);
      const jitter = base * c.jitterFactor * (Math.random() * 2 - 1);
      const delay  = Math.min(base + jitter, c.maxDelayMs);

      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastErr;
}
