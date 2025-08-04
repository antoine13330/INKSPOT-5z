interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up expired entries
  Object.keys(store).forEach((k) => {
    if (store[k].resetTime < now) {
      delete store[k];
    }
  });

  const current = store[key];
  const resetTime = now + windowMs;

  if (!current || current.resetTime < now) {
    store[key] = { count: 1, resetTime };
    return { success: true, remaining: limit - 1, resetTime };
  }

  if (current.count >= limit) {
    return { success: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return { success: true, remaining: limit - current.count, resetTime: current.resetTime };
} 