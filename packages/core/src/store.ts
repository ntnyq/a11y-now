import type {
  ScopedState,
  StateDefaults,
  StateValue,
  StorageAdapter,
} from '@a11y-now/types'

function isStateValue(value: unknown): value is StateValue {
  return (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  )
}

/**
 * Create the plugin-scoped reactive persisted state.
 *
 * The whole scope is persisted as one JSON blob under
 * `<prefix>:plugin:<name>`, mirroring how the reference toolbar keeps one
 * cookie per feature — but versionable and namespaced.
 *
 * @template T - Persisted state keys and their value types.
 * @param name - Plugin name used in the storage key.
 * @param defaults - Initial values and the keys restored from persisted state.
 * @param storage - Persistence adapter, or `null` to keep state only in memory.
 * @param prefix - Namespace prepended to the plugin storage key.
 * @returns State restored from storage with mutation, reset, and subscription
 *   methods.
 */
export function createScopedState<T extends StateDefaults>(
  name: string,
  defaults: T,
  storage: StorageAdapter | null,
  prefix: string,
): ScopedState<T> {
  const storageKey = `${prefix}:plugin:${name}`
  const values: Record<string, StateValue> = { ...defaults }
  const subscribers = new Set<
    (key: keyof T & string, value: T[keyof T]) => void
  >()

  function restore(): void {
    const raw = storage?.get(storageKey)
    if (raw === null || raw === undefined) {
      return
    }
    let parsed: unknown = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Corrupted storage: fall back to defaults.
      return
    }
    if (!parsed || typeof parsed !== 'object') {
      return
    }
    const record = parsed as Record<string, unknown>
    for (const key of Object.keys(defaults)) {
      const value = record[key]
      if (key in record && isStateValue(value)) {
        values[key] = value
      }
    }
  }
  restore()

  function persist(): void {
    storage?.set(storageKey, JSON.stringify(values))
  }

  function notify(key: keyof T & string): void {
    // Snapshot: subscribers may unsubscribe while we iterate.
    const snapshot = [...subscribers]
    for (const fn of snapshot) {
      fn(key, values[key] as T[keyof T])
    }
  }

  return {
    defaults,
    get: key => values[key as string] as T[typeof key],
    reset() {
      for (const key of Object.keys(defaults)) {
        values[key] = defaults[key] as StateValue
      }
      storage?.remove(storageKey)
      for (const key of Object.keys(defaults)) {
        notify(key)
      }
    },
    set(key, value) {
      if (values[key as string] === value) {
        return
      }
      values[key as string] = value as StateValue
      persist()
      notify(key as keyof T & string)
    },
    subscribe(fn) {
      subscribers.add(fn)
      return () => {
        subscribers.delete(fn)
      }
    },
  }
}

/**
 * Default storage adapter backed by `localStorage`, or `null` when absent.
 *
 * @returns A localStorage adapter, or `null` when storage is absent or
 *   inaccessible.
 */
export function createLocalStorageAdapter(): StorageAdapter | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null
    }
    return {
      get(key) {
        try {
          return localStorage.getItem(key)
        } catch {
          return null
        }
      },
      remove(key) {
        try {
          localStorage.removeItem(key)
        } catch {
          // Persistence is best-effort; runtime state still resets.
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, value)
        } catch {
          // Quota or privacy restrictions must not interrupt page updates.
        }
      },
    }
  } catch {
    return null
  }
}

/**
 * In-memory adapter, useful for tests and privacy-sensitive embeds.
 *
 * @returns An independent storage adapter backed by a new in-memory map.
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    get: key => map.get(key) ?? null,
    remove(key) {
      map.delete(key)
    },
    set(key, value) {
      map.set(key, value)
    },
  }
}
