/**
 * Type contracts for the a11y-now ecosystem.
 *
 * This package is pure types: zero runtime, zero dependencies.
 * Plugins, themes, frameworks and the kernel all agree on this file.
 */

/**
 * Locale codes. Extendable: any BCP 47 string is accepted.
 */
export type LocaleCode = 'en-US' | 'zh-CN' | (string & Record<never, never>)

/**
 * Color scheme preference for the toolbar chrome.
 */
export type ColorSchemePreference = 'auto' | 'dark' | 'light'

/**
 * The scheme actually in effect once `auto` is resolved.
 */
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
  /**
   * The configured preference (`auto` unless pinned).
   *
   * @returns The configured preference, including `auto` when following the
   *   page.
   */
  preference: () => ColorSchemePreference
  /**
   * The scheme currently in effect.
   *
   * @returns The effective `dark` or `light` scheme.
   */
  resolved: () => ResolvedColorScheme
  /**
   * Change the preference; `auto` re-follows the host page and system.
   *
   * @param scheme - Preference to apply; `auto` resumes page and system
   *   detection.
   */
  set: (scheme: ColorSchemePreference) => void
}

/**
 * Flat message table for one locale.
 */
export type A11yMessages = Record<string, string>

/**
 * Persistence backend. Default implementation wraps `localStorage`,
 * pass `null` to disable persistence entirely.
 */
export interface StorageAdapter {
  /**
   * Read a persisted value by its namespaced key.
   *
   * @param key - Storage key to retrieve.
   * @returns The stored string, or `null` when absent.
   */
  get: (key: string) => string | null
  /**
   * Remove a persisted value.
   *
   * @param key - Storage key to remove.
   */
  remove: (key: string) => void
  /**
   * Persist a string value.
   *
   * @param key - Storage key to write.
   * @param value - Serialized value to persist.
   */
  set: (key: string, value: string) => void
}

/**
 * A single keyboard shortcut. `key` is compared against `KeyboardEvent.key`.
 */
export interface ShortcutDef {
  /**
   * Whether Alt must be held to match this shortcut.
   *
   * @default false
   */
  alt?: boolean
  /**
   * Whether Control must be held to match this shortcut.
   *
   * @default false
   */
  ctrl?: boolean
  /**
   * KeyboardEvent.key matched case-insensitively.
   */
  key: string
  /**
   * Whether Meta (Command on macOS) must be held.
   *
   * @default false
   */
  meta?: boolean
  /**
   * Whether Shift must be held to match this shortcut.
   *
   * @default false
   */
  shift?: boolean
}

export interface ShortcutInfo extends ShortcutDef {
  /**
   * Resolved shortcut description displayed in help panels.
   */
  description: string
  /**
   * Unique registration id used to override or disable the shortcut.
   */
  id: string
}

export interface ShortcutService {
  /**
   * Format a shortcut for humans, e.g. `Ctrl+Alt+T`.
   *
   * @param def - Key and modifier combination to display.
   * @returns A human-readable shortcut label.
   */
  format: (def: ShortcutDef) => string
  /**
   * All registered shortcuts, for help panels.
   *
   * @returns Active shortcut definitions with their resolved descriptions.
   */
  list: () => ShortcutInfo[]
  /**
   * Register a shortcut. Throws on conflict with an existing registration.
   * Returns an unregister function.
   *
   * @param def - Unique id, key combination, description, and activation
   *   handler.
   * @returns A function that unregisters this shortcut.
   * @throws {Error} If the effective combination conflicts with another
   *   shortcut.
   */
  register: (
    def: ShortcutDef & {
      /**
       * Human-readable shortcut description, optionally resolved on demand.
       */
      description: string | (() => string)
      /**
       * Callback invoked when the registered shortcut matches.
       */
      handler: () => void
      /**
       * Unique shortcut id used for binding overrides.
       */
      id: string
    },
  ) => () => void
  /**
   * Override the binding registered under `id`: a partial def merges over
   * the plugin's default (`{}` restores it), `null` disables the shortcut.
   * Applies to the current registration and any future one with that id;
   * throws if the resulting combo collides with another registration.
   *
   * @param id - Shortcut id whose binding should change.
   * @param override - Partial binding, `{}` to restore defaults, or `null` to
   *   disable.
   * @throws {Error} If the effective combination conflicts with another
   *   shortcut.
   */
  setOverride: (id: string, override: Partial<ShortcutDef> | null) => void
}

