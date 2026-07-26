import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'
import { Converter as createConverter } from 'opencc-js'

/** OpenCC locale presets: cn 简体, tw/twp 台繁, hk 港繁, t 通用繁, jp 日新字体. */
export type OpenCCLocale = 'cn' | 'hk' | 'jp' | 't' | 'tw' | 'twp'

export interface ZhConvertOptions {
  /** Custom text converter; overrides the OpenCC-based default. */
  convert?: (text: string) => string
  /** Source locale, defaults to `cn` (simplified). */
  from?: OpenCCLocale
  /** Target locale, defaults to `tw` (traditional). */
  to?: OpenCCLocale
  /** Convert dynamically inserted or changed text too, defaults to true. */
  watch?: boolean
}

export interface ZhConvertApi {
  isEnabled: () => boolean
  toggle: () => void
}

interface ZhConvertState {
  enabled: boolean
  [key: string]: boolean
}

const HAN_RE = /\p{Script=Han}/u
const SKIP_SELECTOR =
  'script, style, noscript, textarea, code, pre, [data-a11y-skip]'

const ICON =
  '<svg viewBox="0 0 24 24"><path d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04ZM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12Zm-2.62 7 1.62-4.33L19.12 17h-3.24Z"/></svg>'

const zhConvertPlugin = definePlugin<
  ZhConvertOptions,
  ZhConvertApi,
  ZhConvertState
>({
  messages: {
    'en-US': {
      'zh-convert.label': 'Traditional',
      'zh-convert.off':
        'Chinese conversion is off, showing the original text; enable with {shortcut}',
      'zh-convert.on': 'Chinese conversion is on, disable with {shortcut}',
    },
    'zh-CN': {
      'zh-convert.label': '简繁转换',
      'zh-convert.off': '当前显示原文，开启简繁转换请按 {shortcut}',
      'zh-convert.on': '当前简繁转换已开启，恢复原文请按 {shortcut}',
    },
  },
  name: 'zh-convert',
  setup: ctx => {
    const from = ctx.options.from ?? 'cn'
    const to = ctx.options.to ?? 'tw'
    const watch = ctx.options.watch ?? true
    let convert: ((text: string) => string) | null = ctx.options.convert ?? null
    /** Converted text nodes with their originals, for exact reverts. */
    const records = new Map<Text, { converted: string; original: string }>()
    let observer: MutationObserver | null = null

    // Building the OpenCC dictionary has a cost — do it on first enable.
    const ensureConverter = (): ((text: string) => string) => {
      convert ??= createConverter({ from, to })
      return convert
    }

    const convertNode = (text: Text): void => {
      if (!HAN_RE.test(text.data)) {
        return
      }
      if (text.parentElement?.closest(SKIP_SELECTOR)) {
        return
      }
      const entry = records.get(text)
      if (entry && entry.converted === text.data) {
        // Our own write echoed back through the observer.
        return
      }
      const original = text.data
      const converted = ensureConverter()(original)
      if (converted === original) {
        return
      }
      records.set(text, { converted, original })
      text.data = converted
    }

    const walk = (root: Node): void => {
      if (root.nodeType === Node.TEXT_NODE) {
        convertNode(root as Text)
        return
      }
      if (root.nodeType !== Node.ELEMENT_NODE) {
        return
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const targets: Text[] = []
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        targets.push(node as Text)
      }
      for (const target of targets) {
        convertNode(target)
      }
    }

    const apply = (enabled: boolean): void => {
      if (enabled) {
        walk(document.body)
        if (watch && typeof MutationObserver === 'function' && !observer) {
          observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
              if (
                mutation.type === 'characterData' &&
                mutation.target.nodeType === Node.TEXT_NODE
              ) {
                convertNode(mutation.target as Text)
              }
              for (const added of mutation.addedNodes) {
                walk(added)
              }
            }
          })
          observer.observe(document.body, {
            characterData: true,
            childList: true,
            subtree: true,
          })
        }
      } else {
        observer?.disconnect()
        observer = null
        for (const [text, entry] of records) {
          // Restore only untouched conversions; newer page writes win.
          if (text.isConnected && text.data === entry.converted) {
            text.data = entry.original
          }
        }
        records.clear()
      }
    }

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'zh-convert.on' : 'zh-convert.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'j' }),
      })

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
      id: 'zh-convert',
      label: () => ctx.i18n.t('zh-convert.label'),
      onPress: toggle,
      order: 47,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('zh-convert.label'),
      handler: toggle,
      id: 'zh-convert',
      key: 'j',
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
 * Simplified/traditional Chinese conversion plugin (简繁转换), powered by
 * `opencc-js`. `Ctrl+Alt+J` converts visible page text (default 简→台繁);
 * disabling restores the original text exactly. Attribute text such as
 * `aria-label` or `title` is left untouched.
 */
export const zhConvert = (
  options: ZhConvertOptions = {},
): ConfiguredPlugin<ZhConvertOptions, ZhConvertApi, ZhConvertState> =>
  configurePlugin(zhConvertPlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'zh-convert': ZhConvertApi
  }
}
