import type {
  A11yMessages,
  ColorSchemePreference,
  ColorSchemeService,
  DomService,
  EventBus,
  I18nService,
  LocaleCode,
  ResolvedColorScheme,
  ScopedState,
  ShortcutDef,
  ShortcutService,
  SpeechEngine,
  SpeechService,
  StateDefaults,
  StorageAdapter,
  ToolbarUI,
} from './core'

/**
 * Toolbar UI design tokens. Written to the shadow `:host` as
 * `--a11y-<key>` custom properties.
 */
export interface ToolbarTokens {
  /**
   * Minimum width and height of toolbar buttons.
   *
   * @default '56px'
   */
  'btn-size': string
  /**
   * Accent color for emphasized toolbar controls.
   *
   * @default '#0b5cad'
   */
  'color-accent': string
  /**
   * Toolbar background color.
   *
   * @default '#ffffff'
   */
  'color-bg': string
  /**
   * Toolbar borders and group separator color.
   *
   * @default '#d0d3d6'
   */
  'color-border': string
  /**
   * Background color of pressed buttons.
   *
   * @default '#e8f3ff'
   */
  'color-btn-active-bg': string
  /**
   * Foreground color of pressed buttons.
   *
   * @default '#0b5cad'
   */
  'color-btn-active-fg': string
  /**
   * Background color of hovered buttons.
   *
   * @default '#f2f3f5'
   */
  'color-btn-hover-bg': string
  /**
   * Foreground color of disabled buttons.
   *
   * @default '#a8abb0'
   */
  'color-disabled-fg': string
  /**
   * Default toolbar text and icon color.
   *
   * @default '#1f2329'
   */
  'color-fg': string
  /**
   * Color of the keyboard focus outline.
   *
   * @default '#fcff00'
   */
  'color-focus-ring': string
  /**
   * Toolbar label font size.
   *
   * @default '14px'
   */
  'font-size': string
  /**
   * Speech caption font size.
   *
   * @default '42px'
   */
  'font-size-caption': string
  /**
   * Corner radius of toolbar buttons.
   *
   * @default '6px'
   */
  radius: string
  /**
   * Thickness of keyboard focus outlines.
   *
   * @default '3px'
   */
  'outline-width': string
  /**
   * Minimum toolbar height and reserved pinned page space.
   *
   * @default '84px'
   */
  'toolbar-height': string
  /**
   * `justify-content` of the toolbar row, e.g. `center` / `flex-start`.
   *
   * @default 'center'
   */
  'toolbar-justify': string
  /**
   * Duration and timing function for toolbar button transitions.
   *
   * @default '120ms ease-out'
   */
  transition: string
  /**
   * Stacking order of the toolbar host.
   *
   * @default '2147483000'
   */
  'z-index': string
}

/**
 * Page re-coloring tokens. Written to `document.documentElement` as
 * `--a11y-page-<key>` custom properties while a theme is active.
 */
export interface PageTokens {
  /**
   * Page background color; an empty string leaves it unchanged.
   *
   * @default ''
   */
  bg: string
  /**
   * Fill color of the enlarged page cursor.
   *
   * @default '#ffd700'
   */
  'cursor-color': string
  /**
   * Page text color; an empty string leaves it unchanged.
   *
   * @default ''
   */
  fg: string
  /**
   * Outline applied to focused page elements.
   *
   * @default '3px solid #fcff00'
   */
  'focus-outline': string
  /**
   * Page link color; an empty string leaves it unchanged.
   *
   * @default ''
   */
  link: string
  /**
   * Outline used to highlight navigation regions and spoken segments.
   *
   * @default '2px solid #ff6c00'
   */
  'region-outline': string
}

/**
 * A theme is pure data: token values plus metadata.
 */
export interface A11yTheme {
  /**
   * Localized names displayed by the theme switcher.
   */
  displayName: Partial<Record<LocaleCode, string>>
  /**
   * Unique theme id used for registration, selection, and persistence.
   */
  name: string
  /**
   * Page re-coloring tokens. Omit (or `{}`) to leave the page untouched.
   *
   * @default {}
   */
  page?: Partial<PageTokens>
  /**
   * Selectors excluded from page re-coloring, merged into the global list.
   *
   * @default []
   */
  skipSelectors?: string[]
  /**
   * Toolbar UI token overrides.
   *
   * @default {}
   */
  toolbar?: Partial<ToolbarTokens>
}

