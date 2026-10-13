import type { A11yEventMap, A11yEventName, EventBus } from '@a11y-now/types'

type Handler = (payload: never) => void

/**
 * Create a typed event bus with synchronous listener delivery.
 *
 * @returns An independent bus with subscribe, unsubscribe, and emit methods.
 */
export function createEventBus(): EventBus {
  const handlers = new Map<A11yEventName, Set<Handler>>()

  function on<E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ): () => void {
    let set = handlers.get(event)
    if (!set) {
      set = new Set()
      handlers.set(event, set)
    }
    set.add(fn as Handler)
    return () => off(event, fn)
  }

  function off<E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ): void {
    handlers.get(event)?.delete(fn as Handler)
  }

  function emit<E extends A11yEventName>(
    event: E,
    payload: A11yEventMap[E],
  ): void {
    const set = handlers.get(event)
    if (!set) {
      return
    }
    // Snapshot: handlers may unsubscribe while we iterate.
    const snapshot = [...set]
    for (const fn of snapshot) {
      ;(fn as (payload: A11yEventMap[E]) => void)(payload)
    }
  }

  return { emit, off, on }
}
