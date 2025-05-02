import { helper, hs, timestamp } from '@heyform-inc/utils'

export interface LRUStore {
  setItem(key: string, data: any): any

  getItem(key: string): any

  removeItem(key: string): any
}

export interface LRUOptions {
  bucket?: string
  capacity?: number
  expires?: number
  store?: LRUStore
}

interface LRUCacheItem<T = any> {
  value: T
  expiresAt: number
}

interface LRUCache<T = any> {
  keys: string[]
  items: Record<string, LRUCacheItem<T>>
}

export class LRUMemoryStore implements LRUStore {
  private readonly data: Record<string, any> = {}

  setItem(key: string, data: any): any {
    this.data[key] = data
  }

  getItem(key: string): any {
    return this.data[key]
  }

  removeItem(key: string): any {
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
    this.bucket = options.bucket || 'HEYFORM_BUCKET'
    this.capacity = options.capacity || 10
    this.expires = options.expires || hs('7d')!
    this.store = options.store || new LRUMemoryStore()

    // Initial cache value
    this.init()
  }

  get<T = any>(key: string): T | undefined {
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

  put(key: string, data: any) {
    if (helper.isEmpty(key)) {
      return
    }

    // Clear expired items
    this.clearExpired()

    // Pop first item
    if (this.cache.keys.length >= this.capacity) {
      const k = this.cache.keys.pop()!
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