/**
 * Toolbar button groups, rendered left to right.
 */
export type ToolbarGroup = 'region' | 'system' | 'tool'

export interface ToolbarItemDef {
  /**
   * Extra description, exposed via `title`.
   *
   * @returns The description text when supplied as a callback.
   */
  description?: string | (() => string)
  /**
   * Prevent activation and exclude the button from keyboard navigation.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Toolbar group containing the button.
   *
   * @default 'tool'
   */
  group?: ToolbarGroup
  /**
   * Hidden while the screen-reader mode plugin is active.
   *
   * @default false
   */
  hideInScreenReaderMode?: boolean
  /**
   * Unique id within the toolbar.
   */
  id: string
  /**
   * Inline SVG markup rendered as the button icon.
   */
  icon?: string
  /**
   * Visible label. Function form is re-evaluated on every update.
   *
   * @returns The visible button label when supplied as a callback.
   */
  label: string | (() => string)
  /**
   * Handle activation of the enabled toolbar button.
   */
  onPress?: () => void
  /**
   * CSS order within the toolbar group; lower values appear first.
   *
   * @default 0
   */
  order?: number
  /**
   * Toggle state, exposed via `aria-pressed`.
   */
  pressed?: boolean
}

export interface ToolbarItemHandle {
  /**
   * Rendered toolbar button controlled by this handle.
   */
  readonly el: HTMLElement
  /**
   * Remove the button and refresh the group visibility and tab stops.
   */
  remove: () => void
  /**
   * Update the rendered button state and content.
   *
   * @param patch - Fields to change; omitting the badge removes its rendered
   *   value.
   */
  update: (
    patch: Partial<
      Pick<ToolbarItemDef, 'description' | 'disabled' | 'label' | 'pressed'>
    > & {
      /**
       * Count or status displayed beside the toolbar label.
       */
      badge?: number | string
    },
  ) => void
}

export interface ToolbarUI {
  /**
   * Add a button to its toolbar group.
   *
   * @param def - Button identity, presentation, ordering, and activation
   *   callback.
   * @returns A handle for updating or removing the rendered button.
   */
  addItem: (def: ToolbarItemDef) => ToolbarItemHandle
  /**
   * Politely announce a message via the toolbar live region (and speech).
   *
   * @param text - Message written to the live region and passed to the speech
   *   service.
   */
  announce: (text: string) => void
}

/**
 * Values a plugin may persist.
 */
export type StateValue = boolean | number | string | null
export type StateDefaults = Record<string, StateValue>

/**
 * Reactive, persisted, plugin-scoped state.
 */
