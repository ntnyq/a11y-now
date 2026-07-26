import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface PinApi {
  isPinned: () => boolean
  toggle: () => void
}

interface PinState {
  pinned: boolean
  [key: string]: boolean
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M14 2l8 8-3 1-4 4 1 5-3 1-4-6-5 5-1.5-1.5 5-5-6-4 1-3 5 1 4-4 1-3Z"/></svg>'

const pinPlugin = definePlugin<undefined, PinApi, PinState>({
  messages: {
    'en-US': {
      'pin.label': 'Pin',
      'pin.off': 'Toolbar unpinned (overlays the page), pin with {shortcut}',
      'pin.on': 'Toolbar pinned (page shifts down), unpin with {shortcut}',
    },
    'zh-CN': {
      'pin.label': '固定',
      'pin.off': '工具栏已取消固定（悬浮于页面上方），固定请按 {shortcut}',
      'pin.on': '工具栏已固定（页面整体下移让位），取消请按 {shortcut}',
    },
  },
  name: 'pin',
  setup: ctx => {
    let disposeStyle: (() => void) | null = null

    const isPinned = (): boolean => ctx.state.get('pinned')
    const describe = (): string =>
      ctx.i18n.t(isPinned() ? 'pin.on' : 'pin.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'l' }),
      })

    const apply = (pinned: boolean): void => {
      if (pinned) {
        const height = ctx.theme.getToken('toolbar-height')
        disposeStyle = ctx.dom.injectStyle(
          'pin',
          `body { padding-block-start: ${height} !important; } `
          + `html { scroll-padding-block-start: ${height}; }`,
        )
      } else {
        disposeStyle?.()
        disposeStyle = null
      }
    }

    const toggle = (): void => {
      const next = !isPinned()
      ctx.state.set('pinned', next)
      apply(next)
      button.update({ description: describe, pressed: next })
      ctx.ui.announce(describe())
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'system',
      icon: ICON,
      id: 'pin',
      label: () => ctx.i18n.t('pin.label'),
      onPress: toggle,
      order: 20,
      pressed: isPinned(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('pin.label'),
      handler: toggle,
      id: 'pin',
      key: 'l',
    })

    if (isPinned()) {
      apply(true)
    }

    return {
      api: { isPinned, toggle },
      dispose: () => {
        unregister()
        button.remove()
        disposeStyle?.()
      },
    }
  },
  state: { pinned: true },
})

/** Toolbar pin plugin: reserve page space for the toolbar. `Ctrl+Alt+L`. */
export const pin = (): ConfiguredPlugin<undefined, PinApi, PinState> =>
  configurePlugin(pinPlugin, undefined)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    pin: PinApi
  }
}
