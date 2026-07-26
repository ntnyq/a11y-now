import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ReadingMaskOptions {
  /** Height of the clear reading band in px, defaults to 120. */
  height?: number
  /** Mask color above/below the band, defaults to `rgba(0, 0, 0, 0.5)`. */
  color?: string
}

export interface ReadingMaskApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface ReadingMaskState {
  enabled: boolean
  [key: string]: boolean
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M2 4h20v5H2V4Zm0 11h20v5H2v-5Zm2-4h16v2H4v-2Z"/></svg>'

const readingMaskPlugin = definePlugin<
  ReadingMaskOptions,
  ReadingMaskApi,
  ReadingMaskState
>({
  messages: {
    'en-US': {
      'mask.label': 'Reading mask',
      'mask.off': 'Reading mask is off, enable with {shortcut}',
      'mask.on': 'Reading mask is on, disable with {shortcut}',
    },
    'zh-CN': {
      'mask.label': '阅读遮罩',
      'mask.off': '当前阅读遮罩已关闭，开启阅读遮罩 {shortcut}',
      'mask.on': '当前阅读遮罩已开启，关闭阅读遮罩 {shortcut}',
    },
  },
  name: 'reading-mask',
  setup: ctx => {
    const bandHeight = ctx.options.height ?? 120
    const color = ctx.options.color ?? 'rgba(0, 0, 0, 0.5)'
    let above: HTMLElement | null = null
    let below: HTMLElement | null = null
    let frame = 0

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'mask.on' : 'mask.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'g' }),
      })

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null

    const coverStyle = (el: HTMLElement): void => {
      el.style.position = 'fixed'
      el.style.insetInline = '0'
      el.style.pointerEvents = 'none'
      el.style.background = color
      el.style.zIndex = 'calc(var(--a11y-z-index, 2147483000) - 1)'
    }

    const place = (centerY: number): void => {
      const half = bandHeight / 2
      if (above) {
        above.style.insetBlockStart = '0'
        above.style.blockSize = `${Math.max(0, centerY - half)}px`
      }
      if (below) {
        below.style.insetBlockStart = `${centerY + half}px`
        below.style.insetBlockEnd = '0'
      }
    }

    const onMove = (event: MouseEvent): void => {
      if (frame) {
        return
      }
      frame = requestAnimationFrame(() => {
        frame = 0
        place(event.clientY)
      })
    }

    const apply = (enabled: boolean): void => {
      if (enabled && shadow) {
        above = document.createElement('div')
        below = document.createElement('div')
        coverStyle(above)
        coverStyle(below)
        shadow.append(above, below)
        place(window.innerHeight / 2)
        window.addEventListener('mousemove', onMove)
      } else {
        window.removeEventListener('mousemove', onMove)
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
        above?.remove()
        below?.remove()
        above = null
        below = null
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
      id: 'reading-mask',
      label: () => ctx.i18n.t('mask.label'),
      onPress: toggle,
      order: 52,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('mask.label'),
      handler: toggle,
      id: 'reading-mask',
      key: 'g',
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

/**
 * Reading mask plugin. `Ctrl+Alt+G` dims everything except a horizontal
 * band that follows the pointer, helping low-vision and dyslexic readers
 * keep their place on the line.
 */
export const readingMask = (
  options: ReadingMaskOptions = {},
): ConfiguredPlugin<ReadingMaskOptions, ReadingMaskApi, ReadingMaskState> =>
  configurePlugin(readingMaskPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'reading-mask': ReadingMaskApi
  }
}
