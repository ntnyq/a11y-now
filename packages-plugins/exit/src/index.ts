import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ExitApi {
  /**
   * Persist the exit choice and request toolbar unmounting.
   */
  exit: () => void
}

interface ExitState {
  /**
   * Whether the user exited the toolbar in this state scope.
   *
   * @default false
   */
  disabled: boolean
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: boolean
}

/**
 * Inline SVG for the exit toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M10 3h4v2h-4V3ZM5 5h2v14H5V5Zm12 0h2v14h-2V5Zm-7 4l-4 3 4 3v-2h6v-2h-6V9Z"/></svg>'

const exitPlugin = definePlugin<undefined, ExitApi, ExitState>({
  messages: {
    'en-US': {
      'exit.desc': 'Exit the accessibility toolbar, {shortcut}',
      'exit.label': 'Exit',
    },
    'zh-CN': {
      'exit.desc': '退出无障碍服务，{shortcut}',
      'exit.label': '退出服务',
    },
  },
  name: 'exit',
  setup(ctx) {
    function exitToolbar(): void {
      // Persisted so integrators can honor the user's choice on next visit
      // (see the `wasExited` helper in the aggregate package).
      ctx.state.set('disabled', true)
      ctx.events.emit('a11y:exit', {})
    }

    const button = ctx.ui.addItem({
      description: () =>
        ctx.i18n.t('exit.desc', {
          shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'e' }),
        }),
      group: 'system',
      icon: ICON,
      id: 'exit',
      label: () => ctx.i18n.t('exit.label'),
      onPress: exitToolbar,
      order: 40,
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('exit.label'),
      handler: exitToolbar,
      id: 'exit',
      key: 'e',
    })

    // Mounting again means the user re-enabled the toolbar.
    ctx.state.set('disabled', false)

    return {
      api: { exit: exitToolbar },
      dispose() {
        unregister()
        button.remove()
      },
    }
  },
  state: { disabled: false },
})

/**
 * Exit plugin: unmounts the toolbar and remembers the choice. `Ctrl+Alt+E`.
 *
 * @returns A configured exit plugin for toolbar registration.
 */
export function exit(): ConfiguredPlugin<undefined, ExitApi, ExitState> {
  return configurePlugin(exitPlugin)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the exit plugin after activation.
     */
    exit: ExitApi
  }
}
