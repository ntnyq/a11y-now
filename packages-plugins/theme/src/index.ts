import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { A11yTheme, ConfiguredPlugin } from '@a11y-now/types'

export interface ThemeSwitcherOptions {
  /**
   * Theme applied on first activation, defaults to the first registered.
   *
   * @default The first registered theme, unless a persisted selection exists.
   */
  initial?: string
}

export interface ThemeSwitcherApi {
  /**
   * Apply a registered theme; unknown names warn and leave the current theme
   * unchanged.
   *
   * @param name - Registered theme name to activate.
   */
  apply: (name: string) => void
  /**
   * Read the active registered theme.
   *
   * @returns The current theme, or `null` when none is active.
   */
  current: () => A11yTheme | null
  /**
   * Apply the next registered theme, wrapping back to the first.
   *
   * @returns The newly applied theme, or `null` when the registry is empty.
   */
  cycle: () => A11yTheme | null
}

interface ThemeState {
  /**
   * Persisted theme id; an empty string allows the initial theme fallback.
   *
   * @default ''
   */
  theme: string
  /**
   * Persistable state entries supported by this plugin scope.
   */
  [key: string]: string
}

/**
 * Inline SVG for the theme toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.5A4.5 4.5 0 0 0 22 11 9 9 0 0 0 12 2Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>'

const themeSwitcherPlugin = definePlugin<
  ThemeSwitcherOptions,
  ThemeSwitcherApi,
  ThemeState
>({
  messages: {
    'en-US': {
      'theme.desc':
        'Switch color scheme {shortcut}. Current: {current}, next: {next}',
      'theme.label': 'Colors',
      'theme.none': 'No themes registered',
      'theme.switched': 'Color scheme switched to {name}',
    },
    'zh-CN': {
      'theme.desc': '切换配色 {shortcut}，当前为 {current}，下一主题为 {next}',
      'theme.label': '配色',
      'theme.none': '尚未注册任何主题',
      'theme.switched': '配色已切换为 {name}',
    },
  },
  name: 'theme',
  setup(ctx) {
    function displayName(theme: A11yTheme | null): string {
      return theme
        ? (theme.displayName[ctx.i18n.getLocale()] ??
            theme.displayName['zh-CN'] ??
            theme.name)
        : '-'
    }

    function describe(): string {
      return ctx.i18n.t('theme.desc', {
        current: displayName(ctx.theme.current()),
        next: displayName(ctx.theme.peek()),
        shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: 't' }),
      })
    }

    function sync(): void {
      button.update({
        description: describe,
        disabled: ctx.theme.list().length === 0,
      })
    }

    function apply(name: string): void {
      ctx.theme.apply(name)
      ctx.state.set('theme', name)
      sync()
      ctx.ui.announce(
        ctx.i18n.t('theme.switched', {
          name: displayName(ctx.theme.current()),
        }),
      )
    }

    function cycle(): A11yTheme | null {
      const next = ctx.theme.peek()
      if (!next) {
        ctx.ui.announce(ctx.i18n.t('theme.none'))
        return null
      }
      apply(next.name)
      return next
    }

    const button = ctx.ui.addItem({
      description: describe,
      group: 'tool',
      hideInScreenReaderMode: true,
      icon: ICON,
      id: 'theme',
      label: () => ctx.i18n.t('theme.label'),
      onPress() {
        cycle()
      },
      order: 30,
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('theme.label'),
      handler() {
        cycle()
      },
      id: 'theme',
      key: 't',
    })

    // Restore the persisted (or configured initial) theme.
    const persisted = ctx.state.get('theme') || ctx.options.initial || ''
    if (persisted && ctx.theme.list().some(t => t.name === persisted)) {
      ctx.theme.apply(persisted)
    }
    sync()

    const stopTheme = ctx.events.on('theme:change', sync)
    const stopState = ctx.state.subscribe(() => {
      if (ctx.state.get('theme')) {
        return
      }
      const name =
        ctx.state.get('theme') ||
        ctx.options.initial ||
        ctx.theme.list()[0]?.name
      if (name) {
        ctx.theme.apply(name)
      }
      sync()
    })

    return {
      api: {
        apply,
        current: () => ctx.theme.current(),
        cycle,
      },
      dispose() {
        stopState()
        stopTheme()
        unregister()
        button.remove()
      },
    }
  },
  state: { theme: '' },
})

/**
 * Color scheme switcher plugin. `Ctrl+Alt+T` cycles registered themes.
 *
 * @param options - Optional theme name to apply on first activation.
 * @returns A configured theme switcher plugin for toolbar registration.
 */
export function themeSwitcher(
  options: ThemeSwitcherOptions = {},
): ConfiguredPlugin<ThemeSwitcherOptions, ThemeSwitcherApi, ThemeState> {
  return configurePlugin(themeSwitcherPlugin, options)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the theme plugin after activation.
     */
    theme: ThemeSwitcherApi
  }
}
