import type { A11yEventMap, A11yEventName, EventBus } from '@a11y-now/types'

type Handler = (payload: never) => void

export const createEventBus = (): EventBus => {
  const handlers = new Map<A11yEventName, Set<Handler>>()

  const on = <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ): (() => void) => {
    let set = handlers.get(event)
    if (!set) {
      set = new Set()
      handlers.set(event, set)
    }
    set.add(fn as Handler)
    return () => off(event, fn)
  }

  const off = <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ): void => {
    handlers.get(event)?.delete(fn as Handler)
  }

  const emit = <E extends A11yEventName>(
    event: E,
    payload: A11yEventMap[E],
  ): void => {
    for (const fn of [...(handlers.get(event) ?? [])]) {
      ;(fn as (payload: A11yEventMap[E]) => void)(payload)
    }
  }

  return { emit, off, on }
}
