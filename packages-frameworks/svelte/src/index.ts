import { createA11yNow } from '@a11y-now/core'
import type {
  A11yEventMap,
  A11yEventName,
  A11yNowInstance,
  A11yNowOptions,
} from '@a11y-now/types'
import { getContext, onDestroy, setContext } from 'svelte'
import { readable } from 'svelte/store'
import type { Readable } from 'svelte/store'

/**
 * Shared Svelte context key used to provide and retrieve the toolbar instance.
 */
const KEY = Symbol.for('a11y-now')

export interface A11yNowSvelteOptions extends A11yNowOptions {
  /**
   * Mount immediately, defaults to true.
   *
   * @default true
   */
  autoMount?: boolean
}

/**
 * Create the toolbar and register it in the Svelte component context.
 * Call from a root component (e.g. +layout.svelte).
 *
 * ```svelte
 * <script>
 *   import { provideA11yNow } from '@a11y-now/svelte'
 *   provideA11yNow({ plugins: [zoom()], themes: [deepBlue] })
 * </script>
 * ```
 *
 * @param options - Toolbar options; `autoMount` defaults to `true`.
 * @returns The provided instance, destroyed with its owning Svelte component.
 */
export function provideA11yNow(
  options: A11yNowSvelteOptions = {},
): A11yNowInstance {
  const { autoMount = true, ...rest } = options
  const instance = createA11yNow(rest)
  setContext(KEY, instance)
  if (autoMount) {
    instance.mount()
  }
  onDestroy(() => {
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
  const instance = getContext<A11yNowInstance | undefined>(KEY)
  if (!instance) {
    throw new Error('[a11y-now] useA11yNow() requires provideA11yNow() first')
  }
  return instance
}

/**
 * A readable store of the latest payload of an a11y-now event.
 * Works with both Svelte 4 stores and Svelte 5 `$store` interop.
 *
 * @template E - Event name determining the payload type.
 * @param instance - Toolbar instance whose event bus is observed.
 * @param event - Name of the event to subscribe to while the store has
 *   subscribers.
 * @returns A readable store containing the latest payload, initially
 *   `undefined`.
 */
export function a11yEventStore<E extends A11yEventName>(
  instance: A11yNowInstance,
  event: E,
): Readable<A11yEventMap[E] | undefined> {
  return readable<A11yEventMap[E] | undefined>(undefined, set =>
    instance.events.on(event, payload => {
      set(payload)
    }),
  )
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
