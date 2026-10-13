import { configurePlugin, definePlugin, warn } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface AutoThemeOptions {
  /**
   * Theme applied when `prefers-color-scheme: dark`, defaults to `deep-blue`.
   *
   * @default 'deep-blue'
   */
  dark?: string
  /**
   * Theme applied when `prefers-contrast: more`, defaults to `high-contrast`.
   *
   * @default 'high-contrast'
   */
  highContrast?: string
  /**
   * Theme applied otherwise, defaults to `default`. Empty string = leave as is.
   *
   * @default 'default'
   */
  light?: string
}

export interface AutoThemeApi {
  /**
   * Re-apply the theme matching the current system preferences.
   */
  evaluate: () => void
  /**
   * Check whether automatic system theme switching is enabled.
   *
   * @returns `true` when automatic system theme switching is enabled.
   */
  isEnabled: () => boolean
  /**
   * Toggle and persist automatic system theme switching, updating its page
   * effects.
   */
  toggle: () => void
}

interface AutoThemeState {
  /**
   * Whether system appearance preferences automatically select a theme.
   *
   * @default true
   */
  enabled: boolean
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: boolean
}

/**
 * Inline SVG for the auto-theme toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M10.85 12.65h2.3L12 9l-1.15 3.65ZM20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69ZM14.3 16l-.7-2h-3.2l-.7 2H7.8L11 7h2l3.2 9h-1.9Z"/></svg>'

const autoThemePlugin = definePlugin<
  AutoThemeOptions,
  AutoThemeApi,
  AutoThemeState
>({
  messages: {
    'en-US': {
      'auto-theme.label': 'Auto colors',
      'auto-theme.off':
        'Auto color scheme is off, follow the system with {shortcut}',
      'auto-theme.on':
        'Auto color scheme is on, following the system; disable with {shortcut}',
    },
    'zh-CN': {
      'auto-theme.label': '自动配色',
      'auto-theme.off': '当前自动配色已关闭，跟随系统配色请按 {shortcut}',
      'auto-theme.on': '当前自动配色已开启，正在跟随系统，关闭请按 {shortcut}',
    },
  },
  name: 'auto-theme',
  setup(ctx) {
    const darkTheme = ctx.options.dark ?? 'deep-blue'
    const contrastTheme = ctx.options.highContrast ?? 'high-contrast'
    const lightTheme = ctx.options.light ?? 'default'

    const matcher =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia.bind(window)
        : null
    const contrastQuery = matcher?.('(prefers-contrast: more)') ?? null
    const darkQuery = matcher?.('(prefers-color-scheme: dark)') ?? null

    // Theme restores from other plugins run during mount; only manual
    // switches after `toolbar:mounted` should make auto mode yield.
    let armed = false
    let selfApply = false

    function isEnabled(): boolean {
      return ctx.state.get('enabled')
    }
    function describe(): string {
      return ctx.i18n.t(isEnabled() ? 'auto-theme.on' : 'auto-theme.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'u' }),
      })
    }

    function preferredName(): string {
      if (contrastQuery?.matches) {
        return contrastTheme
      }
      return darkQuery?.matches ? darkTheme : lightTheme
    }

    function evaluate(): void {
      if (!isEnabled()) {
        return
      }
      const name = preferredName()
      if (!name || ctx.theme.current()?.name === name) {
        return
      }
      if (!ctx.theme.list().some(theme => theme.name === name)) {
        warn(`auto-theme: theme "${name}" is not registered`)
        return
      }
      selfApply = true
      try {
        ctx.theme.apply(name)
      } finally {
        selfApply = false
      }
    }

    function setEnabled(next: boolean): void {
      ctx.state.set('enabled', next)
      button.update({ description: describe, pressed: next })
      ctx.ui.announce(describe())
      if (next) {
        evaluate()
      }
    }
    function toggle(): void {
      setEnabled(!isEnabled())
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON,
      id: 'auto-theme',
      label: () => ctx.i18n.t('auto-theme.label'),
      onPress: toggle,
      order: 31,
      pressed: isEnabled(),
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('auto-theme.label'),
      handler: toggle,
      id: 'auto-theme',
      key: 'u',
    })

    function onMediaChange(): void {
      evaluate()
    }
    contrastQuery?.addEventListener('change', onMediaChange)
    darkQuery?.addEventListener('change', onMediaChange)

    const offs = [
      ctx.events.on('toolbar:mounted', () => {
        armed = true
        evaluate()
      }),
      ctx.events.on('theme:change', () => {
        if (!armed || selfApply || !isEnabled()) {
          return
        }
        // A manual switch wins: auto mode yields until re-enabled.
        ctx.state.set('enabled', false)
        button.update({ description: describe, pressed: false })
      }),
      ctx.events.on('state:reset', () => {
        // Restoring the theme may have made auto mode yield during reset.
        ctx.state.set('enabled', ctx.state.defaults.enabled)
        button.update({ description: describe, pressed: isEnabled() })
        evaluate()
      }),
    ]

    return {
      api: { evaluate, isEnabled, toggle },
      dispose() {
        contrastQuery?.removeEventListener('change', onMediaChange)
        darkQuery?.removeEventListener('change', onMediaChange)
        for (const off of offs) {
          off()
        }
        unregister()
        button.remove()
      },
    }
  },
  state: { enabled: true },
})

/**
 * Auto theme plugin (自动配色). Follows `prefers-contrast: more` and
 * `prefers-color-scheme: dark` and applies the mapped registered themes;
 * a manual theme switch makes it yield. `Ctrl+Alt+U` toggles.
 *
 * @param options - Theme names for dark, high-contrast, and default system
 *   preferences.
 * @returns A configured automatic theme plugin for toolbar registration.
 */
export function autoTheme(
  options: AutoThemeOptions = {},
): ConfiguredPlugin<AutoThemeOptions, AutoThemeApi, AutoThemeState> {
  return configurePlugin(autoThemePlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the auto-theme plugin after activation.
     */
    'auto-theme': AutoThemeApi
  }
}
