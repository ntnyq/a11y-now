import { configurePlugin, definePlugin, pageVar } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface CrosshairOptions {
  /** Line thickness in px, defaults to 2. */
  thickness?: number
}

export interface CrosshairApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface CrosshairState {
  enabled: boolean
  [key: string]: boolean
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9V2Z"/></svg>'

const crosshairPlugin = definePlugin<
  CrosshairOptions | undefined,
  CrosshairApi,
  CrosshairState
>({
  messages: {
    'en-US': {
      'crosshair.label': 'Crosshair',
      'crosshair.off': 'Crosshair is off, enable with {shortcut}',
      'crosshair.on': 'Crosshair is on, disable with {shortcut}',
    },
    'zh-CN': {
      'crosshair.label': '十字线',
      'crosshair.off': '当前十字线已关闭，开启十字线 {shortcut}',
      'crosshair.on': '当前十字线已开启，关闭十字线 {shortcut}',
    },
  },
  name: 'crosshair',
  setup: ctx => {
    const thickness = ctx.options?.thickness ?? 2
    let horizontal: HTMLElement | null = null
    let vertical: HTMLElement | null = null
    let frame = 0

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'crosshair.on' : 'crosshair.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'n' }),
      })

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null

    const lineStyle = (el: HTMLElement, axis: 'x' | 'y'): void => {
      el.style.position = 'fixed'
      el.style.pointerEvents = 'none'
      el.style.zIndex = 'var(--a11y-z-index, 2147483000)'
      el.style.background = `var(${pageVar('cursor-color')}, #ffd700)`
      if (axis === 'x') {
        el.style.insetInline = '0'
        el.style.blockSize = `${thickness}px`
      } else {
        el.style.insetBlock = '0'
        el.style.inlineSize = `${thickness}px`
      }
    }

    const onMove = (event: MouseEvent): void => {
      if (frame) {
        return
      }
      frame = requestAnimationFrame(() => {
        frame = 0
        if (horizontal) {
          horizontal.style.insetBlockStart = `${event.clientY}px`
        }
        if (vertical) {
          vertical.style.insetInlineStart = `${event.clientX}px`
        }
      })
    }

    const apply = (enabled: boolean): void => {
      if (enabled && shadow) {
        horizontal = document.createElement('div')
        vertical = document.createElement('div')
        lineStyle(horizontal, 'x')
        lineStyle(vertical, 'y')
        shadow.append(horizontal, vertical)
        window.addEventListener('mousemove', onMove)
      } else {
        window.removeEventListener('mousemove', onMove)
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
        horizontal?.remove()
        vertical?.remove()
        horizontal = null
        vertical = null
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
      id: 'crosshair',
      label: () => ctx.i18n.t('crosshair.label'),
      onPress: toggle,
      order: 51,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('crosshair.label'),
      handler: toggle,
      id: 'crosshair',
      key: 'n',
    })

    if (isEnabled()) {
      apply(true)
    }

    return {
      api: { isEnabled, toggle },
      dispose: () => {
        apply(false)
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

/** Reading crosshair plugin. `Ctrl+Alt+N`. */
export const crosshair = (
  options?: CrosshairOptions,
): ConfiguredPlugin<CrosshairOptions | undefined, CrosshairApi, CrosshairState> =>
  configurePlugin(crosshairPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    crosshair: CrosshairApi
  }
}
