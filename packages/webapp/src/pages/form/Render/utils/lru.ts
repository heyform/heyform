import store2 from 'store2'

import { helper, timestamp, toSecond } from '@heyform-inc/utils'

import { HEYFORM_DATA_KEY } from '../consts'

export interface LRUStore {
  setItem(key: string, data: Any): Any

  getItem(key: string): Any

  removeItem(key: string): Any
}

export interface LRUOptions {
  bucket?: string
  capacity?: number
  expires?: number
  store?: LRUStore
}

interface LRUCacheItem<T = Any> {
  value: T
  expiresAt: number
}

interface LRUCache<T = Any> {
  keys: string[]
  items: Record<string, LRUCacheItem<T>>
}

export class LRUMemoryStore implements LRUStore {
  private readonly data: Record<string, Any> = {}

  setItem(key: string, data: Any): Any {
    this.data[key] = data
  }

  getItem(key: string): Any {
    return this.data[key]
  }

  removeItem(key: string): Any {
    if (key in this.data) {
      delete this.data[key]
    }
  }
}

export class LRU {
  private readonly bucket!: string
  private readonly capacity!: number
  private readonly expires!: number
  private readonly store!: LRUStore
  private cache!: LRUCache

  constructor(options: LRUOptions) {
    this.bucket = options.bucket || 'LRU_BUCKET'
    this.capacity = options.capacity || 10
    this.expires = options.expires || toSecond('7d')!
    this.store = options.store || new LRUMemoryStore()

    // Initial cache value
    this.init()
  }

  get<T = Any>(key: string): T | undefined {
    if (
      !this.cache.keys.includes(key) ||
      // eslint-disable-next-line no-prototype-builtins
      !this.cache.items.hasOwnProperty(key)
    ) {
      return
    }

    const row = this.cache.items[key]

    if (helper.isValid(row)) {
      if (row!.expiresAt >= timestamp()) {
        return row!.value
      }

      // Delete expire item
      this.destroy(key)
      this.syncToStore()
    }
  }

  put(key: string, data: Any) {
    // Clear expired items
    this.clearExpired()

    // Pop first item
    if (this.cache.keys.length >= this.capacity) {
      const k = this.cache.keys.shift()!
      this.destroy(k)
    }

    // Delete exists item and push to the bottom of stack
    const keyIdx = this.cache.keys.indexOf(key)
    if (keyIdx > -1) {
      const k = this.cache.keys[keyIdx]
      this.destroy(k)
    }

    this.cache.keys.push(key)
    this.cache.items[key] = {
      value: data,
      expiresAt: timestamp() + this.expires
    }
    this.syncToStore()
  }

  remove(key: string) {
    this.destroy(key)
    this.syncToStore()
  }

  private init() {
    let cache: LRUCache = this.store.getItem(this.bucket)

    if (helper.isEmpty(cache)) {
      cache = {
        keys: [],
        items: {}
      }
    }

    this.cache = cache

    if (helper.isValidArray(this.cache.keys)) {
      this.clearExpired()
      this.syncToStore()
    }
  }

  private destroy(key: string) {
    this.cache.keys = this.cache.keys.filter(row => row !== key)
    delete this.cache.items[key]
  }

  private clearExpired() {
    this.cache.keys.forEach(key => {
      let isExpired = true
      const row = this.cache.items[key]

      if (helper.isValid(row) && row.expiresAt >= timestamp()) {
        isExpired = false
      }

      if (isExpired) {
        this.destroy(key)
      }
    })
  }

  private syncToStore() {
    this.store.setItem(this.bucket, this.cache)
  }
}

let lru: LRU

export function getLRU(): LRU {
  if (!lru) {
    lru = new LRU({
      bucket: HEYFORM_DATA_KEY,
      store: {
        getItem: store2.get.bind(store2),
        setItem: store2.set.bind(store2),
        removeItem: store2.remove.bind(store2)
      }
    })
  }
  return lru
}
