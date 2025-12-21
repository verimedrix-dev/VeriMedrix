import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  HOUR: 3600, // 1 hour
} as const;

/**
 * Get cached data or fetch from database
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not cached
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_DURATIONS.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache (don't await - fire and forget)
    redis.set(key, data, { ex: ttl }).catch(console.error);

    return data;
  } catch (error) {
    // If Redis fails, just fetch from database
    console.error("Redis error:", error);
    return fetcher();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Failed to invalidate cache:", error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Failed to invalidate cache pattern:", error);
  }
}

// Cache key generators for consistency
export const cacheKeys = {
  // Admin analytics
  adminDashboard: () => "admin:dashboard",
  adminGrowth: () => "admin:growth",
  adminUsage: () => "admin:usage",
  adminHealth: () => "admin:health",
  adminSubscriptions: () => "admin:subscriptions",

  // Practice-specific (user-facing)
  practiceStats: (practiceId: string) => `practice:${practiceId}:stats`,
  practiceUsers: (practiceId: string) => `practice:${practiceId}:users`,
  practiceDashboard: (practiceId: string) => `practice:${practiceId}:dashboard`,
  practiceDocuments: (practiceId: string) => `practice:${practiceId}:documents`,
  practiceDocumentStats: (practiceId: string) => `practice:${practiceId}:doc-stats`,
  practiceTasks: (practiceId: string) => `practice:${practiceId}:tasks`,
  practiceTaskStats: (practiceId: string) => `practice:${practiceId}:task-stats`,
  practiceEmployees: (practiceId: string) => `practice:${practiceId}:employees`,
  practiceAlerts: (practiceId: string) => `practice:${practiceId}:alerts`,
  practiceTraining: (practiceId: string) => `practice:${practiceId}:training`,
  practiceLocums: (practiceId: string) => `practice:${practiceId}:locums`,
  practiceLocumStats: (practiceId: string) => `practice:${practiceId}:locum-stats`,
  practicePayroll: (practiceId: string) => `practice:${practiceId}:payroll`,

  // Admin list views
  adminPractices: () => "admin:practices",
  adminSupport: () => "admin:support",

  // User-specific
  userDashboard: (userId: string) => `user:${userId}:dashboard`,
};
