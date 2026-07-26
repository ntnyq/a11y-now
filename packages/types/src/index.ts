/**
 * Type contracts for the a11y-now ecosystem.
 *
 * This package is pure types: zero runtime, zero dependencies.
 * Plugins, themes, frameworks and the kernel all agree on this file.
 */

/** Locale codes. Extendable: any BCP 47 string is accepted. */
export type LocaleCode = 'en-US' | 'zh-CN' | (string & {})

/** Flat message table for one locale. */
export type A11yMessages = Record<string, string>

/**
 * Persistence backend. Default implementation wraps `localStorage`,
 * pass `null` to disable persistence entirely.
 */
export interface StorageAdapter {
  get: (key: string) => string | null
  remove: (key: string) => void
  set: (key: string, value: string) => void
}

/** A single keyboard shortcut. `key` is compared against `KeyboardEvent.key`. */
export interface ShortcutDef {
  alt?: boolean
  ctrl?: boolean
  key: string
  meta?: boolean
  shift?: boolean
}

export interface ShortcutInfo extends ShortcutDef {
  description: string
  id: string
}

export interface ShortcutService {
  /** Format a shortcut for humans, e.g. `Ctrl+Alt+T`. */
  format: (def: ShortcutDef) => string
  /** All registered shortcuts, for help panels. */
  list: () => ShortcutInfo[]
  /**
   * Register a shortcut. Throws on conflict with an existing registration.
   * Returns an unregister function.
   */
  register: (
    def: ShortcutDef & {
      description: string | (() => string)
      handler: () => void
      id: string
    },
  ) => () => void
}

/** Toolbar button groups, rendered left to right. */
export type ToolbarGroup = 'region' | 'system' | 'tool'

export interface ToolbarItemDef {
  /** Extra description, exposed via `title`. */
  description?: string | (() => string)
  disabled?: boolean
  group?: ToolbarGroup
  /** Hidden while the screen-reader mode plugin is active. */
  hideInScreenReaderMode?: boolean
  /** Unique id within the toolbar. */
  id: string
  /** Inline SVG markup rendered as the button icon. */
  icon?: string
  /** Visible label. Function form is re-evaluated on every update. */
  label: string | (() => string)
  onPress?: () => void
  order?: number
  /** Toggle state, exposed via `aria-pressed`. */
  pressed?: boolean
}

export interface ToolbarItemHandle {
  readonly el: HTMLElement
  remove: () => void
  update: (
    patch: Partial<
      Pick<ToolbarItemDef, 'description' | 'disabled' | 'label' | 'pressed'>
    > & { badge?: number | string },
  ) => void
}

export interface ToolbarUI {
  addItem: (def: ToolbarItemDef) => ToolbarItemHandle
  /** Politely announce a message via the toolbar live region (and speech). */
  announce: (text: string) => void
}

/** Values a plugin may persist. */
export type StateValue = boolean | number | string | null
export type StateDefaults = Record<string, StateValue>

/** Reactive, persisted, plugin-scoped state. */
export interface ScopedState<T extends StateDefaults = StateDefaults> {
  readonly defaults: T
  get: <K extends keyof T>(key: K) => T[K]
  reset: () => void
  set: <K extends keyof T>(key: K, value: T[K]) => void
  subscribe: (fn: (key: keyof T & string, value: T[keyof T]) => void) => () => void
}

/**
 * Global event map. Extend it from plugin packages:
 *
 * ```ts
 * declare module '@a11y-now/types' {
 *   interface A11yEventMap {
 *     'zoom:change': { scale: number }
 *   }
 * }
 * ```
 */
export interface A11yEventMap {
  /** Request the kernel to unmount (used by the exit plugin). */
  'a11y:exit': Record<string, never>
  /** Request the kernel to reset all plugin state (used by the reset plugin). */
  'a11y:reset': Record<string, never>
  'plugin:activated': { name: string }
  'screen-reader:change': { enabled: boolean }
  'speech:enabled': { enabled: boolean }
  'speech:speak': { text: string }
  'state:reset': Record<string, never>
  'theme:change': { theme: string }
  'toolbar:mounted': { host: HTMLElement }
  'toolbar:unmounted': Record<string, never>
}

export type A11yEventName = keyof A11yEventMap

export interface EventBus {
  emit: <E extends A11yEventName>(event: E, payload: A11yEventMap[E]) => void
  off: <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ) => void
  on: <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ) => () => void
}

/** Pluggable speech backend. */
export interface SpeechEngine {
  readonly available: boolean
  cancel: () => void
  speak: (text: string, options: { locale: LocaleCode; rate: number }) => void
}

export interface SpeechService {
  cancel: () => void
  getRate: () => number
  isEnabled: () => boolean
  isMuted: () => boolean
  setEnabled: (enabled: boolean) => void
  /** Muted while screen-reader mode is active: `speak` becomes a no-op. */
  setMuted: (muted: boolean) => void
  setRate: (rate: number) => void
  /** Speak text if enabled and not muted. `force` bypasses the enabled check. */
  speak: (text: string, options?: { force?: boolean }) => void
}