export interface ScopedState<T extends StateDefaults = StateDefaults> {
  /**
   * Initial state values restored by reset().
   */
  readonly defaults: T
  /**
   * Read the current value of a state key.
   *
   * @template K - State key determining the return type.
   * @param key - Declared state key to read.
   * @returns The current value for that key.
   */
  get: <K extends keyof T>(key: K) => T[K]
  /**
   * Restore all defaults, remove persisted state, and notify every key
   * subscriber.
   */
  reset: () => void
  /**
   * Persist a changed state value and notify subscribers.
   *
   * @template K - State key determining the value type.
   * @param key - Declared state key to update.
   * @param value - New value for the key; unchanged values do not trigger
   *   notifications.
   */
  set: <K extends keyof T>(key: K, value: T[K]) => void
  /**
   * Observe changes to any key in this state scope.
   *
   * @param fn - Callback receiving the changed key and its current value.
   * @returns A function that unsubscribes the callback.
   */
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
  /**
   * Request the kernel to unmount (used by the exit plugin).
   */
  'a11y:exit': Record<string, never>
  /**
   * Request the kernel to reset all plugin state (used by the reset plugin).
   */
  'a11y:reset': Record<string, never>
  /**
   * A plugin completed setup and exposes its API, when provided.
   */
  'plugin:activated': {
    /**
     * Name of the plugin that completed activation.
     */
    name: string
  }
  /**
   * The resolved toolbar color scheme changed (auto detection or API).
   */
  'scheme:change': {
    /**
     * Resolved toolbar appearance after the scheme change.
     */
    scheme: ResolvedColorScheme
  }
  /**
   * Screen-reader mode changed; the payload controls hidden buttons and speech muting.
   */
  'screen-reader:change': {
    /**
     * Whether the corresponding accessibility feature is enabled.
     */
    enabled: boolean
  }
  /**
   * Ordinary speech playback was enabled or disabled.
   */
  'speech:enabled': {
    /**
     * Whether the corresponding accessibility feature is enabled.
     */
    enabled: boolean
  }
  /**
   * An utterance was accepted for playback and caption display.
   */
  'speech:speak': {
    /**
     * Utterance text accepted by the speech service.
     */
    text: string
  }
  /**
   * All plugin state scopes were restored to their defaults.
   */
  'state:reset': Record<string, never>
  /**
   * The active registered theme changed.
   */
  'theme:change': {
    /**
     * Name of the newly applied theme.
     */
    theme: string
  }
  /**
   * The toolbar and plugins finished mounting into the supplied host.
   */
  'toolbar:mounted': {
    /**
     * Shadow host containing the mounted toolbar.
     */
    host: HTMLElement
  }
  /**
   * The toolbar host and plugin side effects were removed.
   */
  'toolbar:unmounted': Record<string, never>
}

export type A11yEventName = keyof A11yEventMap

export interface EventBus {
  /**
   * Synchronously notify a snapshot of the event listeners.
   *
   * @template E - Event name determining the payload type.
   * @param event - Event name to dispatch.
   * @param payload - Payload required by the event map.
   */
  emit: <E extends A11yEventName>(event: E, payload: A11yEventMap[E]) => void
  /**
   * Remove a previously registered event listener.
   *
   * @template E - Event name determining the payload type.
   * @param event - Event name the listener observes.
   * @param fn - The same callback reference used when subscribing.
   */
  off: <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ) => void
  /**
   * Subscribe a callback to a typed event.
   *
   * @template E - Event name determining the payload type.
   * @param event - Event name to observe.
   * @param fn - Callback receiving each emitted payload.
   * @returns A function that removes this listener.
   */
  on: <E extends A11yEventName>(
    event: E,
    fn: (payload: A11yEventMap[E]) => void,
  ) => () => void
}

/**
 * Per-utterance options handed to a speech engine.
 */
export interface SpeechSpeakOptions {
  /**
   * Language tag used to select the utterance voice.
   */
  locale: LocaleCode
  /**
   * Called at most once, when the utterance finishes or fails. Engines may
   * also fire it (or skip it) for cancelled/superseded utterances, so
   * sequencing callers must guard with their own generation counter.
   */
  onEnd?: (() => void) | undefined
  /**
   * Playback speed multiplier supplied by the speech service.
   */
  rate: number
}

/**
 * Pluggable speech backend.
 */
export interface SpeechEngine {
  /**
   * Whether the required speech backend is available in this environment.
   */
  readonly available: boolean
  /**
   * Cancel active speech and release pending playback resources.
   */
  cancel: () => void
  /**
   * Start an utterance using the backend speech engine.
   *
   * @param text - Text to speak.
   * @param options - Utterance locale, playback rate, and optional completion
   *   callback.
   */
  speak: (text: string, options: SpeechSpeakOptions) => void
}