export interface ThemeService {
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
   * Apply the next registered theme (wraps around). Returns it.
   *
   * @returns The newly applied theme, or `null` when the registry is empty.
   */
  cycle: () => A11yTheme | null
  /**
   * Resolve a toolbar token from the active theme or built-in defaults.
   *
   * @template K - Toolbar token key.
   * @param key - Toolbar token key to resolve.
   * @returns The active override or the default toolbar token value.
   */
  getToken: <K extends keyof ToolbarTokens>(key: K) => string
  /**
   * List the registered themes in registration order.
   *
   * @returns A new array containing the registered theme definitions.
   */
  list: () => A11yTheme[]
  /**
   * The theme `cycle()` would switch to.
   *
   * @returns The next theme without applying it, or `null` when the registry is
   *   empty.
   */
  peek: () => A11yTheme | null
  /**
   * Register a theme, replacing any definition with the same name.
   *
   * @param theme - Theme definition to make available for switching.
   */
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
// eslint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
export interface A11yPluginRegistry {}

/**
 * Everything a plugin can touch. Passed to `setup`.
 */
export interface PluginContext<
  Options = void,
  State extends StateDefaults = StateDefaults,
> {
  /**
   * Tracked page mutations reverted when the toolbar unmounts.
   */
  dom: DomService
  /**
   * Shared event bus for kernel and plugin communication.
   */
  events: EventBus
  /**
   * Locale selection and translation service.
   */
  i18n: I18nService
  /**
   * Configuration supplied by the plugin factory or registration.
   */
  options: Options
  /**
   * Toolbar color scheme preference and resolved appearance.
   */
  scheme: ColorSchemeService
  /**
   * Keyboard shortcut registration, formatting, and overrides.
   */
  shortcuts: ShortcutService
  /**
   * Shared speech playback and enablement controls.
   */
  speech: SpeechService
  /**
   * Persisted reactive state scoped to this plugin name.
   */
  state: ScopedState<State>
  /**
   * Persistence adapter, or null when persistence is disabled.
   */
  storage: StorageAdapter | null
  /**
   * Theme registry and active theme controls.
   */
  theme: ThemeService
  /**
   * Toolbar button creation and accessible announcements.
   */
  ui: ToolbarUI
}

export interface PluginSetupResult<Api = unknown> {
  /**
   * Public plugin API exposed through the instance getPlugin() method.
   */
  api?: Api
  /**
   * Revert every side effect of this plugin. Called on unmount.
   */
  dispose: () => void
}

export interface A11yPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  /**
   * Names of plugins that must be registered before this one.
   *
   * @default []
   */
  dependsOn?: string[]
  /**
   * Extra message tables merged into the kernel i18n.
   *
   * @default {}
   */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  /**
   * Unique plugin id used for registration, dependencies, and state storage.
   */
  name: string
  /**
   * Activate the plugin using the services supplied by the toolbar kernel.
   *
   * @param ctx - Services, resolved plugin options, and plugin-scoped state.
   * @returns The optional public API and the required side-effect disposer.
   */
  setup: (ctx: PluginContext<Options, State>) => PluginSetupResult<Api>
  /**
   * Persisted state defaults.
   *
   * @default {}
   */
  state?: State
}

/**
 * A plugin bundled with its options, as produced by plugin factories.
 */
export interface ConfiguredPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  /**
   * Options passed to this plugin when it activates.
   */
  options: Options
  /**
   * Plugin definition to activate with the accompanying options.
   */
  plugin: A11yPlugin<Options, Api, State>
}

/* eslint-disable typescript/no-explicit-any -- heterogeneous plugin lists */
export type A11yPluginInput =
  | A11yPlugin<any, any, any>
  | ConfiguredPlugin<any, any, any>
/* eslint-enable typescript/no-explicit-any */

