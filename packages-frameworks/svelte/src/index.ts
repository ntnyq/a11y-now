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

const KEY = Symbol.for('a11y-now')

export interface A11yNowSvelteOptions extends A11yNowOptions {
  /** Mount immediately, defaults to true. */
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
 */
export const provideA11yNow = (
  options: A11yNowSvelteOptions = {},
): A11yNowInstance => {
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

/** Read the toolbar instance from context. */
export const useA11yNow = (): A11yNowInstance => {
  const instance = getContext<A11yNowInstance | undefined>(KEY)
  if (!instance) {
    throw new Error('[a11y-now] useA11yNow() requires provideA11yNow() first')
  }
  return instance
}

/**
 * A readable store of the latest payload of an a11y-now event.
 * Works with both Svelte 4 stores and Svelte 5 `$store` interop.
 */
export const a11yEventStore = <E extends A11yEventName>(
  instance: A11yNowInstance,
  event: E,
): Readable<A11yEventMap[E] | undefined> =>
  readable<A11yEventMap[E] | undefined>(undefined, set =>
    instance.events.on(event, payload => {
      set(payload)
    }),
  )

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
