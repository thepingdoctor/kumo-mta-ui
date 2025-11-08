/**
 * Offline storage utility using IndexedDB for PWA data persistence
 */

const DB_NAME = 'kumomta-offline-db';
const DB_VERSION = 1;
const STORES = {
  DASHBOARD: 'dashboard-data',
  QUEUE: 'queue-data',
  ANALYTICS: 'analytics-data',
  CONFIG: 'config-data',
  PENDING_REQUESTS: 'pending-requests',
} as const;

interface StorageItem<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
}

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            if (storeName === STORES.PENDING_REQUESTS) {
              store.createIndex('retryCount', 'retryCount', { unique: false });
            }
          }
        });
      };
    });

    return this.initPromise;
  }

  async setItem<T>(store: keyof typeof STORES, key: string, value: T, ttlMinutes?: number): Promise<void> {
    const db = await this.initDB();
    const storeName = STORES[store];

    const item: StorageItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getItem<T>(store: keyof typeof STORES, key: string): Promise<T | null> {
    const db = await this.initDB();
    const storeName = STORES[store];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;

        if (!item) {
          resolve(null);
          return;
        }

        // Check if item has expired
        if (item.expiresAt && item.expiresAt < Date.now()) {
          this.removeItem(store, key); // Clean up expired item
          resolve(null);
          return;
        }

        resolve(item.value);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(store: keyof typeof STORES, key: string): Promise<void> {
    const db = await this.initDB();
    const storeName = STORES[store];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(store: keyof typeof STORES): Promise<void> {
    const db = await this.initDB();
    const storeName = STORES[store];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllKeys(store: keyof typeof STORES): Promise<string[]> {
    const db = await this.initDB();
    const storeName = STORES[store];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Pending requests queue management
  async queueRequest(request: Omit<PendingRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingRequest: PendingRequest = {
      id,
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const db = await this.initDB();
    const storeName = STORES.PENDING_REQUESTS;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const dbRequest = objectStore.put({ key: id, ...pendingRequest });

      dbRequest.onsuccess = () => resolve(id);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
  }

  async getPendingRequests(): Promise<PendingRequest[]> {
    const db = await this.initDB();
    const storeName = STORES.PENDING_REQUESTS;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const items = request.result as Array<{ key: string } & PendingRequest>;
        // Extract pending requests, removing the internal 'key' property
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resolve(items.map(({ key: _key, ...rest }) => rest));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingRequest(id: string): Promise<void> {
    return this.removeItem('PENDING_REQUESTS', id);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const db = await this.initDB();
    const storeName = STORES.PENDING_REQUESTS;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const getRequest = objectStore.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount += 1;
          const putRequest = objectStore.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Clean up expired items
  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const db = await this.initDB();

    const promises = Object.values(STORES).map(async (storeName) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const item = cursor.value as StorageItem;
            if (item.expiresAt && item.expiresAt < now) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }
}

export const offlineStorage = new OfflineStorage();
export type { PendingRequest };
