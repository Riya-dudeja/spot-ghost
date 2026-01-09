// Simple, OWASP-friendly rate limiter to keep noisy clients in check.
// Tracks requests per IP and (optionally) per user over a sliding time window.
// Production tip: swap this in-memory store for Redis (or similar) so it works across instances.

const buckets = new Map();

function now() {
  return Date.now();
}

/**
 * Best-effort client IP extraction.
 * - Looks at common reverse-proxy headers (X-Forwarded-For, X-Real-IP).
 * - Falls back to a shared 'unknown-ip' bucket if headers are missing.
 */
function getClientIp(req) {
  try {
    const xfwd = req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('X-Forwarded-For');
    if (xfwd) {
      return xfwd.split(',')[0].trim();
    }
    const xreal = req.headers?.get?.('x-real-ip') || req.headers?.get?.('X-Real-IP');
    if (xreal) return xreal.trim();
  } catch {}
  return 'unknown-ip';
}

/**
 * Drop timestamps outside the sliding window to keep buckets lean.
 */
function pruneOldTimestamps(arr, windowMs) {
  const cutoff = now() - windowMs;
  while (arr.length > 0 && arr[0] < cutoff) {
    arr.shift();
  }
}

/**
 * Record a request for the given bucket and return the current count
 * (after pruning), scoped to the provided window.
 */
function touch(bucketKey, windowMs) {
  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = [];
    buckets.set(bucketKey, bucket);
  }
  pruneOldTimestamps(bucket, windowMs);
  bucket.push(now());
  return bucket.length;
}

/**
 * Enforce per-IP and optional per-user limits for a logical scope.
 * Returns `{ allowed: true }` when under the limit; otherwise a ready-to-send 429 Response.
 * We include `Retry-After` so well-behaved clients can back off.
 * Note: This is in-memory. For multi-instance deployments, use Redis or a shared store.
 */
export async function enforceRateLimit(req, options = {}) {
  const {
    scope = 'default',
    windowMs = 15 * 60 * 1000, // 15 minutes
    ipMax = 100,              // sensible default for public endpoints
    userMax = 300,            // higher default when authenticated
    userId = null,
  } = options;

  const ip = getClientIp(req);

  // Count against the IP bucket first
  const ipBucketKey = `rl:${scope}:ip:${ip}`;
  const ipCount = touch(ipBucketKey, windowMs);
  if (ipCount > ipMax) {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please retry later.',
          scope,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
          },
        }
      ),
    };
  }

  // Then count against the user bucket (if we know the user)
  if (userId) {
    const userBucketKey = `rl:${scope}:user:${userId}`;
    const userCount = touch(userBucketKey, windowMs);
    if (userCount > userMax) {
      const retryAfterSeconds = Math.ceil(windowMs / 1000);
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Per-user rate limit exceeded. Please retry later.',
            scope,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfterSeconds),
            },
          }
        ),
      };
    }
  }

  return { allowed: true };
}

/**
 * Sensible presets for common endpoint families.
 * Tweak these per your traffic profile; they aim to stop abuse without
 * frustrating normal users.
 */
export const RateLimitPresets = {
  // Auth endpoints: protect against credential stuffing
  authLogin: { scope: 'auth-login', windowMs: 60 * 1000, ipMax: 10, userMax: 30 },
  authSignup: { scope: 'auth-signup', windowMs: 60 * 1000, ipMax: 5, userMax: 20 },
  // Content submission/reporting
  reportScam: { scope: 'report-scam', windowMs: 10 * 60 * 1000, ipMax: 20, userMax: 50 },
  // Job analysis (can be heavier)
  analyzeJob: { scope: 'analyze-job', windowMs: 15 * 60 * 1000, ipMax: 60, userMax: 150 },
  // Authenticated resource fetch
  myReports: { scope: 'my-reports', windowMs: 15 * 60 * 1000, ipMax: 100, userMax: 200 },
  profile: { scope: 'profile', windowMs: 15 * 60 * 1000, ipMax: 100, userMax: 200 },
  reportCreate: { scope: 'report-create', windowMs: 15 * 60 * 1000, ipMax: 80, userMax: 100 },
  extensionPost: { scope: 'extension-post', windowMs: 10 * 60 * 1000, ipMax: 60, userMax: 150 },
};
