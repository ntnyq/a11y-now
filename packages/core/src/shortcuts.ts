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
  description: string | (() => string)
  handler: () => void
  id: string
}

export interface ShortcutCenter extends ShortcutService {
  destroy: () => void
  setEnabled: (enabled: boolean) => void
}

/**
 * Central keyboard shortcut registry with conflict detection.
 * Listens on `window` in the capture phase so page handlers cannot
 * swallow accessibility shortcuts. Per-id overrides remap or disable
 * bindings without touching the owning plugin.
 */
export const createShortcutCenter = (
  initialOverrides?: Record<string, Partial<ShortcutDef> | null>,
): ShortcutCenter => {
  /** Active bindings keyed by normalized combo. */
  const registrations = new Map<string, Registration>()
  /** Original definitions per shortcut id, for re-binding on override. */
  const defaults = new Map<string, Registration>()
  const overrides = new Map<string, Partial<ShortcutDef> | null>(
    Object.entries(initialOverrides ?? {}),
  )
  let enabled = true

  const comboOf = (id: string): string | null => {
    for (const [combo, registration] of registrations) {
      if (registration.id === id) {
        return combo
      }
    }
    return null
  }

  const bind = (def: Registration): void => {
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

  const unbind = (id: string): void => {
    const combo = comboOf(id)
    if (combo !== null) {
      registrations.delete(combo)
    }
  }

  const onKeydown = (event: KeyboardEvent): void => {
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

  if (isBrowser()) {
    window.addEventListener('keydown', onKeydown, true)
  }

  return {
    destroy: () => {
      registrations.clear()
      defaults.clear()
      if (isBrowser()) {
        window.removeEventListener('keydown', onKeydown, true)
      }
    },
    format: formatShortcut,
    list: (): ShortcutInfo[] => {
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
    register: def => {
      defaults.set(def.id, def)
      bind(def)
      return () => {
        unbind(def.id)
        defaults.delete(def.id)
      }
    },
    setEnabled: value => {
      enabled = value
    },
    setOverride: (id, override) => {
      overrides.set(id, override)
      const def = defaults.get(id)
      if (def) {
        unbind(id)
        bind(def)
      }
    },
  }
}
