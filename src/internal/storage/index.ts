/**
 * IndexedDB Storage Module
 * Provides CRUD operations for storing any JSON data in IndexedDB
 * 
 * IndexedDB Structure:
 * - Database: Top-level container (e.g., "PWA_DATA_STORAGE")
 * - Object Stores: Like tables/namespaces (e.g., "geolocation", "weather", "heartRate")
 * - Records: Individual items stored in each object store
 * - Indexes: For efficient querying (e.g., "createdAt", "updatedAt")
 * 
 * You can use different object stores (namespaces) to organize your data:
 * - storage.useStore('geolocation').create(...)
 * - storage.useStore('weather').create(...)
 * - storage.useStore('heartRate').create(...)
 */

type StoreName = 'permissions' | 'geolocation' | 'weather' | 'heartRate' | 'general';

const DB_NAME = 'PWA_DATA_STORAGE'
const DB_VERSION = 1
const DEFAULT_STORE_NAME = 'general'

interface StoredItem<T = unknown> {
  id: string
  data: T
  createdAt: number
  updatedAt: number
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private currentStore: StoreName = DEFAULT_STORE_NAME
  private knownStores: Set<StoreName> = new Set([DEFAULT_STORE_NAME])

  /**
   * Initialize the IndexedDB database
   * @param storeNames Optional array of store names to create during initialization
   */
  private async init(storeNames?: StoreName[]): Promise<void> {
    if (this.db) {
      return Promise.resolve()
    }

    if (this.initPromise) {
      return this.initPromise
    }

    // Track all stores that should exist
    if (storeNames) {
      storeNames.forEach(name => this.knownStores.add(name))
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`))
        this.initPromise = null
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
        this.initPromise = null
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create all known stores if they don't exist
        this.knownStores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath: 'id' })
            objectStore.createIndex('createdAt', 'createdAt', { unique: false })
            objectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          }
        })
      }
    })

    return this.initPromise
  }

  /**
   * Ensure a specific object store exists (creates it if needed)
   */
  private async ensureStore(storeName: StoreName): Promise<void> {
    if (this.knownStores.has(storeName)) {
      await this.init()
      // Verify store actually exists
      if (this.db && this.db.objectStoreNames.contains(storeName)) {
        return
      }
    }

    this.knownStores.add(storeName)
    
    // If DB is already open, we need to close and reopen with higher version
    const currentDb = this.db
    if (currentDb) {
      const currentVersion = currentDb.version
      currentDb.close()
      this.db = null
      this.initPromise = null

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, currentVersion + 1)

        request.onerror = () => {
          reject(new Error(`Failed to upgrade database: ${request.error?.message}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath: 'id' })
            objectStore.createIndex('createdAt', 'createdAt', { unique: false })
            objectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          }
        }
      })
    } else {
      // DB not open yet, just initialize normally
      await this.init()
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInit(storeName?: StoreName): Promise<IDBDatabase> {
    if (storeName) {
      await this.ensureStore(storeName)
    } else {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Database initialization failed')
    }
    return this.db
  }

  /**
   * Switch to a different object store (namespace/table)
   * @param storeName Name of the object store to use
   * @returns This instance for method chaining
   */
  useStore(storeName: StoreName): IndexedDBStorage {
    this.currentStore = storeName
    return this
  }

  /**
   * Get the current store name
   */
  getCurrentStore(): StoreName {
    return this.currentStore
  }

  /**
   * Get all available store names
   */
  async getStoreNames(): Promise<StoreName[]> {
    await this.ensureInit()
    if (!this.db) {
      return []
    }
    return Array.from(this.db.objectStoreNames) as StoreName[] // :)))))))
  }

  /**
   * Create - Add a new item to the store
   * @param id Unique identifier for the item
   * @param data JSON data to store
   * @param storeName Optional store name (overrides current store)
   */
  async create<T = unknown>(id: string, data: T, storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)
    const now = Date.now()

    const item: StoredItem<T> = {
      id,
      data,
      createdAt: now,
      updatedAt: now,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.add(item)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        // If item already exists, reject with specific error
        if (request.error?.name === 'ConstraintError') {
          reject(new Error(`Item with id "${id}" already exists in store "${targetStore}". Use update() instead.`))
        } else {
          reject(new Error(`Failed to create item: ${request.error?.message}`))
        }
      }
    })
  }

  /**
   * Create or Update - Add a new item or update if it exists
   * @param id Unique identifier for the item
   * @param data JSON data to store
   * @param storeName Optional store name (overrides current store)
   */
  async upsert<T = unknown>(id: string, data: T, storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)
    const now = Date.now()

    // Try to get existing item to preserve createdAt
    const existing = await this.read<T>(id, targetStore).catch(() => null)

    const item: StoredItem<T> = {
      id,
      data,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to upsert item: ${request.error?.message}`))
      }
    })
  }

  /**
   * Read - Get a single item by ID
   * @param id Unique identifier for the item
   * @param storeName Optional store name (overrides current store)
   * @returns The stored item or null if not found
   */
  async read<T = unknown>(id: string, storeName?: StoreName): Promise<StoredItem<T> | null> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readonly')
      const store = transaction.objectStore(targetStore)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => {
        reject(new Error(`Failed to read item: ${request.error?.message}`))
      }
    })
  }

  /**
   * Read Data - Get just the data field from an item
   * @param id Unique identifier for the item
   * @param storeName Optional store name (overrides current store)
   * @returns The data field or null if not found
   */
  async readData<T = unknown>(id: string, storeName?: StoreName): Promise<T | null> {
    const item = await this.read<T>(id, storeName)
    return item ? item.data : null
  }

  /**
   * Read All - Get all items from the store
   * @param storeName Optional store name (overrides current store)
   * @returns Array of all stored items
   */
  async readAll<T = unknown>(storeName?: StoreName): Promise<StoredItem<T>[]> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readonly')
      const store = transaction.objectStore(targetStore)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => {
        reject(new Error(`Failed to read all items: ${request.error?.message}`))
      }
    })
  }

  /**
   * Read All Data - Get just the data fields from all items
   * @param storeName Optional store name (overrides current store)
   * @returns Array of data objects
   */
  async readAllData<T = unknown>(storeName?: StoreName): Promise<T[]> {
    const items = await this.readAll<T>(storeName)
    return items.map(item => item.data)
  }

  /**
   * Update - Update an existing item
   * @param id Unique identifier for the item
   * @param data New JSON data (can be partial)
   * @param storeName Optional store name (overrides current store)
   */
  async update<T = unknown>(id: string, data: Partial<T> | T, storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)
    const existing = await this.read<T>(id, targetStore)

    if (!existing) {
      throw new Error(`Item with id "${id}" not found in store "${targetStore}". Use create() instead.`)
    }

    const updatedItem: StoredItem<T> = {
      ...existing,
      data: { ...existing.data, ...data } as T,
      updatedAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.put(updatedItem)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to update item: ${request.error?.message}`))
      }
    })
  }

  /**
   * Delete - Remove an item by ID
   * @param id Unique identifier for the item
   * @param storeName Optional store name (overrides current store)
   */
  async delete(id: string, storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to delete item: ${request.error?.message}`))
      }
    })
  }

  /**
   * Delete All - Remove all items from the store
   * @param storeName Optional store name (overrides current store)
   */
  async deleteAll(storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to delete all items: ${request.error?.message}`))
      }
    })
  }

  /**
   * Count - Get the number of items in the store
   * @param storeName Optional store name (overrides current store)
   * @returns Number of items
   */
  async count(storeName?: StoreName): Promise<number> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readonly')
      const store = transaction.objectStore(targetStore)
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => {
        reject(new Error(`Failed to count items: ${request.error?.message}`))
      }
    })
  }

  /**
   * Check if an item exists
   * @param id Unique identifier for the item
   * @param storeName Optional store name (overrides current store)
   * @returns True if item exists, false otherwise
   */
  async exists(id: string, storeName?: StoreName): Promise<boolean> {
    const item = await this.read(id, storeName)
    return item !== null
  }

  /**
   * Clear - Remove all items from the store
   * @param storeName Optional store name (overrides current store)
   */
  async clear(storeName?: StoreName): Promise<void> {
    const targetStore = storeName || this.currentStore
    const db = await this.ensureInit(targetStore)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([targetStore], 'readwrite')
      const store = transaction.objectStore(targetStore)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error?.message}`))
      }
    })
  }

  /**
   * Query - Get items matching a custom filter function
   * @param filter Function to filter items
   * @param storeName Optional store name (overrides current store)
   * @returns Array of matching items
   */
  async query<T = unknown>(filter: (item: StoredItem<T>) => boolean, storeName?: StoreName): Promise<StoredItem<T>[]> {
    const allItems = await this.readAll<T>(storeName)
    return allItems.filter(filter)
  }

  /**
   * Query Data - Get data fields from items matching a custom filter
   * @param filter Function to filter items
   * @param storeName Optional store name (overrides current store)
   * @returns Array of matching data objects
   */
  async queryData<T = unknown>(filter: (item: StoredItem<T>) => boolean, storeName?: StoreName): Promise<T[]> {
    const items = await this.query<T>(filter, storeName)
    return items.map(item => item.data)
  }
}

// Export a singleton instance
export const storage = new IndexedDBStorage()

// Export the class for custom instances if needed
export default IndexedDBStorage

// Export types
export type { StoredItem }

