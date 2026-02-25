/**
 * Simple in-memory cache for hot, infrequently-changing data.
 * Avoids hammering Neon DB with duplicate queries across requests.
 *
 * TTL-based: entries expire automatically after `ttlMs` milliseconds.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry<unknown>>();

    /**
     * Get a cached value or compute it fresh.
     * @param key   - Unique cache key
     * @param fn    - Async function to compute the value if not cached
     * @param ttlMs - Time-to-live in milliseconds (default 60s)
     */
    async get<T>(key: string, fn: () => Promise<T>, ttlMs = 60_000): Promise<T> {
        const entry = this.store.get(key) as CacheEntry<T> | undefined;

        if (entry && Date.now() < entry.expiresAt) {
            return entry.value;
        }

        const value = await fn();
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
    }

    /** Invalidate a specific key (e.g., after a write). */
    invalidate(key: string): void {
        this.store.delete(key);
    }

    /** Invalidate all keys matching a prefix. */
    invalidatePrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
}

// Singleton — survives across hot-reloads in Next.js dev mode
const globalForCache = globalThis as unknown as { appCache?: MemoryCache };
export const cache = globalForCache.appCache ?? new MemoryCache();
if (process.env.NODE_ENV !== "production") globalForCache.appCache = cache;
