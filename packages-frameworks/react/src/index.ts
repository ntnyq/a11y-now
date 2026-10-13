import { createA11yNow } from '@a11y-now/core'
import type {
  A11yEventMap,
  A11yEventName,
  A11yNowInstance,
  A11yNowOptions,
} from '@a11y-now/types'
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
} from 'react'
import type { ReactElement, ReactNode } from 'react'

const A11yNowContext = createContext<A11yNowInstance | null>(null)

export interface A11yNowProviderProps {
  /**
   * Mount on first render, defaults to true.
   *
   * @default true
   */
  autoMount?: boolean
  /**
   * Descendants receiving the toolbar instance through React context.
   */
  children?: ReactNode
  /**
   * Toolbar configuration used when the provider creates its instance.
   *
   * @default {}
   */
  options?: A11yNowOptions
}

/**
 * React provider.
 *
 * ```tsx
 * <A11yNowProvider options={{ plugins: [zoom()], themes: [deepBlue] }}>
 *   <App />
 * </A11yNowProvider>
 * ```
 *
 * @param props - React provider configuration.
 * @param props.autoMount - Whether to mount in an effect; defaults to `true`.
 * @param props.children - Descendants receiving the toolbar context.
 * @param props.options - Toolbar options used when the instance is first
 *   created.
 * @returns A React context provider wrapping the supplied children.
 */
export function A11yNowProvider({
  autoMount = true,
  children,
  options,
}: A11yNowProviderProps): ReactElement {
  const ref = useRef<A11yNowInstance | null>(null)
  // Kernel construction does not subscribe to browser events. Mount/unmount
  // owns those resources, including StrictMode replay and abandoned renders.
  ref.current ??= createA11yNow(options)

  useEffect(() => {
    const instance = ref.current
    if (autoMount && instance && !instance.mounted) {
      instance.mount()
    }
    return () => {
      instance?.unmount()
    }
  }, [autoMount])

  return createElement(
    A11yNowContext.Provider,
    { value: ref.current },
    children,
  )
}

/**
 * Hook access to the toolbar instance.
 *
 * ```tsx
 * const a11y = useA11yNow()
 * a11y.getPlugin('zoom')?.zoomIn()
 * ```
 *
 * @returns The toolbar instance provided by the enclosing framework context.
 * @throws {Error} If no toolbar instance has been provided.
 */
export function useA11yNow(): A11yNowInstance {
  const instance = useContext(A11yNowContext)
  if (!instance) {
    throw new Error('[a11y-now] useA11yNow() requires <A11yNowProvider>')
  }
  return instance
}

/**
 * Subscribe to an a11y-now event for the lifetime of the component.
 *
 * @template E - Event name accepted by the toolbar event bus.
 * @param event - Name of the toolbar event to observe.
 * @param handler - Callback invoked with each emitted payload.
 * @throws {Error} If no toolbar instance has been provided.
 */
export function useA11yNowEvent<E extends A11yEventName>(
  event: E,
  handler: (payload: A11yEventMap[E]) => void,
): void {
  const instance = useA11yNow()
  const saved = useRef(handler)
  saved.current = handler
  useEffect(
    () => instance.events.on(event, payload => saved.current(payload)),
    [event, instance],
  )
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
