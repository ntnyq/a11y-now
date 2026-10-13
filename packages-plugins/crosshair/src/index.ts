import { configurePlugin, definePlugin, pageVar } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface CrosshairOptions {
  /**
   * Line thickness in px, defaults to 2.
   *
   * @default 2
   */
  thickness?: number
}

export interface CrosshairApi {
  /**
   * Check whether the reading crosshair is enabled.
   *
   * @returns `true` when the reading crosshair is enabled.
   */
  isEnabled: () => boolean
  /**
   * Toggle and persist the reading crosshair, updating its page effects.
   */
  toggle: () => void
}

interface CrosshairState {
  /**
   * Whether the reading crosshair is visible.
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
 * Inline SVG for the crosshair toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9V2Z"/></svg>'

const crosshairPlugin = definePlugin<
  CrosshairOptions,
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
  setup(ctx) {
    const thickness = ctx.options.thickness ?? 2
    let horizontal: HTMLElement | null = null
    let vertical: HTMLElement | null = null
    let frame = 0

    function isEnabled(): boolean {
      return ctx.state.get('enabled')
    }
    function describe(): string {
      return ctx.i18n.t(isEnabled() ? 'crosshair.on' : 'crosshair.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'n' }),
      })
    }

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null

    function lineStyle(el: HTMLElement, axis: 'x' | 'y'): void {
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

    function onMove(event: MouseEvent): void {
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

    function apply(enabled: boolean): void {
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
        apply(false)
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

/**
 * Reading crosshair plugin. `Ctrl+Alt+N`.
 *
 * @param options - Crosshair line thickness; omitted fields use plugin
 *   defaults.
 * @returns A configured reading crosshair plugin for toolbar registration.
 */
export function crosshair(
  options: CrosshairOptions = {},
): ConfiguredPlugin<CrosshairOptions, CrosshairApi, CrosshairState> {
  return configurePlugin(crosshairPlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the crosshair plugin after activation.
     */
    crosshair: CrosshairApi
  }
}
