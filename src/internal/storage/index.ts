

export interface GeoPosition {
  accuracy: number
  latitude: number
  longitude: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

export interface AccelerometerData {
  x: number | null
  y: number | null
  z: number | null
  alpha: number | null,
  beta: number | null
  gamma: number | null
  interval: number | null
}

export interface GeneralData {
  attacks_last_7_days: number;
  attacks_last_30_days: number;
  bright_light_exposure: number;
  date: string;
  days_since_last_attack: number;
  hydration_low: number;
  migraine_next_day: number;
  pressure_drop: number;
  prodrome_symptoms: number;
  screen_time_hours: number;
  skipped_meal: number;
  sleep_hours: number;
  stress_level: number;
}

export interface CalendarData {
  date: string; // ISO date string (YYYY-MM-DD)
  eventCount: number;
  totalDurationMinutes: number;
  workloadScore: number; // 0-100 scale based on events and duration
  events: Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    durationMinutes: number;
  }>;
}

export interface WearablesData {
    date: string; // ISO date string (YYYY-MM-DD)
    timestamp: number; // Unix timestamp in milliseconds
    
    // Heart rate data
    heartRate?: {
        bpm: number; // Beats per minute
        restingBpm?: number; // Resting heart rate
        maxBpm?: number; // Maximum heart rate during the day
        hrv?: number; // Heart rate variability (ms)
    };
    
    // Activity data
    steps?: number; // Total steps for the day
    distance?: number; // Distance in meters
    calories?: number; // Calories burned
    activeMinutes?: number; // Minutes of active exercise
    
    // Stress level
    stressLevel?: number; // 0-100 scale
    
    // Sleep data
    sleep?: {
        durationHours: number; // Total sleep duration
        quality: number; // 0-100 sleep quality score
        deepSleepMinutes?: number; // Deep sleep duration
        remSleepMinutes?: number; // REM sleep duration
        lightSleepMinutes?: number; // Light sleep duration
        awakeMinutes?: number; // Time awake during sleep
        sleepStart?: string; // ISO timestamp when sleep started
        sleepEnd?: string; // ISO timestamp when sleep ended
    };
    
    // Workout data
    workouts?: Array<{
        type: string; // e.g., "running", "cycling", "walking", "strength"
        durationMinutes: number;
        calories?: number;
        distance?: number; // in meters
        averageHeartRate?: number;
        maxHeartRate?: number;
        startTime: string; // ISO timestamp
        endTime?: string; // ISO timestamp
    }>;
    
    // Additional metrics
    oxygenSaturation?: number; // SpO2 percentage (0-100)
    bodyTemperature?: number; // Body temperature in Celsius
    respiratoryRate?: number; // Breaths per minute
}

type StoreName =
    | 'permissions'
    | 'geolocation'
    | 'weather'
    | 'heartRate'
    | 'general'
    | 'accelerometer'
    | 'gyroscope'
    | 'migraines'
    | 'calendar'
    | 'wearables';

const DB_NAME = 'PWA_DATA_STORAGE'
const DEFAULT_STORE_NAME = 'general'

interface StoredItem<T = unknown> {
  id: number
  data: T
  createdAt: number
  updatedAt: number
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private currentStore: StoreName = DEFAULT_STORE_NAME
  // Ensure the migraines store exists by default so UI can log attacks immediately
  private knownStores: Set<StoreName> = new Set([DEFAULT_STORE_NAME, 'migraines'])

  /**
   * Get the current database version and existing stores
   */
  private async getDatabaseInfo(): Promise<{ version: number; stores: DOMStringList }> {
    return new Promise((resolve, reject) => {
      // Open without version to check what exists
      // If database doesn't exist, this will still succeed but we'll need to create it
      const checkRequest = indexedDB.open(DB_NAME)
      
      checkRequest.onsuccess = () => {
        const db = checkRequest.result
        const version = db.version
        const stores = db.objectStoreNames
        db.close()
        resolve({ version, stores })
      }
      
      checkRequest.onerror = () => {
        // If we can't open, assume it doesn't exist
        // Return empty stores - we'll create them on first init
        const emptyStores = {
          contains: () => false,
          length: 0,
          item: () => null,
          [Symbol.iterator]: function* () {}
        } as unknown as DOMStringList
        resolve({ version: 1, stores: emptyStores })
      }
      
      checkRequest.onblocked = () => {
        reject(new Error('Database is blocked by another connection'))
      }
    })
  }

  /**
   * Initialize the IndexedDB database
   * Opens without version first, then upgrades only if needed
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

    // First, check what exists in the database
    const { version: existingVersion, stores: existingStores } = await this.getDatabaseInfo()
    
    // Check if all known stores already exist
    const missingStores = Array.from(this.knownStores).filter(
      storeName => !existingStores.contains(storeName)
    )

    // If all stores exist, just open without version
    if (missingStores.length === 0) {
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME)

        request.onerror = () => {
          reject(new Error(`Failed to open database: ${request.error?.message}`))
          this.initPromise = null
        }

        request.onsuccess = () => {
          this.db = request.result
          resolve()
          this.initPromise = null
        }
      })
      return this.initPromise
    }

    // Need to upgrade - increment version and create missing stores
    const newVersion = existingVersion + 1

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, newVersion)

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

        // Create all missing stores
        missingStores.forEach(storeName => {
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
    // Add to known stores
    this.knownStores.add(storeName)

    // If DB is already open, check if store exists
    if (this.db) {
      if (this.db.objectStoreNames.contains(storeName)) {
        return // Store already exists
      }
      
      // Store doesn't exist, need to upgrade
      const currentVersion = this.db.version
      this.db.close()
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
      // DB not open yet, just initialize normally (will create store if needed)
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
  async create<T = unknown>(id: number, data: T, storeName?: StoreName): Promise<void> {
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
  async upsert<T = unknown>(id: number, data: T, storeName?: StoreName): Promise<void> {
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
  async read<T = unknown>(id: number, storeName?: StoreName): Promise<StoredItem<T> | null> {
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
  async readData<T = unknown>(id: number, storeName?: StoreName): Promise<T | null> {
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
        const result = request.result || []
        result.sort((a, b) => a.id - b.id)
        resolve(result)
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
  async update<T = unknown>(id: number, data: Partial<T> | T, storeName?: StoreName): Promise<void> {
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
  async delete(id: number, storeName?: StoreName): Promise<void> {
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
  async exists(id: number, storeName?: StoreName): Promise<boolean> {
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

