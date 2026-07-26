import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'
import { pinyin } from 'pinyin-pro'

export interface PinyinOptions {
  /** Max Han characters annotated per pass, defaults to 10000. 0 = unlimited. */
  limit?: number
  /**
   * Annotation root selector. Defaults to `main, article, [role="main"]`,
   * falling back to `<body>`.
   */
  root?: string
}

export interface PinyinApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface PinyinState {
  enabled: boolean
  [key: string]: boolean
}

const HAN_RE = /\p{Script=Han}/u
const SKIP_SELECTOR =
  'script, style, noscript, textarea, ruby, code, pre, [data-a11y-skip]'
const DEFAULT_LIMIT = 10_000

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12.45 16h2.09L9.43 3H7.57L2.46 16h2.09l1.12-3h5.64l1.14 3Zm-6.02-5L8.5 5.48 10.57 11H6.43Zm15.16.59-8.09 8.09L9.83 16l-1.41 1.41 5.09 5.09L23 13l-1.41-1.41Z"/></svg>'

const pinyinPlugin = definePlugin<PinyinOptions, PinyinApi, PinyinState>({
  messages: {
    'en-US': {
      'pinyin.label': 'Pinyin',
      'pinyin.off': 'Pinyin annotation is off, enable with {shortcut}',
      'pinyin.on': 'Pinyin annotation is on, disable with {shortcut}',
    },
    'zh-CN': {
      'pinyin.label': '拼音标注',
      'pinyin.off': '当前拼音标注已关闭，开启拼音标注请按 {shortcut}',
      'pinyin.on': '当前拼音标注已开启，关闭拼音标注请按 {shortcut}',
    },
  },
  name: 'pinyin',
  setup: ctx => {
    const limit = ctx.options.limit ?? DEFAULT_LIMIT
    /** Inserted wrapper → the text node it replaced, for exact reverts. */
    const originals = new Map<HTMLElement, Text>()

    const resolveRoot = (): Element =>
      (ctx.options.root ? document.querySelector(ctx.options.root) : null) ??
      document.querySelector('main, article, [role="main"]') ??
      document.body

    const annotate = (): void => {
      const walker = document.createTreeWalker(
        resolveRoot(),
        NodeFilter.SHOW_TEXT,
      )
      // Collect first: replacing nodes mid-walk would break the walker.
      const targets: Text[] = []
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text
        if (
          HAN_RE.test(text.data) &&
          !text.parentElement?.closest(SKIP_SELECTOR)
        ) {
          targets.push(text)
        }
      }
      let budget = limit > 0 ? limit : Number.POSITIVE_INFINITY
      for (const text of targets) {
        if (budget <= 0) {
          break
        }
        const tokens = pinyin(text.data, { type: 'all' })
        // Fidelity first: only annotate when tokens reproduce the text.
        if (tokens.map(token => token.origin).join('') === text.data) {
          const wrapper = document.createElement('span')
          wrapper.dataset['a11yPinyin'] = 'true'
          for (const token of tokens) {
            if (token.isZh && token.pinyin) {
              const ruby = document.createElement('ruby')
              ruby.append(token.origin)
              const rt = document.createElement('rt')
              // Screen readers would read the base and the annotation twice.
              rt.setAttribute('aria-hidden', 'true')
              rt.textContent = token.pinyin
              ruby.append(rt)
              wrapper.append(ruby)
              budget -= token.origin.length
            } else {
              wrapper.append(token.origin)
            }
          }
          originals.set(wrapper, text)
          text.replaceWith(wrapper)
        }
      }
    }

    const revert = (): void => {
      for (const [wrapper, original] of originals) {
        if (wrapper.isConnected) {
          wrapper.replaceWith(original)
        }
      }
      originals.clear()
    }

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'pinyin.on' : 'pinyin.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'p' }),
      })

    const apply = (enabled: boolean): void => {
      if (enabled) {
        annotate()
      } else {
        revert()
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
      id: 'pinyin',
      label: () => ctx.i18n.t('pinyin.label'),
      onPress: toggle,
      order: 46,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('pinyin.label'),
      handler: toggle,
      id: 'pinyin',
      key: 'p',
    })

    if (isEnabled()) {
      apply(true)
    }

    return {
      api: { isEnabled, toggle },
      dispose: () => {
        revert()
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: false },
})

/**
 * Pinyin ruby annotation plugin (拼音标注), powered by `pinyin-pro`.
 * `Ctrl+Alt+P` toggles `<ruby>` pinyin above Han characters in the main
 * content; disabling restores the original text nodes exactly.
 */
export const pinyinAnnotation = (
  options: PinyinOptions = {},
): ConfiguredPlugin<PinyinOptions, PinyinApi, PinyinState> =>
  configurePlugin(pinyinPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    pinyin: PinyinApi
  }
}
