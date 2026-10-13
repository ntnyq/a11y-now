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
  /**
   * Mount immediately, defaults to true.
   *
   * @default true
   */
  autoMount?: boolean
}

/**
 * Create a toolbar instance bound to the current reactive owner.
 * Provide it via `A11yNowContext.Provider` for descendant components.
 *
 * @param options - Toolbar options; `autoMount` defaults to `true`.
 * @returns The toolbar instance, destroyed when the current reactive owner is
 *   disposed.
 */
export function createA11yNowSolid(
  options: A11yNowSolidOptions = {},
): A11yNowInstance {
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

/**
 * Read the toolbar instance from context.
 *
 * @returns The toolbar instance provided by the enclosing framework context.
 * @throws {Error} If no toolbar instance has been provided.
 */
export function useA11yNow(): A11yNowInstance {
  const instance = useContext(A11yNowContext)
  if (!instance) {
    throw new Error(
      '[a11y-now] useA11yNow() requires an A11yNowContext.Provider',
    )
  }
  return instance
}

/**
 * A signal holding the latest payload of an a11y-now event.
 *
 * @template E - Event name determining the payload type.
 * @param instance - Toolbar instance whose event bus is observed.
 * @param event - Name of the event to observe until owner cleanup.
 * @returns An accessor returning the latest payload, initially `undefined`.
 */
export function createA11yEventSignal<E extends A11yEventName>(
  instance: A11yNowInstance,
  event: E,
): Accessor<A11yEventMap[E] | undefined> {
  const [payload, setPayload] = createSignal<A11yEventMap[E]>()
  const stop = instance.events.on(event, next => {
    setPayload(() => next)
  })
  onCleanup(stop)
  return payload
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
