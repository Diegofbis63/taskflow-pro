import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  check(request: NextRequest): RateLimitResult {
    const identifier = this.getIdentifier(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries
    this.cleanup(windowStart);

    // Get current request count
    const current = this.requests.get(identifier);

    if (!current) {
      // First request in window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if window has expired
    if (now > current.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit exceeded
    if (current.count >= this.config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime,
        error: this.config.message || `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
      };
    }

    // Increment count
    current.count++;
    this.requests.set(identifier, current);

    return {
      success: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = request.ip;

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    if (ip) {
      return ip;
    }

    // Fallback to user agent or random identifier
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `fallback-${userAgent}`;
  }

  private cleanup(windowStart: number): void {
    for (const [key, value] of this.requests.entries()) {
      if (windowStart > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  // Reset rate limit for a specific identifier
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  // Get current status for an identifier
  getStatus(identifier: string): { count: number; remaining: number; resetTime: number } | null {
    const current = this.requests.get(identifier);
    if (!current) return null;

    return {
      count: current.count,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime
    };
  }
}

// Predefined rate limiters for different use cases
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
});

export const generalRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Rate limit exceeded. Please slow down your requests.'
});

export const apiRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: 'API rate limit exceeded. Please try again later.'
});

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
  message: 'Upload limit exceeded. Please try again later.'
});

// Middleware function to apply rate limiting
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: NextRequest) => {
    const result = limiter.check(request);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        headers: {
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      };
    }

    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      }
    };
  };
}

// Export the RateLimiter class for custom usage
export { RateLimiter };

// Backward compatibility
export { createRateLimitMiddleware as rateLimitMiddleware };