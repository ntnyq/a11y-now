import { configurePlugin, DEFAULT_PAGE_TOKENS, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface BigCursorOptions {
  /** Cursor fill color; defaults to the `cursor-color` page token. */
  color?: string
  /** Cursor size in px, defaults to 48. */
  size?: number
}

export interface BigCursorApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface BigCursorState {
  enabled: boolean
  [key: string]: boolean
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M4 2l16 7.6-6.8 1.9 4.3 7.4-2.6 1.5-4.3-7.4L6 18.2 4 2Z"/></svg>'

const cursorSvg = (color: string, size: number): string => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">`
    + `<path d="M4 2l16 7.6-6.8 1.9 4.3 7.4-2.6 1.5-4.3-7.4L6 18.2 4 2Z" `
    + `fill="${color}" stroke="#000" stroke-width="1"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 2, auto`
}

const bigCursorPlugin = definePlugin<
  BigCursorOptions | undefined,
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
  setup: ctx => {
    const size = ctx.options?.size ?? 48
    const color = ctx.options?.color ?? DEFAULT_PAGE_TOKENS['cursor-color']
    let disposeStyle: (() => void) | null = null

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'cursor.on' : 'cursor.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'm' }),
      })

    const apply = (enabled: boolean): void => {
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

    const toggle = (): void => {
      const next = !isEnabled()
      ctx.state.set('enabled', next)
      apply(next)
      button.update({ description: describe, pressed: next })
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

    return {
      api: { isEnabled, toggle },
      dispose: () => {
        unregister()
        button.remove()
        disposeStyle?.()
      },
    }
  },
  state: { enabled: false },
})

/** Big mouse cursor plugin. `Ctrl+Alt+M`. */
export const bigCursor = (
  options?: BigCursorOptions,
): ConfiguredPlugin<BigCursorOptions | undefined, BigCursorApi, BigCursorState> =>
  configurePlugin(bigCursorPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'big-cursor': BigCursorApi
  }
}
