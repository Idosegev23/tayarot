/**
 * Rate Limiter
 * 
 * Protects AI API endpoints from abuse by limiting requests per IP/user.
 * Uses Upstash Redis when available, falls back to in-memory store for development.
 */

import { isRateLimitingEnabled } from './env';

// Rate limit configurations for different services
export const RATE_LIMITS = {
  openai: {
    maxRequests: 10, // requests
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many chat requests. Please wait a moment before trying again.',
  },
  gemini: {
    maxRequests: 5, // requests (more expensive)
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many image generation requests. Please wait a moment before trying again.',
  },
  upload: {
    maxRequests: 20, // requests
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many upload requests. Please slow down.',
  },
} as const;

export type RateLimitService = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

// In-memory store for development/fallback
class InMemoryStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Clean up expired entries
    if (Date.now() > data.resetAt) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, count: number, resetAt: number): Promise<void> {
    this.store.set(key, { count, resetAt });
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const existing = await this.get(key);
    const now = Date.now();
    
    if (!existing || now > existing.resetAt) {
      const resetAt = now + windowMs;
      await this.set(key, 1, resetAt);
      return 1;
    }
    
    const newCount = existing.count + 1;
    await this.set(key, newCount, existing.resetAt);
    return newCount;
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton in-memory store
const memoryStore = new InMemoryStore();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => memoryStore.cleanup(), 5 * 60 * 1000);
}

/**
 * Upstash Redis client (lazy loaded)
 */
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  
  if (!isRateLimitingEnabled()) return null;
  
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return redisClient;
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Check rate limit using Redis or in-memory store
 */
export async function checkRateLimit(
  identifier: string,
  service: RateLimitService
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[service];
  const key = `ratelimit:${service}:${identifier}`;
  const now = Date.now();
  const resetAt = new Date(now + config.windowMs);

  try {
    const redis = await getRedisClient();
    
    if (redis) {
      // Use Redis for distributed rate limiting
      const count = await redis.incr(key);
      
      // Set TTL on first request
      if (count === 1) {
        await redis.pexpire(key, config.windowMs);
      }
      
      const allowed = count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count);
      
      return {
        allowed,
        remaining,
        resetAt,
        error: allowed ? undefined : config.message,
      };
    } else {
      // Fallback to in-memory store
      const count = await memoryStore.increment(key, config.windowMs);
      const allowed = count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count);
      
      return {
        allowed,
        remaining,
        resetAt,
        error: allowed ? undefined : config.message,
      };
    }
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt,
    };
  }
}

/**
 * Get identifier from request headers
 * Uses IP address or a fallback
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP from various headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  
  // Fallback to a generic identifier
  return 'unknown-client';
}

/**
 * Log rate limit hit to Supabase (async, fire-and-forget)
 */
export async function logRateLimitHit(
  identifier: string,
  service: RateLimitService,
  allowed: boolean
): Promise<void> {
  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();
    
    await supabase.from('rate_limit_logs').insert({
      service,
      identifier,
      allowed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.warn('Failed to log rate limit:', error);
  }
}

/**
 * Middleware wrapper for server actions
 * Usage: const result = await withRateLimit('openai', headers, async () => { ... });
 */
export async function withRateLimit<T>(
  service: RateLimitService,
  headers: Headers,
  action: () => Promise<T>
): Promise<T> {
  if (!isRateLimitingEnabled()) {
    console.warn(`Rate limiting is disabled for ${service} - allowing request`);
    return action();
  }

  const identifier = getClientIdentifier(headers);
  const result = await checkRateLimit(identifier, service);
  
  // Log the hit (don't await)
  logRateLimitHit(identifier, service, result.allowed).catch(() => {});
  
  if (!result.allowed) {
    throw new Error(result.error || 'Rate limit exceeded');
  }
  
  return action();
}
