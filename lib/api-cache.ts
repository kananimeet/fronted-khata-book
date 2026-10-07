/**
 * High-performance In-Memory Request Cache & Deduplication Layer for API calls.
 * 
 * Features:
 * 1. Request Deduplication: Merges concurrent identical in-flight GET requests into a single promise.
 * 2. TTL Caching: Stores successful GET results in memory for instantaneous (0ms) repeat access.
 * 3. Smart Invalidation: Clears specific cache tags upon POST, PATCH, PUT, or DELETE mutations.
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Retrieves cached response if present and not expired.
 */
export function getCachedData<T = unknown>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Stores data in memory cache with specified time-to-live (default 20 seconds).
 */
export function setCachedData<T = unknown>(key: string, data: T, ttlMs = 20000): void {
  if (data === undefined || data === null) return;
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Invalidates cache keys matching a pattern or clears all cache if no pattern is given.
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of Array.from(memoryCache.keys())) {
    const matches =
      typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);
    if (matches) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clears all in-memory API caches, invalidates localStorage snapshot keys,
 * and broadcasts an event so active views re-fetch fresh live data immediately.
 */
export function clearMutationCaches(): void {
  invalidateCache();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("khatabook_dashboard_cache");
      localStorage.removeItem("khatabook_room_expenses_cache");
      localStorage.removeItem("khatabook_daily_expenses_cache");
      window.dispatchEvent(new Event("khatabook_data_updated"));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Fetches data with in-flight deduplication and TTL memory caching.
 */
export async function fetchWithDedupe<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 20000,
  forceRefresh = false
): Promise<T> {
  // If not forcing refresh, return valid memory cache immediately (0ms)
  if (!forceRefresh) {
    const cached = getCachedData<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Deduplicate concurrent in-flight requests for the exact same key
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (result !== undefined && result !== null) {
        setCachedData(key, result, ttlMs);
      }
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}
