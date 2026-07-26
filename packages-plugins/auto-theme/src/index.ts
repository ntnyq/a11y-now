import { configurePlugin, definePlugin, warn } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface AutoThemeOptions {
  /** Theme applied when `prefers-color-scheme: dark`, defaults to `deep-blue`. */
  dark?: string
  /** Theme applied when `prefers-contrast: more`, defaults to `high-contrast`. */
  highContrast?: string
  /** Theme applied otherwise, defaults to `default`. Empty string = leave as is. */
  light?: string
}

export interface AutoThemeApi {
  /** Re-apply the theme matching the current system preferences. */
  evaluate: () => void
  isEnabled: () => boolean
  toggle: () => void
}

interface AutoThemeState {
  enabled: boolean
  [key: string]: boolean
}

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
  setup: ctx => {
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

    const isEnabled = (): boolean => ctx.state.get('enabled')
    const describe = (): string =>
      ctx.i18n.t(isEnabled() ? 'auto-theme.on' : 'auto-theme.off', {
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 'u' }),
      })

    const preferredName = (): string => {
      if (contrastQuery?.matches) {
        return contrastTheme
      }
      return darkQuery?.matches ? darkTheme : lightTheme
    }

    const evaluate = (): void => {
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

    const setEnabled = (next: boolean): void => {
      ctx.state.set('enabled', next)
      button.update({ description: describe, pressed: next })
      ctx.ui.announce(describe())
      if (next) {
        evaluate()
      }
    }
    const toggle = (): void => {
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

    const onMediaChange = (): void => {
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
        evaluate()
      }),
    ]

    return {
      api: { evaluate, isEnabled, toggle },
      dispose: () => {
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
 */
export const autoTheme = (
  options: AutoThemeOptions = {},
): ConfiguredPlugin<AutoThemeOptions, AutoThemeApi, AutoThemeState> =>
  configurePlugin(autoThemePlugin, options)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    'auto-theme': AutoThemeApi
  }
}
