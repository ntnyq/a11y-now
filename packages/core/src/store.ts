import type {
  ScopedState,
  StateDefaults,
  StateValue,
  StorageAdapter,
} from '@a11y-now/types'

/**
 * Create the plugin-scoped reactive persisted state.
 *
 * The whole scope is persisted as one JSON blob under
 * `<prefix>:plugin:<name>`, mirroring how the reference toolbar keeps one
 * cookie per feature — but versionable and namespaced.
 */
export const createScopedState = <T extends StateDefaults>(
  name: string,
  defaults: T,
  storage: StorageAdapter | null,
  prefix: string,
): ScopedState<T> => {
  const storageKey = `${prefix}:plugin:${name}`
  const values: Record<string, StateValue> = { ...defaults }
  const subscribers = new Set<(key: keyof T & string, value: T[keyof T]) => void>()

  if (storage) {
    const raw = storage.get(storageKey)
    if (raw != null) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          for (const key of Object.keys(defaults)) {
            if (key in (parsed as Record<string, unknown>)) {
              const value = (parsed as Record<string, unknown>)[key]
              if (
                value === null
                || typeof value === 'boolean'
                || typeof value === 'number'
                || typeof value === 'string'
              ) {
                values[key] = value
              }
            }
          }
        }
      } catch {
        // Corrupted storage: fall back to defaults.
      }
    }
  }

  const persist = (): void => {
    storage?.set(storageKey, JSON.stringify(values))
  }

  const notify = (key: keyof T & string): void => {
    for (const fn of [...subscribers]) {
      fn(key, values[key] as T[keyof T])
    }
  }

  return {
    defaults,
    get: key => values[key as string] as T[typeof key],
    reset: () => {
      for (const key of Object.keys(defaults)) {
        values[key] = defaults[key] as StateValue
      }
      storage?.remove(storageKey)
      for (const key of Object.keys(defaults)) {
        notify(key)
      }
    },
    set: (key, value) => {
      if (values[key as string] === value) {
        return
      }
      values[key as string] = value as StateValue
      persist()
      notify(key as keyof T & string)
    },
    subscribe: fn => {
      subscribers.add(fn)
      return () => {
        subscribers.delete(fn)
      }
    },
  }
}

/** Default storage adapter backed by `localStorage`, or `null` when absent. */
export const createLocalStorageAdapter = (): StorageAdapter | null => {
  try {
    if (typeof localStorage === 'undefined') {
      return null
    }
    return {
      get: key => localStorage.getItem(key),
      remove: key => {
        localStorage.removeItem(key)
      },
      set: (key, value) => {
        localStorage.setItem(key, value)
      },
    }
  } catch {
    return null
  }
}

/** In-memory adapter, useful for tests and privacy-sensitive embeds. */
export const createMemoryStorageAdapter = (): StorageAdapter => {
  const map = new Map<string, string>()
  return {
    get: key => map.get(key) ?? null,
    remove: key => {
      map.delete(key)
    },
    set: (key, value) => {
      map.set(key, value)
    },
  }
}
