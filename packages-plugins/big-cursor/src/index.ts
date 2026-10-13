import {
  configurePlugin,
  DEFAULT_PAGE_TOKENS,
  definePlugin,
} from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface BigCursorOptions {
  /**
   * Cursor fill color; defaults to the `cursor-color` page token.
   *
   * @default DEFAULT_PAGE_TOKENS['cursor-color'] ('#ffd700').
   */
  color?: string
  /**
   * Cursor size in px, defaults to 48.
   *
   * @default 48
   */
  size?: number
}

export interface BigCursorApi {
  /**
   * Check whether the large cursor is enabled.
   *
   * @returns `true` when the large cursor is enabled.
   */
  isEnabled: () => boolean
  /**
   * Toggle and persist the large cursor, updating its page effects.
   */
  toggle: () => void
}

interface BigCursorState {
  /**
   * Whether the enlarged cursor is applied to the page.
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
 * Inline SVG for the big-cursor toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M4 2l16 7.6-6.8 1.9 4.3 7.4-2.6 1.5-4.3-7.4L6 18.2 4 2Z"/></svg>'

function cursorSvg(color: string, size: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">` +
    `<path d="M4 2l16 7.6-6.8 1.9 4.3 7.4-2.6 1.5-4.3-7.4L6 18.2 4 2Z" ` +
    `fill="${color}" stroke="#000" stroke-width="1"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 2, auto`
}

const bigCursorPlugin = definePlugin<
  BigCursorOptions,
  BigCursorApi,
  BigCursorState
>({
  messages: {
    'en-US': {
      'cursor.label': 'Cursor',
      'cursor.off': 'Big cursor is off, enable with {shortcut}',
      'cursor.on': 'Big cursor is on, disable with {shortcut}',
    },
    'zh-CN': {
      'cursor.label': '鼠标样式',
      'cursor.off': '当前大鼠标已关闭，开启大鼠标 {shortcut}',
      'cursor.on': '当前大鼠标已开启，关闭大鼠标 {shortcut}',
    },
  },
  name: 'big-cursor',
  setup(ctx) {
    const size = ctx.options.size ?? 48
    const color = ctx.options.color ?? DEFAULT_PAGE_TOKENS['cursor-color']
    let disposeStyle: (() => void) | null = null

    function isEnabled(): boolean {
      return ctx.state.get('enabled')
    }
    function describe(): string {
      return ctx.i18n.t(isEnabled() ? 'cursor.on' : 'cursor.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'm' }),
      })
    }

    function apply(enabled: boolean): void {
      if (enabled) {
        disposeStyle = ctx.dom.injectStyle(
          'big-cursor',
          `body, body * { cursor: ${cursorSvg(color, size)} !important; }`,
        )
      } else {
        disposeStyle?.()
        disposeStyle = null
      }
    }

    function toggle(): void {
      const next = !isEnabled()
      ctx.state.set('enabled', next)
      ctx.ui.announce(describe())
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON,
      id: 'big-cursor',
      label: () => ctx.i18n.t('cursor.label'),
      onPress: toggle,
      order: 50,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('cursor.label'),
      handler: toggle,
      id: 'big-cursor',
      key: 'm',
    })

    if (isEnabled()) {
      apply(true)
    }

    const stopState = ctx.state.subscribe(key => {
      if (key === 'enabled') {
        apply(isEnabled())
        button.update({ description: describe, pressed: isEnabled() })
      }
    })

    return {
      api: { isEnabled, toggle },
      dispose() {
        stopState()
        unregister()
        button.remove()
        disposeStyle?.()
      },
    }
  },
  state: { enabled: false },
})

/**
 * Big mouse cursor plugin. `Ctrl+Alt+M`.
 *
 * @param options - Cursor color and size overrides; omitted fields use plugin
 *   defaults.
 * @returns A configured large cursor plugin for toolbar registration.
 */
export function bigCursor(
  options: BigCursorOptions = {},
): ConfiguredPlugin<BigCursorOptions, BigCursorApi, BigCursorState> {
  return configurePlugin(bigCursorPlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the big-cursor plugin after activation.
     */
    'big-cursor': BigCursorApi
  }
}
