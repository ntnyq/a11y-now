import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface CaptionApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface CaptionState {
  enabled: boolean
  [key: string]: boolean
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 5v2h6v-2H6Zm8 0v2h4v-2h-4ZM6 14v2h4v-2H6Zm6 0v2h6v-2h-6Z"/></svg>'

const captionPlugin = definePlugin<undefined, CaptionApi, CaptionState>({
  messages: {
    'en-US': {
      'caption.label': 'Caption',
      'caption.off': 'Big caption is off, enable with {shortcut}',
      'caption.on': 'Big caption is on, disable with {shortcut}',
    },
    'zh-CN': {
      'caption.label': '大字幕',
      'caption.off': '当前大字幕已关闭，开启大字幕请按 {shortcut}',
      'caption.on': '当前大字幕已开启，关闭大字幕请按 {shortcut}',
    },
  },
  name: 'caption',
  setup: ctx => {
    let bar: HTMLElement | null = null
    let stopSpeechEvents: (() => void) | null = null

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'caption.on' : 'caption.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'b' }),
      })

    const apply = (enabled: boolean): void => {
      if (enabled && shadow) {
        bar = document.createElement('div')
        bar.dataset['a11yCaption'] = 'true'
        bar.setAttribute('role', 'status')
        const { style } = bar
        style.position = 'fixed'
        style.insetBlockEnd = '0'
        style.insetInline = '0'
        style.minBlockSize = '80px'
        style.padding = '12px 24px'
        style.background = 'var(--a11y-color-fg)'
        style.color = 'var(--a11y-color-bg)'
        style.fontSize = 'var(--a11y-font-size-caption)'
        style.lineHeight = '1.4'
        style.zIndex = 'var(--a11y-z-index)'
        shadow.append(bar)
        stopSpeechEvents = ctx.events.on('speech:speak', ({ text }) => {
          if (bar) {
            bar.textContent = text
          }
        })
      } else {
        stopSpeechEvents?.()
        stopSpeechEvents = null
        bar?.remove()
        bar = null
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
      icon: ICON,
      id: 'caption',
      label: () => ctx.i18n.t('caption.label'),
      onPress: toggle,
      order: 60,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('caption.label'),
      handler: toggle,
      id: 'caption',
      key: 'b',
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

/** Big caption bar plugin: mirrors spoken text at the bottom. `Ctrl+Alt+B`. */
export const caption = (): ConfiguredPlugin<
  undefined,
  CaptionApi,
  CaptionState
> => configurePlugin(captionPlugin)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    caption: CaptionApi
  }
}
