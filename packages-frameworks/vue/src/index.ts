import { createA11yNow } from '@a11y-now/core'
import {
  type App,
  inject,
  type InjectionKey,
  onScopeDispose,
  type Plugin,
} from 'vue'
import type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'

export const A11Y_NOW_KEY: InjectionKey<A11yNowInstance> =
  Symbol.for('a11y-now')

export interface A11yNowVueOptions extends A11yNowOptions {
  /** Mount on install, defaults to true. */
  autoMount?: boolean
}

/**
 * Vue 3 plugin.
 *
 * ```ts
 * import { A11yNowPlugin } from '@a11y-now/vue'
 * app.use(A11yNowPlugin, { plugins: [zoom()], themes: [deepBlue] })
 * ```
 */
export const A11yNowPlugin: Plugin<[A11yNowVueOptions?]> = {
  install: (app: App, options: A11yNowVueOptions = {}) => {
    const { autoMount = true, ...rest } = options
    const instance = createA11yNow(rest)
    app.provide(A11Y_NOW_KEY, instance)
    app.config.globalProperties.$a11yNow = instance
    if (autoMount) {
      instance.mount()
    }
    const { unmount } = app
    app.unmount = () => {
      instance.destroy()
      unmount.call(app)
    }
  },
}

/**
 * Composable access to the toolbar instance.
 *
 * ```ts
 * const a11y = useA11yNow()
 * a11y.getPlugin('zoom')?.zoomIn()
 * ```
 */
export const useA11yNow = (): A11yNowInstance => {
  const instance = inject(A11Y_NOW_KEY)
  if (!instance) {
    throw new Error(
      '[a11y-now] useA11yNow() requires app.use(A11yNowPlugin) first',
    )
  }
  return instance
}

/**
 * Subscribe to an a11y-now event, auto-disposed with the current scope.
 */
export const useA11yNowEvent = <
  E extends Parameters<A11yNowInstance['events']['on']>[0],
>(
  event: E,
  handler: Parameters<A11yNowInstance['events']['on']>[1],
): void => {
  const instance = useA11yNow()
  const stop = instance.events.on(event, handler)
  onScopeDispose(stop)
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $a11yNow: A11yNowInstance
  }
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
