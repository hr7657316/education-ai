import { Problem } from '../types';

const CACHE_KEY_PREFIX = 'slate_problem_cache_';
const CACHE_INDEX_KEY = 'slate_problem_cache_index';

/**
 * Normalizes a topic string to use as a cache key
 * @param topic - The topic string to normalize
 * @returns Normalized topic string (lowercase, trimmed)
 */
const normalizeTopic = (topic: string): string => {
  return topic.toLowerCase().trim();
};

/**
 * Gets the full cache key for a given topic
 * @param topic - The topic string
 * @returns Full cache key with prefix
 */
const getCacheKey = (topic: string): string => {
  return `${CACHE_KEY_PREFIX}${normalizeTopic(topic)}`;
};

/**
 * Retrieves a cached problem for a given topic
 * @param topic - The topic to search for
 * @returns The cached problem or null if not found
 */
export const getCachedProblem = (topic: string): Problem | null => {
  try {
    const cacheKey = getCacheKey(topic);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      console.log(`[CACHE] No cached problem found for topic: "${topic}"`);
      return null;
    }

    const problem: Problem = JSON.parse(cachedData);
    console.log(`[CACHE] Retrieved cached problem for topic: "${topic}"`);
    return problem;
  } catch (error) {
    console.error('[CACHE] Error retrieving cached problem:', error);
    return null;
  }
};

/**
 * Stores a problem in the cache for a given topic
 * @param topic - The topic to cache the problem under
 * @param problem - The problem to cache
 */
export const setCachedProblem = (topic: string, problem: Problem): void => {
  // FIX: Moved problemWithTimestamp declaration out of try block to be accessible in catch block.
  const problemWithTimestamp: Problem = {
    ...problem,
    cachedAt: new Date().toISOString(),
  };
  try {
    const cacheKey = getCacheKey(topic);
    const normalizedTopic = normalizeTopic(topic);

    // Store the problem
    localStorage.setItem(cacheKey, JSON.stringify(problemWithTimestamp));

    // Update cache index (list of all cached topics)
    updateCacheIndex(normalizedTopic);

    console.log(`[CACHE] Cached problem for topic: "${topic}"`);
  } catch (error) {
    console.error('[CACHE] Error caching problem:', error);
    // If localStorage is full, try to clear old entries
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('[CACHE] Storage quota exceeded, clearing old cache entries');
      clearOldestCacheEntries(5); // Clear 5 oldest entries
      // Retry storing
      try {
        localStorage.setItem(getCacheKey(topic), JSON.stringify(problemWithTimestamp));
      } catch (retryError) {
        console.error('[CACHE] Failed to cache even after clearing old entries');
      }
    }
  }
};

/**
 * Updates the cache index with a new topic
 * @param normalizedTopic - The normalized topic to add to index
 */
const updateCacheIndex = (normalizedTopic: string): void => {
  try {
    const indexData = localStorage.getItem(CACHE_INDEX_KEY);
    const index: Array<{ topic: string; timestamp: string }> = indexData ? JSON.parse(indexData) : [];

    // Remove existing entry if present
    const filteredIndex = index.filter(entry => entry.topic !== normalizedTopic);

    // Add new entry
    filteredIndex.push({
      topic: normalizedTopic,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(filteredIndex));
  } catch (error) {
    console.error('[CACHE] Error updating cache index:', error);
  }
};

/**
 * Clears the oldest cache entries
 * @param count - Number of entries to clear
 */
const clearOldestCacheEntries = (count: number): void => {
  try {
    const indexData = localStorage.getItem(CACHE_INDEX_KEY);
    if (!indexData) return;

    const index: Array<{ topic: string; timestamp: string }> = JSON.parse(indexData);

    // Sort by timestamp (oldest first)
    index.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Remove oldest entries
    const toRemove = index.slice(0, count);
    toRemove.forEach(entry => {
      localStorage.removeItem(getCacheKey(entry.topic));
      console.log(`[CACHE] Removed old cache entry: "${entry.topic}"`);
    });

    // Update index
    const remainingIndex = index.slice(count);
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(remainingIndex));
  } catch (error) {
    console.error('[CACHE] Error clearing old cache entries:', error);
  }
};

/**
 * Clears all cached problems
 */
export const clearCache = (): void => {
  try {
    const indexData = localStorage.getItem(CACHE_INDEX_KEY);
    if (indexData) {
      const index: Array<{ topic: string; timestamp: string }> = JSON.parse(indexData);
      index.forEach(entry => {
        localStorage.removeItem(getCacheKey(entry.topic));
      });
    }

    localStorage.removeItem(CACHE_INDEX_KEY);
    console.log('[CACHE] Cleared all cached problems');
  } catch (error) {
    console.error('[CACHE] Error clearing cache:', error);
  }
};

/**
 * Gets all cached topics
 * @returns Array of cached topic names with timestamps
 */
export const getCachedTopics = (): Array<{ topic: string; timestamp: string }> => {
  try {
    const indexData = localStorage.getItem(CACHE_INDEX_KEY);
    if (!indexData) return [];

    return JSON.parse(indexData);
  } catch (error) {
    console.error('[CACHE] Error getting cached topics:', error);
    return [];
  }
};
