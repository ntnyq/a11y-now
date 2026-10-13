import type { PluginContext } from '@a11y-now/types'

/**
 * Track context subscriptions, including those made before setup throws.
 * Explicit unsubscribe releases the tracked callback immediately.
 */
export function createPluginScope(context: PluginContext<unknown>): {
  context: PluginContext<unknown>
  dispose: () => void
} {
  const subscriptions = new Set<() => void>()
  const { events, shortcuts, state } = context

  function track(stop: () => void): () => void {
    function dispose(): void {
      if (subscriptions.delete(dispose)) {
        stop()
      }
    }
    subscriptions.add(dispose)
    return dispose
  }

  return {
    context: {
      ...context,
      events: {
        ...events,
        on: (event, handler) => track(events.on(event, handler)),
      },
      shortcuts: {
        ...shortcuts,
        register: def => track(shortcuts.register(def)),
      },
      state: {
        ...state,
        subscribe: handler => track(state.subscribe(handler)),
      },
    },
    dispose() {
      for (const stop of subscriptions) {
        stop()
      }
    },
  }
}
