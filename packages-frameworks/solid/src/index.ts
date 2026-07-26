import { createA11yNow } from '@a11y-now/core'
import type {
  A11yEventMap,
  A11yEventName,
  A11yNowInstance,
  A11yNowOptions,
} from '@a11y-now/types'
import { createContext, createSignal, onCleanup, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

export const A11yNowContext = createContext<A11yNowInstance>()

export interface A11yNowSolidOptions extends A11yNowOptions {
  /** Mount immediately, defaults to true. */
  autoMount?: boolean
}

/**
 * Create a toolbar instance bound to the current reactive owner.
 * Provide it via `A11yNowContext.Provider` for descendant components.
 */
export const createA11yNowSolid = (
  options: A11yNowSolidOptions = {},
): A11yNowInstance => {
  const { autoMount = true, ...rest } = options
  const instance = createA11yNow(rest)
  if (autoMount) {
    instance.mount()
  }
  onCleanup(() => {
    instance.destroy()
  })
  return instance
}

/** Read the toolbar instance from context. */
export const useA11yNow = (): A11yNowInstance => {
  const instance = useContext(A11yNowContext)
  if (!instance) {
    throw new Error(
      '[a11y-now] useA11yNow() requires an A11yNowContext.Provider',
    )
  }
  return instance
}

/** A signal holding the latest payload of an a11y-now event. */
export const createA11yEventSignal = <E extends A11yEventName>(
  instance: A11yNowInstance,
  event: E,
): Accessor<A11yEventMap[E] | undefined> => {
  const [payload, setPayload] = createSignal<A11yEventMap[E]>()
  const stop = instance.events.on(event, next => {
    setPayload(() => next)
  })
  onCleanup(stop)
  return payload
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
