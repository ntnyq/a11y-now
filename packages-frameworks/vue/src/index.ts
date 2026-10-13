import { createA11yNow } from '@a11y-now/core'
import type {
  A11yEventMap,
  A11yEventName,
  A11yNowInstance,
  A11yNowOptions,
} from '@a11y-now/types'
import { inject, onScopeDispose } from 'vue'
import type { App, InjectionKey, Plugin } from 'vue'

/**
 * Vue injection key shared by the toolbar plugin and composables.
 */
export const A11Y_NOW_KEY: InjectionKey<A11yNowInstance> =
  Symbol.for('a11y-now')

export interface A11yNowVueOptions extends A11yNowOptions {
  /**
   * Mount after the Vue application renders, defaults to true.
   *
   * @default true
   */
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
  /**
   * Install and provide a toolbar instance for a Vue application.
   *
   * @param app - Vue application receiving the instance and unmount cleanup.
   * @param options - Toolbar options; `autoMount` defaults to `true`.
   */
  install(app: App, options: A11yNowVueOptions = {}) {
    const { autoMount = true, ...rest } = options
    const instance = createA11yNow(rest)
    app.provide(A11Y_NOW_KEY, instance)
    app.config.globalProperties.$a11yNow = instance
    const { mount, unmount } = app
    app.mount = (...args) => {
      const root = mount.apply(app, args)
      if (autoMount) {
        instance.mount()
      }
      return root
    }
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
 *
 * @returns The toolbar instance provided by the enclosing framework context.
 * @throws {Error} If no toolbar instance has been provided.
 */
export function useA11yNow(): A11yNowInstance {
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
  const stop = instance.events.on(event, handler)
  onScopeDispose(stop)
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /**
     * Toolbar instance installed on the current Vue application.
     */
    $a11yNow: A11yNowInstance
  }
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
