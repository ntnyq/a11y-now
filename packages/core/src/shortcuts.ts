import {
  formatShortcut,
  isBrowser,
  matchShortcut,
  normalizeShortcut,
} from '@a11y-now/shared'
import type { ShortcutDef, ShortcutInfo, ShortcutService } from '@a11y-now/types'

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
 * swallow accessibility shortcuts.
 */
export const createShortcutCenter = (): ShortcutCenter => {
  const registrations = new Map<string, Registration>()
  let enabled = true

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
      if (isBrowser()) {
        window.removeEventListener('keydown', onKeydown, true)
      }
    },
    format: formatShortcut,
    list: (): ShortcutInfo[] =>
      [...registrations.values()].map(({ description, handler, ...def }) => ({
        ...def,
        description:
          typeof description === 'function' ? description() : description,
      })),
    register: def => {
      const key = normalizeShortcut(def)
      const existing = registrations.get(key)
      if (existing && existing.id !== def.id) {
        throw new Error(
          `[a11y-now] shortcut conflict: "${formatShortcut(def)}" is `
          + `registered by both "${existing.id}" and "${def.id}"`,
        )
      }
      registrations.set(key, def)
      return () => {
        if (registrations.get(key)?.id === def.id) {
          registrations.delete(key)
        }
      }
    },
    setEnabled: value => {
      enabled = value
    },
  }
}
