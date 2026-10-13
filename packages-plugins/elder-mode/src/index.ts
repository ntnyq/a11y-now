import { configurePlugin, css, definePlugin, pageVar } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface ElderModeOptions {
  /**
   * Line-height applied to text content, defaults to 1.6.
   *
   * @default 1.6
   */
  lineHeight?: number
  /**
   * Minimum font size in px enforced on text content, defaults to 18.
   *
   * @default 18
   */
  minFontSize?: number
}

export interface ElderModeApi {
  /**
   * Check whether elder mode typography is enabled.
   *
   * @returns `true` when elder mode typography is enabled.
   */
  isEnabled: () => boolean
  /**
   * Toggle and persist elder mode typography, updating its page effects.
   */
  toggle: () => void
}

interface ElderModeState {
  /**
   * Whether larger text and increased line height are applied.
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
 * Document class indicating that elder-mode typography is active.
 */
const PAGE_CLASS = 'a11y-elder'

/**
 * Text-bearing elements to enlarge. `max(1em, Npx)` floors the size without
 * compounding through nesting: `1em` resolves against the parent, so a
 * floored parent simply passes its size through.
 */
const TEXT_SELECTOR =
  'p, li, dd, dt, td, th, caption, figcaption, blockquote, label, legend, a, span, em, strong, b, i, u, small, button, input, select, textarea, h1, h2, h3, h4, h5, h6'

/**
 * Inline SVG for the elder-mode toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"/></svg>'

const elderModePlugin = definePlugin<
  ElderModeOptions,
  ElderModeApi,
  ElderModeState
>({
  messages: {
    'en-US': {
      'elder.label': 'Elder care',
      'elder.off': 'Elder care mode is off, enable with {shortcut}',
      'elder.on': 'Elder care mode is on, disable with {shortcut}',
    },
    'zh-CN': {
      'elder.label': '关怀版',
      'elder.off': '当前关怀版已关闭，开启关怀版请按 {shortcut}',
      'elder.on': '当前关怀版已开启，关闭关怀版请按 {shortcut}',
    },
  },
  name: 'elder-mode',
  setup(ctx) {
    const minFontSize = ctx.options.minFontSize ?? 18
    const lineHeight = ctx.options.lineHeight ?? 1.6
    let disposeStyle: (() => void) | null = null

    function buildStyle(): string {
      function scoped(selector: string): string {
        return selector
          .split(', ')
          .map(part => `.${PAGE_CLASS} body :where(${part})`)
          .join(', ')
      }
      return css`
        ${scoped(TEXT_SELECTOR)} {
          font-size: max(1em, ${minFontSize}px) !important;
          line-height: ${lineHeight} !important;
          letter-spacing: 0.03em !important;
        }
        .${PAGE_CLASS} body a {
          text-decoration: underline !important;
          text-underline-offset: 0.2em;
        }
        .${PAGE_CLASS} body :focus {
          outline: var(
            ${pageVar('focus-outline')},
            3px solid #fcff00
          ) !important;
          outline-offset: 2px !important;
        }
      `
    }

    function apply(enabled: boolean): void {
      if (enabled) {
        ctx.dom.addPageClass(PAGE_CLASS)
        disposeStyle = ctx.dom.injectStyle('elder-mode', buildStyle())
      } else {
        disposeStyle?.()
        disposeStyle = null
        ctx.dom.removePageClass(PAGE_CLASS)
      }
    }

    function isEnabled(): boolean {
      return ctx.state.get('enabled')
    }
    function describe(): string {
      return ctx.i18n.t(isEnabled() ? 'elder.on' : 'elder.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'o' }),
      })
    }

    function toggle(): void {
      const next = !isEnabled()
      ctx.state.set('enabled', next)
      ctx.ui.announce(describe())
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      icon: ICON,
      id: 'elder-mode',
      label: () => ctx.i18n.t('elder.label'),
      onPress: toggle,
      order: 45,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('elder.label'),
      handler: toggle,
      id: 'elder-mode',
      key: 'o',
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
 * Elder care mode plugin (关怀版/老年模式). `Ctrl+Alt+O` floors font sizes,
 * relaxes line height and letter spacing, underlines links and strengthens
 * focus outlines — no layout-breaking page zoom involved.
 *
 * @param options - Minimum font size and line height; omitted fields use plugin
 *   defaults.
 * @returns A configured elder mode plugin for toolbar registration.
 */
export function elderMode(
  options: ElderModeOptions = {},
): ConfiguredPlugin<ElderModeOptions, ElderModeApi, ElderModeState> {
  return configurePlugin(elderModePlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the elder-mode plugin after activation.
     */
    'elder-mode': ElderModeApi
  }
}
