interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists or window has expired, create a new one
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetIn: config.windowMs,
    };
  }

  // Increment count and check if limit exceeded
  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  const resetIn = entry.resetTime - now;

  if (entry.count > config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    };
  }

  return {
    allowed: true,
    remaining,
    resetIn,
  };
}

export function getClientIp(request: Request): string {
  // Check common proxy headers in order of preference
  const headers = request.headers;
  
  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  
  // Standard proxy header
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  
  // Vercel
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  
  return "unknown";
}

// per min:
export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 60 * 1000 },
  token: { limit: 5, windowMs: 60 * 1000 },
  api: { limit: 100, windowMs: 60 * 1000 },
} as const;
