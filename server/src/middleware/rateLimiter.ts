import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Interface for rate limiter options
 */
interface RateLimitOptions {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Maximum number of requests per window
  message?: string;    // Custom error message
  keyGenerator?: (req: Request) => string; // Function to generate a key for identifying clients
}

/**
 * Default rate limiter options
 */
const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: 'Too many requests, please try again later.'
};

/**
 * Create a rate limiter middleware
 * 
 * @param options Configuration options
 * @returns Express middleware function
 */
export const rateLimit = (options: Partial<RateLimitOptions> = {}) => {
  // Merge default options with provided options
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a rate limiter instance
  const limiter = new RateLimiterMemory({
    points: config.max,
    duration: config.windowMs / 1000,
  });
  
  // Default key generator uses IP address
  const getKey = config.keyGenerator || ((req: Request) => {
    return req.ip || 
      (req.headers['x-forwarded-for'] as string) || 
      req.socket.remoteAddress || 
      'unknown';
  });
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get client identifier
      const key = getKey(req);
      
      // Check rate limit
      await limiter.consume(key);
      
      // If not rate limited, proceed to next middleware
      next();
    } catch (error) {
      // If rate limited, send error response
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: config.message,
        retryAfter: Math.ceil((error as any).msBeforeNext / 1000) || 60
      });
    }
  };
};

/**
 * Different rate limiter presets for various API types
 */
export const rateLimiters = {
  // Standard API rate limit
  standard: rateLimit(),
  
  // More permissive limit for public endpoints
  public: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests to public API'
  }),
  
  // Stricter limit for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts'
  }),
  
  // Very strict limit for sensitive operations
  sensitive: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many sensitive operations'
  })
};

export default {
  rateLimit,
  rateLimiters
}; 