import {
  formatShortcut,
  isBrowser,
  matchShortcut,
  normalizeShortcut,
} from '@a11y-now/shared'
import type {
  ShortcutDef,
  ShortcutInfo,
  ShortcutService,
} from '@a11y-now/types'

interface Registration extends ShortcutDef {
  /**
   * Shortcut description, resolved lazily when supplied as a callback.
   */
  description: string | (() => string)
  /**
   * Callback invoked when the enabled shortcut matches a keyboard event.
   */
  handler: () => void
  /**
   * Unique shortcut id used for registration and binding overrides.
   */
  id: string
}

export interface ShortcutCenter extends ShortcutService {
  /**
   * Clear shortcut registrations and remove the keyboard listener.
   */
  destroy: () => void
  /**
   * Enable or suppress dispatch of registered keyboard shortcuts.
   *
   * @param enabled - Whether matching keyboard events should invoke handlers.
   */
  setEnabled: (enabled: boolean) => void
}

/**
 * Central keyboard shortcut registry with conflict detection.
 * Listens on `window` in the capture phase so page handlers cannot
 * swallow accessibility shortcuts. Per-id overrides remap or disable
 * bindings without touching the owning plugin.
 *
 * @param initialOverrides - Per-id binding overrides; `null` disables a
 *   shortcut.
 * @param initiallyEnabled - Whether bindings can dispatch before explicit activation.
 * @returns A shortcut registry; call `destroy()` to remove its keyboard
 *   listener.
 */
export function createShortcutCenter(
  initialOverrides?: Record<string, Partial<ShortcutDef> | null>,
  initiallyEnabled = true,
): ShortcutCenter {
  /**
   * Active bindings keyed by normalized combo.
   */
  const registrations = new Map<string, Registration>()
  /**
   * Original definitions per shortcut id, for re-binding on override.
   */
  const defaults = new Map<string, Registration>()
  const overrides = new Map<string, Partial<ShortcutDef> | null>(
    Object.entries(initialOverrides ?? {}),
  )
  let enabled = initiallyEnabled
  let listening = false

  function comboOf(id: string): string | null {
    for (const [combo, registration] of registrations) {
      if (registration.id === id) {
        return combo
      }
    }
    return null
  }

  function bind(def: Registration): void {
    const override = overrides.get(def.id)
    if (override === null) {
      return
    }
    const effective: Registration = { ...def, ...override }
    const combo = normalizeShortcut(effective)
    const existing = registrations.get(combo)
    if (existing && existing.id !== effective.id) {
      throw new Error(
        `[a11y-now] shortcut conflict: "${formatShortcut(effective)}" is ` +
          `registered by both "${existing.id}" and "${effective.id}"`,
      )
    }
    registrations.set(combo, effective)
  }

  function unbind(id: string): void {
    const combo = comboOf(id)
    if (combo !== null) {
      registrations.delete(combo)
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!enabled) {
      return
    }
    for (const registration of registrations.values()) {
      if (matchShortcut(event, registration)) {
        event.preventDefault()
        event.stopPropagation()
        registration.handler()
        return
      }
    }
  }

  function syncListener(): void {
    const needed = enabled && registrations.size > 0 && isBrowser()
    if (needed === listening) {
      return
    }
    listening = needed
    if (needed) {
      window.addEventListener('keydown', onKeydown, true)
    } else if (isBrowser()) {
      window.removeEventListener('keydown', onKeydown, true)
    }
  }

  return {
    destroy() {
      registrations.clear()
      defaults.clear()
      syncListener()
    },
    format: formatShortcut,
    list(): ShortcutInfo[] {
      const infos: ShortcutInfo[] = []
      for (const registration of registrations.values()) {
        const { description, handler: _handler, ...def } = registration
        infos.push({
          ...def,
          description:
            typeof description === 'function' ? description() : description,
        })
      }
      return infos
    },
    register(def) {
      bind(def)
      defaults.set(def.id, def)
      syncListener()
      return () => {
        unbind(def.id)
        defaults.delete(def.id)
        syncListener()
      }
    },
    setEnabled(value) {
      enabled = value
      syncListener()
    },
    setOverride(id, override) {
      overrides.set(id, override)
      const def = defaults.get(id)
      if (def) {
        unbind(id)
        bind(def)
        syncListener()
      }
    },
  }
}