export interface SpeechService {
  /**
   * Cancel the current utterance through the speech backend.
   */
  cancel: () => void
  /**
   * Read the current speech rate.
   *
   * @returns The playback rate multiplier, between 1 and 3.
   */
  getRate: () => number
  /**
   * Check whether ordinary speech requests are enabled.
   *
   * @returns `true` when speech is enabled.
   */
  isEnabled: () => boolean
  /**
   * Check whether all speech requests are muted.
   *
   * @returns `true` when speech is muted, including forced requests.
   */
  isMuted: () => boolean
  /**
   * Change speech enablement and cancel playback when disabling.
   *
   * @param enabled - Whether ordinary speech requests are allowed.
   */
  setEnabled: (enabled: boolean) => void
  /**
   * Muted while screen-reader mode is active: `speak` becomes a no-op.
   *
   * @param muted - Whether all speech should be suppressed; enabling mute
   *   cancels playback.
   */
  setMuted: (muted: boolean) => void
  /**
   * Change the speech rate used for subsequent utterances.
   *
   * @param rate - Requested multiplier, clamped to the range 1 through 3.
   */
  setRate: (rate: number) => void
  /**
   * Speak text if enabled and not muted. `force` bypasses the enabled check.
   * `onEnd` is forwarded to the engine; it is not called when the request
   * is dropped by the enabled/muted guards.
   *
   * @param text - Text to speak; empty text is ignored.
   * @param options - Optional enabled-check bypass and backend completion
   *   callback.
   */
  speak: (
    text: string,
    options?: {
      /**
       * Allow speech even when ordinary speech requests are disabled.
       *
       * @default false
       */
      force?: boolean
      /**
       * Callback forwarded to the engine when an utterance finishes or fails.
       */
      onEnd?: () => void
    },
  ) => void
}

export interface I18nService {
  /**
   * Merge messages over the existing table for a locale.
   *
   * @param locale - Locale whose message table should be extended.
   * @param messages - Messages replacing entries with the same keys.
   */
  extend: (locale: LocaleCode, messages: A11yMessages) => void
  /**
   * Read the active translation locale.
   *
   * @returns The currently selected locale code.
   */
  getLocale: () => LocaleCode
  /**
   * Select the locale used by subsequent translation lookups.
   *
   * @param locale - Locale code to activate.
   */
  setLocale: (locale: LocaleCode) => void
  /**
   * Translate `key`, interpolating `{name}` placeholders from `params`.
   *
   * @param key - Message key to translate.
   * @param params - Optional values for named placeholders.
   * @returns The translated message, falling back to Chinese, English, then the
   *   key.
   */
  t: (key: string, params?: Record<string, number | string>) => string
}

/**
 * Safe page-mutation service. Every mutation is registered and reverted
 * on `unmount()` — "leave no trace" is enforced by the kernel.
 */
export interface DomService {
  /**
   * Add and track a class on the document root.
   *
   * @param className - Class token to add.
   */
  addPageClass: (className: string) => void
  /**
   * Remove every mutation this service performed.
   */
  cleanup: () => void
  /**
   * Inject a stylesheet into the page `<head>`. Returns a dispose fn.
   *
   * @param id - Service-local stylesheet id; repeated calls replace its
   *   content.
   * @param cssText - Stylesheet text to inject.
   * @returns A function that removes the tracked stylesheet for this id.
   */
  injectStyle: (id: string, cssText: string) => () => void
  /**
   * Remove a class from the document root and stop tracking it.
   *
   * @param className - Class token to remove.
   */
  removePageClass: (className: string) => void
  /**
   * Remove a CSS custom property from the document root.
   *
   * @param name - Full CSS custom property name, including its `--` prefix.
   */
  removePageVar: (name: string) => void
  /**
   * Set a CSS custom property on `document.documentElement`.
   *
   * @param name - Full CSS custom property name, including its `--` prefix.
   * @param value - CSS value assigned to the property.
   */
  setPageVar: (name: string, value: string) => void
}