export interface I18nService {
  extend: (locale: LocaleCode, messages: A11yMessages) => void
  getLocale: () => LocaleCode
  setLocale: (locale: LocaleCode) => void
  /** Translate `key`, interpolating `{name}` placeholders from `params`. */
  t: (key: string, params?: Record<string, number | string>) => string
}

/**
 * Safe page-mutation service. Every mutation is registered and reverted
 * on `unmount()` — "leave no trace" is enforced by the kernel.
 */
export interface DomService {
  addPageClass: (className: string) => void
  /** Remove every mutation this service performed. */
  cleanup: () => void
  /** Inject a stylesheet into the page `<head>`. Returns a dispose fn. */
  injectStyle: (id: string, cssText: string) => () => void
  removePageClass: (className: string) => void
  removePageVar: (name: string) => void
  /** Set a CSS custom property on `document.documentElement`. */
  setPageVar: (name: string, value: string) => void
}

/**
 * Toolbar UI design tokens. Written to the shadow `:host` as
 * `--a11y-<key>` custom properties.
 */
export interface ToolbarTokens {
  'btn-size': string
  'color-accent': string
  'color-bg': string
  'color-border': string
  'color-btn-active-bg': string
  'color-btn-active-fg': string
  'color-btn-hover-bg': string
  'color-disabled-fg': string
  'color-fg': string
  'color-focus-ring': string
  'font-size': string
  'font-size-caption': string
  radius: string
  'outline-width': string
  'toolbar-height': string
  transition: string
  'z-index': string
}

/**
 * Page re-coloring tokens. Written to `document.documentElement` as
 * `--a11y-page-<key>` custom properties while a theme is active.
 */
export interface PageTokens {
  bg: string
  'cursor-color': string
  fg: string
  'focus-outline': string
  link: string
  'region-outline': string
}

/** A theme is pure data: token values plus metadata. */
export interface A11yTheme {
  displayName: Partial<Record<LocaleCode, string>>
  name: string
  /** Page re-coloring tokens. Omit (or `{}`) to leave the page untouched. */
  page?: Partial<PageTokens>
  /** Selectors excluded from page re-coloring, merged into the global list. */
  skipSelectors?: string[]
  /** Toolbar UI token overrides. */
  toolbar?: Partial<ToolbarTokens>
}

export interface ThemeService {
  apply: (name: string) => void
  current: () => A11yTheme | null
  /** Apply the next registered theme (wraps around). Returns it. */
  cycle: () => A11yTheme | null
  getToken: <K extends keyof ToolbarTokens>(key: K) => string
  list: () => A11yTheme[]
  /** The theme `cycle()` would switch to. */
  peek: () => A11yTheme | null
  register: (theme: A11yTheme) => void
}

/**
 * Plugin Api registry. Extend it from plugin packages:
 *
 * ```ts
 * declare module '@a11y-now/types' {
 *   interface A11yPluginRegistry {
 *     zoom: ZoomApi
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface A11yPluginRegistry {}

/** Everything a plugin can touch. Passed to `setup`. */
export interface PluginContext<
  Options = void,
  State extends StateDefaults = StateDefaults,
> {
  dom: DomService
  events: EventBus
  i18n: I18nService
  options: Options
  shortcuts: ShortcutService
  speech: SpeechService
  state: ScopedState<State>
  storage: StorageAdapter | null
  theme: ThemeService
  ui: ToolbarUI
}

export interface PluginSetupResult<Api = unknown> {
  api?: Api
  /** Revert every side effect of this plugin. Called on unmount. */
  dispose: () => void
}

export interface A11yPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  /** Names of plugins that must be registered before this one. */
  dependsOn?: string[]
  /** Extra message tables merged into the kernel i18n. */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  name: string
  setup: (ctx: PluginContext<Options, State>) => PluginSetupResult<Api>
  /** Persisted state defaults. */
  state?: State
}

/** A plugin bundled with its options, as produced by plugin factories. */
export interface ConfiguredPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  options: Options
  plugin: A11yPlugin<Options, Api, State>
}

export type A11yPluginInput =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  A11yPlugin<any, any, any> | ConfiguredPlugin<any, any, any>

export interface A11yNowOptions {
  /** Initial locale, defaults to the document language or `zh-CN`. */
  locale?: LocaleCode
  /** Extra message tables merged over the built-ins. */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  plugins?: A11yPluginInput[]
  /** Custom speech backend. Defaults to the Web Speech API engine. */
  speechEngine?: SpeechEngine
  /** Persistence backend. `null` disables persistence. */
  storage?: StorageAdapter | null
  /** Storage key prefix, defaults to `a11y-now`. */
  storagePrefix?: string
  themes?: A11yTheme[]
}

export interface A11yNowInstance {
  destroy: () => void
  readonly events: EventBus
  getPlugin: <K extends keyof A11yPluginRegistry>(
    name: K,
  ) => A11yPluginRegistry[K] | undefined
  readonly i18n: I18nService
  readonly mounted: boolean
  mount: (target?: Element) => void
  /** Reset all plugin state to defaults. */
  resetAll: () => void
  readonly shortcuts: ShortcutService
  readonly speech: SpeechService
  readonly themes: ThemeService
  unmount: () => void
  use: (plugin: A11yPluginInput) => A11yNowInstance
  useTheme: (theme: A11yTheme) => A11yNowInstance
}
