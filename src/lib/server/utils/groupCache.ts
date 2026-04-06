interface CacheEntry<T> {
  data: T;
  expires: number;
}

class TimedCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private defaultTTL = 60000;

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  onUpdate(callback: (data: any) => void) {
    const event = 'cache:update';
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  notifyUpdate(data: any) {
    const callbacks = this.listeners.get('cache:update');
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const groupCache = new TimedCache();

export function getGroupCacheKey(id?: string): string {
  return id ? `group:${id}` : 'groups:all';
}

export function invalidateGroupCache(groupId?: string) {
  if (groupId) {
    groupCache.delete(getGroupCacheKey(groupId));
  }
  groupCache.invalidate('group:');
  groupCache.notifyUpdate({ groupId, action: 'invalidate' });
}