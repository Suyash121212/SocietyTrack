import Redis from 'ioredis';

/**
 * BullMQ requires separate IORedis connections for the Queue (producer)
 * and the Worker (consumer) — they each call BLPOP/BRPOP internally and
 * a single connection can't serve both roles simultaneously.
 *
 * We export a factory so each caller gets its own isolated connection.
 *
 * Upstash-specific notes:
 *   - Upstash URLs use the rediss:// scheme (TLS required).
 *   - ioredis doesn't auto-enable TLS from the URL scheme alone when
 *     options are passed — we detect it and set tls: {} explicitly.
 *   - maxRetriesPerRequest = null is required by BullMQ.
 *   - enableReadyCheck = false avoids a spurious ready-check timeout
 *     on Upstash's serverless cold-start path.
 */
export const createRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const isTls = url.startsWith('rediss://');

  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
    // Upstash requires TLS; passing an empty object enables it without
    // enforcing a specific cert — correct for managed Redis providers.
    ...(isTls ? { tls: {} } : {}),
  });
};
