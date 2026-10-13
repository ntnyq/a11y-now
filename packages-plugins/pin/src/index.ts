import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface PinApi {
  /**
   * Check whether the toolbar currently reserves space on the page.
   *
   * @returns `true` when toolbar pinning is enabled.
   */
  isPinned: () => boolean
  /**
   * Toggle and persist toolbar pinning and update reserved page space.
   */
  toggle: () => void
}

interface PinState {
  /**
   * Whether the toolbar reserves space above page content.
   *
   * @default true
   */
  pinned: boolean
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: boolean
}

/**
 * Inline SVG for the pin toolbar button.
 */
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
  setup(ctx) {
    let disposeStyle: (() => void) | null = null

    function isPinned(): boolean {
      return ctx.state.get('pinned')
    }
    function describe(): string {
      return ctx.i18n.t(isPinned() ? 'pin.on' : 'pin.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'l' }),
      })
    }

    function apply(pinned: boolean): void {
      if (pinned) {
        const measured = button.el
          .closest('.toolbar')
          ?.getBoundingClientRect().height
        const height = measured
          ? `${measured}px`
          : ctx.theme.getToken('toolbar-height')
        disposeStyle = ctx.dom.injectStyle(
          'pin',
          `body { padding-block-start: ${height} !important; } ` +
            `html { scroll-padding-block-start: ${height}; }`,
        )
      } else {
        disposeStyle?.()
        disposeStyle = null
      }
    }

    function toggle(): void {
      const next = !isPinned()
      ctx.state.set('pinned', next)
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

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (isPinned()) {
              apply(true)
            }
          })
        : null
    const toolbar = button.el.closest('.toolbar')
    if (toolbar) {
      observer?.observe(toolbar)
    }
    if (isPinned()) {
      apply(true)
    }

    const stopState = ctx.state.subscribe(key => {
      if (key === 'pinned') {
        apply(isPinned())
        button.update({ description: describe, pressed: isPinned() })
      }
    })

    return {
      api: { isPinned, toggle },
      dispose() {
        stopState()
        observer?.disconnect()
        unregister()
        button.remove()
        disposeStyle?.()
      },
    }
  },
  state: { pinned: true },
})

/**
 * Toolbar pin plugin: reserve page space for the toolbar. `Ctrl+Alt+L`.
 *
 * @returns A configured toolbar pin plugin for toolbar registration.
 */
export function pin(): ConfiguredPlugin<undefined, PinApi, PinState> {
  return configurePlugin(pinPlugin)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the pin plugin after activation.
     */
    pin: PinApi
  }
}
