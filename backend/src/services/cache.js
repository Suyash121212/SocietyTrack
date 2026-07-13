/**
 * cache.js — Redis-backed cache for expensive read-only queries.
 *
 * Why Redis over in-memory (node-cache / plain Map)?
 *   - Survives process restarts — in-memory caches cold-start on every deploy.
 *   - Works correctly across multiple server instances (horizontal scaling).
 *   - We already have a Redis connection for BullMQ, so this costs nothing extra.
 *   - Cache invalidation on mutation is reliable because all instances share
 *     the same store.
 *
 * All dashboard aggregation queries (GROUP BY, raw SQL) are cached here.
 * TTL: 60 seconds — numbers can be 1 minute stale on a quiet system.
 * Mutation handlers (updateStatus, updatePriority, setOverdue) call
 * invalidateDashboardCache() so the cache is busted immediately after
 * any admin action, giving fresh numbers on the next dashboard load.
 */
import { createRedisConnection } from '../queues/redis.js';

// Dedicated connection for cache reads/writes.
// Separate from BullMQ connections — they use blocking commands; this uses GET/SET.
const cacheClient = createRedisConnection();

cacheClient.on('error', (err) => {
  // Log but never crash — if Redis is unavailable, cache misses gracefully
  // and the controllers fall through to the database.
  console.error('[Cache] Redis error:', err.message);
});

const DEFAULT_TTL = 60; // seconds

// Namespace prefix keeps dashboard keys isolated from BullMQ's key space
const NS = 'dashboard:';

export const CACHE_KEYS = {
  OVERVIEW:            `${NS}overview`,
  WEEKLY_TREND:        `${NS}weekly_trend`,
  RECURRING_ISSUES:    `${NS}recurring_issues`,
  RESOLUTION_CATEGORY: `${NS}resolution_by_category`,
};

// All dashboard keys — used for bulk invalidation on mutations
const ALL_DASHBOARD_KEYS = Object.values(CACHE_KEYS);

/**
 * Get a cached value. Returns the parsed object or null on miss/error.
 */
export const cacheGet = async (key) => {
  try {
    const raw = await cacheClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(`[Cache] GET ${key} failed:`, err.message);
    return null;
  }
};

/**
 * Set a cached value with an optional TTL (default 60s).
 * Fire-and-forget — a failed SET doesn't break the response.
 */
export const cacheSet = (key, value, ttl = DEFAULT_TTL) => {
  cacheClient.set(key, JSON.stringify(value), 'EX', ttl).catch((err) => {
    console.error(`[Cache] SET ${key} failed:`, err.message);
  });
};

/**
 * Delete all dashboard cache keys.
 * Called after any mutation that changes complaint counts or status.
 * DEL is O(n) on the key count — with 4 keys this is negligible.
 */
export const invalidateDashboardCache = () => {
  cacheClient.del(...ALL_DASHBOARD_KEYS).catch((err) => {
    console.error('[Cache] Invalidation failed:', err.message);
  });
};

/**
 * Convenience wrapper: try cache first, fall through to loader on miss,
 * then populate cache and return result.
 *
 * @param {string}   key     - Cache key
 * @param {Function} loader  - Async function that queries the database
 * @param {number}   [ttl]   - TTL in seconds (default 60)
 */
export const withCache = async (key, loader, ttl = DEFAULT_TTL) => {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  cacheSet(key, fresh, ttl);
  return fresh;
};
