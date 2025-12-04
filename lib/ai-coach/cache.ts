/**
 * Simple in-memory cache for AI Coach responses
 * Cache TTL: 5 minutes
 */

interface CacheEntry {
  response: string
  timestamp: number
  sqlQuery?: string
  resultCount?: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const responseCache = new Map<string, CacheEntry>()

/**
 * Generate a cache key from user ID and message
 */
function getCacheKey(userId: string, message: string): string {
  // Normalize message (lowercase, trim) for better cache hits
  const normalizedMessage = message.toLowerCase().trim()
  return `${userId}:${normalizedMessage}`
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse(userId: string, message: string): CacheEntry | null {
  const cacheKey = getCacheKey(userId, message)
  const cached = responseCache.get(cacheKey)
  
  if (!cached) {
    return null
  }
  
  // Check if cache is expired
  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    responseCache.delete(cacheKey)
    return null
  }
  
  return cached
}

/**
 * Store response in cache
 */
export function setCachedResponse(
  userId: string,
  message: string,
  response: string,
  metadata?: { sqlQuery?: string; resultCount?: number }
): void {
  const cacheKey = getCacheKey(userId, message)
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    ...metadata,
  })
  
  // Clean up old entries periodically (keep cache size reasonable)
  if (responseCache.size > 100) {
    const now = Date.now()
    const keysToDelete: string[] = []
    responseCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_TTL) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => responseCache.delete(key))
  }
}

/**
 * Clear cache for a specific user (optional utility)
 */
export function clearUserCache(userId: string): void {
  const keysToDelete: string[] = []
  responseCache.forEach((_, key) => {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => responseCache.delete(key))
}

/**
 * Clear all cache (optional utility)
 */
export function clearAllCache(): void {
  responseCache.clear()
}

