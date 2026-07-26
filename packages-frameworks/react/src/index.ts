import { createA11yNow } from '@a11y-now/core'
import type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
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
  /** Mount on first render, defaults to true. */
  autoMount?: boolean
  children?: ReactNode
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
 */
export const A11yNowProvider = ({
  autoMount = true,
  children,
  options,
}: A11yNowProviderProps): ReactElement => {
  const ref = useRef<A11yNowInstance | null>(null)
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
 */
export const useA11yNow = (): A11yNowInstance => {
  const instance = useContext(A11yNowContext)
  if (!instance) {
    throw new Error('[a11y-now] useA11yNow() requires <A11yNowProvider>')
  }
  return instance
}

/** Subscribe to an a11y-now event for the lifetime of the component. */
export const useA11yNowEvent = <
  E extends Parameters<A11yNowInstance['events']['on']>[0],
>(
  event: E,
  handler: Parameters<A11yNowInstance['events']['on']>[1],
): void => {
  const instance = useA11yNow()
  const saved = useRef(handler)
  saved.current = handler
  useEffect(
    () => instance.events.on(event, payload => saved.current(payload)),
    [event, instance],
  )
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
