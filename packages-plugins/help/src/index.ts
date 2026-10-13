import { configurePlugin, css, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'
import { containModalFocus } from './modal'

export interface HelpApi {
  /**
   * Close the help dialog and restore focus to its opener.
   */
  close: () => void
  /**
   * Check whether the help dialog is currently displayed.
   *
   * @returns `true` when the help dialog is open.
   */
  isOpen: () => boolean
  /**
   * Open the help dialog with current shortcuts and move focus into it.
   */
  open: () => void
}

/**
 * Inline SVG for the help toolbar button.
 */
const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v2h2v-2Zm-1-11a4 4 0 0 1 4 4c0 1.5-.8 2.2-1.7 3-.8.7-1.3 1.2-1.3 2.5h-2c0-2 1-2.9 1.9-3.7.7-.6 1.1-1 1.1-1.8a2 2 0 1 0-4 0H8a4 4 0 0 1 4-4Z"/></svg>'

/**
 * Render `Ctrl+Alt+T` as a row of keycap chips.
 */
function keycaps(formatted: string): HTMLElement {
  const keys = document.createElement('dt')
  keys.className = 'help-keys'
  for (const segment of formatted.split('+')) {
    const kbd = document.createElement('kbd')
    kbd.textContent = segment
    keys.append(kbd)
  }
  return keys
}

/**
 * Dialog styles, injected into the shadow root next to the toolbar's.
 */
const HELP_CSS = css`
  .help-backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--a11y-color-fg) 45%, transparent);
    z-index: var(--a11y-z-index);
  }

  .help-dialog {
    position: fixed;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    inline-size: min(560px, 92vw);
    max-block-size: min(72vh, 640px);
    background: var(--a11y-color-bg);
    color: var(--a11y-color-fg);
    border: 1px solid var(--a11y-color-border);
    border-radius: calc(var(--a11y-radius) * 2);
    box-shadow: 0 16px 48px rgb(0 0 0 / 0.24);
    z-index: var(--a11y-z-index);
    font-size: var(--a11y-font-size);
  }

  .help-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px;
    border-block-end: 1px solid var(--a11y-color-border);
  }

  .help-head h2 {
    margin: 0;
    font-size: calc(var(--a11y-font-size) + 2px);
  }

  .help-close {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 32px;
    block-size: 32px;
    border: 1px solid transparent;
    border-radius: var(--a11y-radius);
    background: transparent;
    color: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: background-color var(--a11y-transition);
  }

  .help-close:hover {
    background: var(--a11y-color-btn-hover-bg);
  }

  .help-close:focus-visible {
    outline: var(--a11y-outline-width) solid var(--a11y-color-focus-ring);
    outline-offset: 2px;
  }

  .help-scroll {
    overflow: auto;
  }

  .help-scroll:focus-visible {
    outline: var(--a11y-outline-width) solid var(--a11y-color-focus-ring);
    outline-offset: -2px;
  }

  .help-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 20px;
    row-gap: 10px;
    align-items: center;
    margin: 0;
    padding: 14px 20px 20px;
  }

  .help-keys {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .help-keys kbd {
    display: inline-block;
    padding: 2px 7px;
    border: 1px solid var(--a11y-color-border);
    border-block-end-width: 2px;
    border-radius: var(--a11y-radius);
    background: var(--a11y-color-btn-hover-bg);
    color: inherit;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: calc(var(--a11y-font-size) - 2px);
    line-height: 1.5;
  }

  .help-desc {
    margin: 0;
  }
`

/**
 * Help panel: a visible dialog listing every registered shortcut with
 * keycap-style chips. The audited reference only voices its instructions;
 * a visual panel with optional speech is friendlier to everyone.
 */
const helpPlugin = definePlugin<undefined, HelpApi>({
  messages: {
    'en-US': {
      'help.close': 'Close',
      'help.desc': 'Show the shortcut guide, {shortcut}',
      'help.label': 'Help',
      'help.list': 'Shortcut list',
      'help.title': 'Keyboard shortcuts',
    },
    'zh-CN': {
      'help.close': '关闭',
      'help.desc': '打开操作说明，{shortcut}',
      'help.label': '说明',
      'help.list': '快捷键列表',
      'help.title': '快捷键操作说明',
    },
  },
  name: 'help',
  setup(ctx) {
    let dialog: HTMLElement | null = null
    let backdrop: HTMLElement | null = null
    let previousFocus: HTMLElement | null = null
    let releaseFocus: (() => void) | null = null

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null
    const styleEl = document.createElement('style')
    styleEl.textContent = HELP_CSS
    shadow?.append(styleEl)

    function close(): void {
      releaseFocus?.()
      releaseFocus = null
      dialog?.remove()
      dialog = null
      backdrop?.remove()
      backdrop = null
      previousFocus?.focus()
      previousFocus = null
    }

    function onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && dialog) {
        event.stopPropagation()
        close()
      }
    }

    function open(): void {
      if (!shadow || dialog) {
        return
      }
      previousFocus =
        (shadow.activeElement as HTMLElement | null) ??
        (document.activeElement as HTMLElement | null)

      backdrop = document.createElement('div')
      backdrop.className = 'help-backdrop'
      backdrop.addEventListener('click', close)

      dialog = document.createElement('div')
      dialog.className = 'help-dialog'
      dialog.setAttribute('role', 'dialog')
      dialog.setAttribute('aria-modal', 'true')
      dialog.setAttribute('aria-label', ctx.i18n.t('help.title'))
      dialog.dataset['a11yHelp'] = 'true'

      const head = document.createElement('div')
      head.className = 'help-head'
      const title = document.createElement('h2')
      title.textContent = ctx.i18n.t('help.title')
      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'help-close'
      closeBtn.textContent = '✕'
      closeBtn.title = ctx.i18n.t('help.close')
      closeBtn.setAttribute('aria-label', ctx.i18n.t('help.close'))
      closeBtn.addEventListener('click', close)
      head.append(title, closeBtn)
      dialog.append(head)

      // The list scrolls when shortcuts overflow the dialog; keyboard
      // users need the scroll container focusable to scroll it, and the
      // wrapper keeps the `dl` semantics intact for its dt/dd children.
      const scroller = document.createElement('div')
      scroller.className = 'help-scroll'
      scroller.setAttribute('role', 'group')
      scroller.setAttribute('aria-label', ctx.i18n.t('help.list'))
      scroller.tabIndex = 0
      const list = document.createElement('dl')
      list.className = 'help-list'
      for (const info of ctx.shortcuts.list()) {
        const dd = document.createElement('dd')
        dd.className = 'help-desc'
        dd.textContent = info.description
        list.append(keycaps(ctx.shortcuts.format(info)), dd)
      }
      scroller.append(list)
      dialog.append(scroller)

      shadow.append(backdrop, dialog)
      releaseFocus = containModalFocus(dialog, closeBtn)
      ctx.ui.announce(ctx.i18n.t('help.title'))
    }

    document.addEventListener('keydown', onKeydown, true)

    const button = ctx.ui.addItem({
      description: () =>
        ctx.i18n.t('help.desc', {
          shortcut: ctx.shortcuts.format({ alt: true, ctrl: true, key: '?' }),
        }),
      group: 'system',
      icon: ICON,
      id: 'help',
      label: () => ctx.i18n.t('help.label'),
      onPress: open,
      order: 30,
    })

    const unregister = ctx.shortcuts.register({
      alt: true,
      ctrl: true,
      description: () => ctx.i18n.t('help.label'),
      handler: open,
      id: 'help',
      key: '?',
    })

    return {
      api: {
        close,
        isOpen: () => dialog !== null,
        open,
      },
      dispose() {
        document.removeEventListener('keydown', onKeydown, true)
        close()
        unregister()
        button.remove()
        styleEl.remove()
      },
    }
  },
})

/**
 * Help panel plugin. `Ctrl+Alt+?`.
 *
 * @returns A configured help dialog plugin for toolbar registration.
 */
export function help(): ConfiguredPlugin<undefined, HelpApi> {
  return configurePlugin(helpPlugin)
}

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    /**
     * Public API exposed by the help plugin after activation.
     */
    help: HelpApi
  }
}
