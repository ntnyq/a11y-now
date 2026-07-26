/**
 * Type contracts for the a11y-now ecosystem.
 *
 * This package is pure types: zero runtime, zero dependencies.
 * Plugins, themes, frameworks and the kernel all agree on this file.
 */

/** Locale codes. Extendable: any BCP 47 string is accepted. */
export type LocaleCode = 'en-US' | 'zh-CN' | (string & Record<never, never>)

/** Color scheme preference for the toolbar chrome. */
export type ColorSchemePreference = 'auto' | 'dark' | 'light'

/** The scheme actually in effect once `auto` is resolved. */
export type ResolvedColorScheme = 'dark' | 'light'

/**
 * Toolbar chrome color scheme. `auto` (the default) follows the host page:
 * an explicit `color-scheme`, a `dark`/`light` class or `data-theme` /
 * `data-color-mode` / `data-color-scheme` marker on `<html>`/`<body>`, the
 * page background luminance, then `prefers-color-scheme` — re-resolved live
 * whenever those signals change. Applied a11y themes still override the
 * scheme's toolbar tokens.
 */
export interface ColorSchemeService {
  /** The configured preference (`auto` unless pinned). */
  preference: () => ColorSchemePreference
  /** The scheme currently in effect. */
  resolved: () => ResolvedColorScheme
  /** Change the preference; `auto` re-follows the host page and system. */
  set: (scheme: ColorSchemePreference) => void
}

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
  /**
   * Override the binding registered under `id`: a partial def merges over
   * the plugin's default (`{}` restores it), `null` disables the shortcut.
   * Applies to the current registration and any future one with that id;
   * throws if the resulting combo collides with another registration.
   */
  setOverride: (id: string, override: Partial<ShortcutDef> | null) => void
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
  subscribe: (
    fn: (key: keyof T & string, value: T[keyof T]) => void,
  ) => () => void
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
  /** The resolved toolbar color scheme changed (auto detection or API). */
  'scheme:change': { scheme: ResolvedColorScheme }
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

/** Per-utterance options handed to a speech engine. */
export interface SpeechSpeakOptions {
  locale: LocaleCode
  /**
   * Called at most once, when the utterance finishes or fails. Engines may
   * also fire it (or skip it) for cancelled/superseded utterances, so
   * sequencing callers must guard with their own generation counter.
   */
  onEnd?: (() => void) | undefined
  rate: number
}

/** Pluggable speech backend. */
export interface SpeechEngine {
  readonly available: boolean
  cancel: () => void
  speak: (text: string, options: SpeechSpeakOptions) => void
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
  /**
   * Speak text if enabled and not muted. `force` bypasses the enabled check.
   * `onEnd` is forwarded to the engine; it is not called when the request
   * is dropped by the enabled/muted guards.
   */
  speak: (
    text: string,
    options?: { force?: boolean; onEnd?: () => void },
  ) => void
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