export interface A11yNowOptions {
  /**
   * Color scheme of the toolbar chrome (default `'auto'`): follow the host
   * page — explicit `color-scheme`, `dark`/`light` class or `data-theme` /
   * `data-color-mode` / `data-color-scheme` markers on `<html>`/`<body>`,
   * then the page background luminance, then `prefers-color-scheme` — and
   * re-resolve live when those signals change. `'light'` / `'dark'` pin the
   * scheme. Applied a11y themes override the scheme's toolbar tokens.
   *
   * @default 'auto'
   */
  colorScheme?: ColorSchemePreference
  /**
   * Whether the toolbar starts enabled (default `true`). When `false`,
   * `mount()` only records the intent — the toolbar appears once
   * `setEnabled(true)` / `toggleEnabled()` is called. A choice the user made
   * through those methods is persisted and takes precedence over this flag.
   *
   * @default true
   */
  enabled?: boolean
  /**
   * Initial locale, defaults to the document language or `zh-CN`.
   *
   * @default The normalized document language, falling back to 'zh-CN'.
   */
  locale?: LocaleCode
  /**
   * Extra message tables merged over the built-ins.
   *
   * @default {}
   */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  /**
   * Plugins registered before the first toolbar mount.
   *
   * @default []
   */
  plugins?: A11yPluginInput[]
  /**
   * Per-id keyboard shortcut overrides, e.g.
   * `{ 'zoom-in': { key: '9' }, help: null }` — a partial def merges over
   * the plugin default, `null` disables that shortcut.
   *
   * @default {}
   */
  shortcutOverrides?: Record<string, Partial<ShortcutDef> | null>
  /**
   * Custom speech backend. Defaults to the Web Speech API engine.
   *
   * @default Web Speech API in browsers; a silent engine without a DOM.
   */
  speechEngine?: SpeechEngine
  /**
   * Persistence backend. `null` disables persistence.
   *
   * @default A localStorage adapter, or null when localStorage is unavailable.
   */
  storage?: StorageAdapter | null
  /**
   * Storage key prefix, defaults to `a11y-now`.
   *
   * @default 'a11y-now'
   */
  storagePrefix?: string
  /**
   * Themes registered before plugins activate.
   *
   * @default []
   */
  themes?: A11yTheme[]
}

export interface A11yNowInstance {
  /**
   * The configured color scheme preference.
   */
  readonly colorScheme: ColorSchemePreference
  /**
   * Unmount the toolbar and release kernel observers, shortcuts, and speech
   * resources.
   */
  destroy: () => void
  /**
   * Effective enabled flag — the persisted user choice over the option.
   */
  readonly enabled: boolean
  /**
   * Shared event bus for observing toolbar and plugin activity.
   */
  readonly events: EventBus
  /**
   * Read the API exposed by an activated plugin.
   *
   * @template K - Registered plugin name determining its API type.
   * @param name - Plugin name from the augmented API registry.
   * @returns The mounted plugin API, or `undefined` before activation or after
   *   unmount.
   */
  getPlugin: <K extends keyof A11yPluginRegistry>(
    name: K,
  ) => A11yPluginRegistry[K] | undefined
  /**
   * Translation service and current locale controls.
   */
  readonly i18n: I18nService
  /**
   * Whether the toolbar host is currently mounted in the document.
   */
  readonly mounted: boolean
  /**
   * Mount the toolbar and activate plugins when enabled in a DOM environment.
   *
   * @param target - Parent for the shadow host; defaults to the document root.
   * @throws {Error} If plugin dependency resolution or plugin setup fails.
   */
  mount: (target?: Element) => void
  /**
   * Reset all plugin state to defaults.
   */
  resetAll: () => void
  /**
   * The toolbar color scheme currently in effect.
   */
  readonly resolvedColorScheme: ResolvedColorScheme
  /**
   * Change the color scheme preference; `'auto'` re-follows the host page
   * and system. Emits `scheme:change` when the resolved scheme flips.
   *
   * @param scheme - Toolbar preference; `auto` follows the page and system.
   */
  setColorScheme: (scheme: ColorSchemePreference) => void
  /**
   * Enable or disable the toolbar and persist the choice.
   *
   * @param enabled - Whether to enable and mount the toolbar, or disable and
   *   unmount it.
   */
  setEnabled: (enabled: boolean) => void
  /**
   * Show the toolbar if hidden, hide it if shown (based on the actual
   * mounted state, so it also revives a toolbar closed via the exit
   * plugin). Returns the new mounted state.
   *
   * @returns The actual mounted state after toggling.
   */
  toggleEnabled: () => boolean
  /**
   * Keyboard shortcut registry and binding overrides.
   */
  readonly shortcuts: ShortcutService
  /**
   * Speech playback, rate, and enablement controls.
   */
  readonly speech: SpeechService
  /**
   * Theme registry; access requires a DOM environment.
   */
  readonly themes: ThemeService
  /**
   * Remove the toolbar and plugin side effects while allowing a later remount.
   */
  unmount: () => void
  /**
   * Register a plugin; duplicates warn and plugins added after mounting need a
   * remount.
   *
   * @param plugin - Bare plugin definition or configured plugin to register.
   * @returns This toolbar instance for chaining.
   */
  use: (plugin: A11yPluginInput) => A11yNowInstance
  /**
   * Register a theme when a DOM-backed theme service is available.
   *
   * @param theme - Theme definition to register.
   * @returns This toolbar instance for chaining.
   */
  useTheme: (theme: A11yTheme) => A11yNowInstance
}
