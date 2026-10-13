import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ScreenReaderApi {
  /**
   * Check whether screen-reader mode is enabled.
   *
   * @returns `true` when screen-reader mode is enabled.
   */
  isEnabled: () => boolean
  /**
   * Toggle and persist screen-reader mode, updating its page effects.
   */
  toggle: () => void
}

interface ScreenReaderState {
  /**
   * Whether screen-reader mode hides visual controls and mutes speech.
   *
   * @default false
   */
  enabled: boolean
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: boolean
}

/**
 * Inline SVG for the screen-reader toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4.4 0 8 1.8 8 4v2H4v-2c0-2.2 3.6-4 8-4Z"/></svg>'

const screenReaderPlugin = definePlugin<
  undefined,
  ScreenReaderApi,
  ScreenReaderState
>({
  messages: {
    'en-US': {
      'sr.desc':
        'Screen reader mode {shortcut}: optimized for NVDA/VoiceOver users; ' +
        'self-voicing is muted and visual aids are hidden',
      'sr.label': 'Screen reader',
      'sr.off': 'Screen reader mode disabled',
      'sr.on': 'Screen reader mode enabled',
    },
    'zh-CN': {
      'sr.desc':
        '读屏专用 {shortcut}：适用于使用读屏软件的用户，' +
        '开启后自朗读静默、视觉辅助按钮隐藏',
      'sr.label': '读屏专用',
      'sr.off': '读屏专用模式已关闭',
      'sr.on': '读屏专用模式已开启',
    },
  },
  name: 'screen-reader',
  setup(ctx) {
    function isEnabled(): boolean {
      return ctx.state.get('enabled')
    }

    function apply(enabled: boolean): void {
      ctx.speech.setMuted(enabled)
      if (enabled) {
        ctx.dom.addPageClass('a11y-screen-reader')
      } else {
        ctx.dom.removePageClass('a11y-screen-reader')
      }
      ctx.events.emit('screen-reader:change', { enabled })
    }

    function toggle(): void {
      const next = !isEnabled()
      ctx.state.set('enabled', next)
      ctx.ui.announce(ctx.i18n.t(next ? 'sr.on' : 'sr.off'))
    }

    const button = ctx.ui.addItem({
      description: () =>
        ctx.i18n.t('sr.desc', {
          shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'r' }),
        }),
      group: 'tool',
      icon: ICON,
      id: 'screen-reader',
      label: () => ctx.i18n.t('sr.label'),
      onPress: toggle,
      order: 10,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('sr.label'),
      handler: toggle,
      id: 'screen-reader',
      key: 'r',
    })

    if (isEnabled()) {
      apply(true)
    }

    const stopState = ctx.state.subscribe(key => {
      if (key === 'enabled') {
        apply(isEnabled())
        button.update({ pressed: isEnabled() })
      }
    })

    return {
      api: { isEnabled, toggle },
      dispose() {
        stopState()
        if (isEnabled()) {
          ctx.speech.setMuted(false)
        }
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

/**
 * Screen-reader mode plugin. `Ctrl+Alt+R`.
 *
 * @returns A configured screen-reader mode plugin for toolbar registration.
 */
export function screenReader(): ConfiguredPlugin<
  undefined,
  ScreenReaderApi,
  ScreenReaderState
> {
  return configurePlugin(screenReaderPlugin)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the screen-reader plugin after activation.
     */
    'screen-reader': ScreenReaderApi
  }
}
