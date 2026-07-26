/**
 * Node 25+ ships experimental WebStorage globals — `localStorage` is
 * `undefined` unless `--localstorage-file` is provided. Because the keys
 * already exist on `globalThis`, vitest's happy-dom environment skips copying
 * the window implementations over them, leaving broken globals that shadow
 * working storage. The real happy-dom window is unreachable from setup code
 * (`window` and `document.defaultView` are both remapped to the patched
 * global), so back the broken keys with a fresh in-memory Storage per file.
 */
export const createMemoryStorage = (): Storage => {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => {
      map.clear()
    },
    getItem: key => map.get(key) ?? null,
    key: index => [...map.keys()][index] ?? null,
    removeItem: key => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, String(value))
    },
  }
}

for (const key of ['localStorage', 'sessionStorage'] as const) {
  if (globalThis[key] === undefined) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: createMemoryStorage(),
      writable: true,
    })
  }
}
