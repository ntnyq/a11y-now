import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ResetApi {
  reset: () => void
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 4V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-9Z"/></svg>'

const resetPlugin = definePlugin<undefined, ResetApi>({
  messages: {
    'en-US': {
      'reset.desc': 'Restore all settings to defaults, {shortcut}',
      'reset.done': 'All settings restored to defaults',
      'reset.label': 'Reset',
    },
    'zh-CN': {
      'reset.desc': '恢复全部设置为默认值，{shortcut}',
      'reset.done': '重置成功，全部设置已恢复默认',
      'reset.label': '重置',
    },
  },
  name: 'reset',
  setup: ctx => {
    const reset = (): void => {
      ctx.events.emit('a11y:reset', {})
      ctx.ui.announce(ctx.i18n.t('reset.done'))
    }

    const button = ctx.ui.addItem({
      description: () =>
        ctx.i18n.t('reset.desc', {
          shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'c' }),
        }),
      group: 'system',
      icon: ICON,
      id: 'reset',
      label: () => ctx.i18n.t('reset.label'),
      onPress: reset,
      order: 10,
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('reset.label'),
      handler: reset,
      id: 'reset',
      key: 'c',
    })

    return {
      api: { reset },
      dispose: () => {
        unregister()
        button.remove()
      },
    }
  },
})

/** Reset-everything plugin. `Ctrl+Alt+C`. */
export const reset = (): ConfiguredPlugin<undefined, ResetApi> =>
  configurePlugin(resetPlugin, undefined)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    reset: ResetApi
  }
}
