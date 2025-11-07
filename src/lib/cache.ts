type CacheItem<T> = {
    data: T;
    timestamp: number;
    expiresIn: number;
};

const CACHE_PREFIX = 'viegphunt_cache_';

export class CacheManager {
    // Save data to cache with expiration time (default: 5 minutes)
    static set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
        const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresIn
        }
        
        localStorage.setItem(
            `${CACHE_PREFIX}${key}`,
            JSON.stringify(cacheItem)
        )
    }

    // Get data from cache if not expired
    static get<T>(key: string): T | null {
        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!cached) return null;

            const cacheItem: CacheItem<T> = JSON.parse(cached)
            const now = Date.now()
            
            if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                this.remove(key)
                return null
            }
            return cacheItem.data;
        } catch {
            return null;
        }
    }

    // Remove specific cache item
    static remove(key: string): void {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    }

    // Clear all cache items
    static clearAll(): void {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
        });
    }

    // Get or fetch data with caching
    static async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        expiresIn?: number
    ): Promise<T> {
        const cached = this.get<T>(key)
        if (cached !== null) {
            return cached
        }

        const data = await fetcher()
        this.set(key, data, expiresIn)
        
        return data
    }
}
