import { resolveLabel } from '@a11y-now/shared'
import type {
  I18nService,
  SpeechService,
  ToolbarGroup,
  ToolbarItemDef,
  ToolbarItemHandle,
  ToolbarUI,
} from '@a11y-now/types'

const GROUP_ORDER: ToolbarGroup[] = ['region', 'tool', 'system']

export interface ToolbarView extends ToolbarUI {
  destroy: () => void
  readonly el: HTMLElement
  /** Show/hide items flagged `hideInScreenReaderMode`. */
  setScreenReaderMode: (enabled: boolean) => void
}

/**
 * Render the toolbar inside the shadow root.
 *
 * Keyboard support follows the WAI-ARIA toolbar pattern: one tab stop,
 * arrow keys move between buttons (roving tabindex), Home/End jump.
 */
export const createToolbar = (
  shadow: ShadowRoot,
  i18n: I18nService,
  speech: SpeechService,
): ToolbarView => {
  const doc = shadow.ownerDocument ?? document
  const root = doc.createElement('div')
  root.className = 'toolbar'
  root.setAttribute('role', 'toolbar')
  root.setAttribute('aria-label', i18n.t('toolbar.label'))
  shadow.append(root)

  const live = doc.createElement('div')
  live.className = 'sr-only'
  live.setAttribute('aria-live', 'polite')
  live.setAttribute('aria-atomic', 'true')
  shadow.append(live)

  const groups = new Map<ToolbarGroup, HTMLElement>()
  const groupLabelKey: Record<ToolbarGroup, string> = {
    region: 'toolbar.region.group',
    system: 'toolbar.system.group',
    tool: 'toolbar.tool.group',
  }
  for (const group of GROUP_ORDER) {
    const el = doc.createElement('div')
    el.className = 'group'
    el.dataset.group = group
    el.setAttribute('role', 'group')
    el.setAttribute('aria-label', i18n.t(groupLabelKey[group]))
    el.hidden = true
    root.append(el)
    groups.set(group, el)
  }

  interface Entry {
    def: ToolbarItemDef
    el: HTMLButtonElement
  }
  const entries = new Map<string, Entry>()

  const focusables = (): HTMLButtonElement[] =>
    [...entries.values()]
      .map(entry => entry.el)
      .filter(el => el.isConnected && !el.hidden)

  const onKeydown = (event: KeyboardEvent): void => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) {
      return
    }
    const buttons = focusables()
    if (buttons.length === 0) {
      return
    }
    const active = shadow.activeElement as HTMLButtonElement | null
    let index = buttons.indexOf(active as HTMLButtonElement)
    if (event.key === 'ArrowRight') {
      index = (index + 1) % buttons.length
    } else if (event.key === 'ArrowLeft') {
      index = index <= 0 ? buttons.length - 1 : index - 1
    } else if (event.key === 'Home') {
      index = 0
    } else {
      index = buttons.length - 1
    }
    event.preventDefault()
    for (const [i, button] of buttons.entries()) {
      button.tabIndex = i === index ? 0 : -1
    }
    buttons[index]?.focus()
  }
  root.addEventListener('keydown', onKeydown)

  const syncTabStops = (): void => {
    const buttons = focusables()
    for (const [i, button] of buttons.entries()) {
      button.tabIndex = i === 0 ? 0 : -1
    }
  }

  const renderContent = (
    button: HTMLButtonElement,
    def: ToolbarItemDef,
    badge?: number | string,
  ): void => {
    button.textContent = ''
    if (def.icon) {
      const icon = doc.createElement('span')
      icon.className = 'icon'
      icon.setAttribute('aria-hidden', 'true')
      icon.innerHTML = def.icon
      button.append(icon)
    }
    const label = doc.createElement('span')
    label.className = 'label'
    label.textContent = resolveLabel(def.label)
    button.append(label)
    if (badge !== undefined) {
      const badgeEl = doc.createElement('span')
      badgeEl.className = 'badge'
      badgeEl.textContent = `(${badge})`
      button.append(badgeEl)
    }
    const description = resolveLabel(def.description)
    if (description) {
      button.title = description
      button.setAttribute('aria-label', `${resolveLabel(def.label)}，${description}`)
    }
  }

  const addItem = (def: ToolbarItemDef): ToolbarItemHandle => {
    const group = groups.get(def.group ?? 'tool') as HTMLElement
    group.hidden = false
    const button = doc.createElement('button')
    button.type = 'button'
    button.className = 'btn'
    button.dataset.itemId = def.id
    if (def.hideInScreenReaderMode) {
      button.dataset.hideInSr = 'true'
    }
    button.style.order = String(def.order ?? 0)
    if (def.pressed !== undefined) {
      button.setAttribute('aria-pressed', String(def.pressed))
    }
    button.disabled = def.disabled ?? false
    renderContent(button, def)
    button.addEventListener('click', () => {
      if (!button.disabled) {
        def.onPress?.()
      }
    })
    group.append(button)
    const entry: Entry = { def: { ...def }, el: button }
    entries.set(def.id, entry)
    syncTabStops()

    return {
      el: button,
      remove: () => {
        button.remove()
        entries.delete(def.id)
        if (group.childElementCount === 0) {
          group.hidden = true
        }
        syncTabStops()
      },
      update: patch => {
        if (patch.label !== undefined) {
          entry.def.label = patch.label
        }
        if (patch.description !== undefined) {
          entry.def.description = patch.description
        }
        if (patch.pressed !== undefined) {
          entry.def.pressed = patch.pressed
          button.setAttribute('aria-pressed', String(patch.pressed))
        }
        if (patch.disabled !== undefined) {
          entry.def.disabled = patch.disabled
          button.disabled = patch.disabled
        }
        renderContent(button, entry.def, patch.badge)
      },
    }
  }

  return {
    addItem,
    announce: text => {
      live.textContent = text
      speech.speak(text)
    },
    destroy: () => {
      root.removeEventListener('keydown', onKeydown)
      root.remove()
      live.remove()
      entries.clear()
    },
    el: root,
    setScreenReaderMode: enabled => {
      for (const entry of entries.values()) {
        if (entry.el.dataset.hideInSr === 'true') {
          entry.el.hidden = enabled
        }
      }
      syncTabStops()
    },
  }
}
