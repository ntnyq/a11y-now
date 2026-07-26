import { configurePlugin, definePlugin } from '@a11y-now/core'
import type { ConfiguredPlugin } from '@a11y-now/types'

export interface HelpApi {
  close: () => void
  isOpen: () => boolean
  open: () => void
}

const ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v2h2v-2Zm-1-11a4 4 0 0 1 4 4c0 1.5-.8 2.2-1.7 3-.8.7-1.3 1.2-1.3 2.5h-2c0-2 1-2.9 1.9-3.7.7-.6 1.1-1 1.1-1.8a2 2 0 1 0-4 0H8a4 4 0 0 1 4-4Z"/></svg>'

/**
 * Help panel: a visible dialog listing every registered shortcut.
 * The audited reference only voices its instructions; a visual panel with
 * optional speech is friendlier to everyone.
 */
const helpPlugin = definePlugin<undefined, HelpApi>({
  messages: {
    'en-US': {
      'help.close': 'Close',
      'help.desc': 'Show the shortcut guide, {shortcut}',
      'help.label': 'Help',
      'help.title': 'Keyboard shortcuts',
    },
    'zh-CN': {
      'help.close': '关闭',
      'help.desc': '打开操作说明，{shortcut}',
      'help.label': '说明',
      'help.title': '快捷键操作说明',
    },
  },
  name: 'help',
  setup: ctx => {
    let dialog: HTMLElement | null = null
    let previousFocus: HTMLElement | null = null

    const shadow = document.querySelector('a11y-now-host')?.shadowRoot ?? null

    const close = (): void => {
      dialog?.remove()
      dialog = null
      previousFocus?.focus()
      previousFocus = null
    }

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && dialog) {
        event.stopPropagation()
        close()
      }
    }

    const open = (): void => {
      if (!shadow || dialog) {
        return
      }
      previousFocus =
        (shadow.activeElement as HTMLElement | null)
        ?? (document.activeElement as HTMLElement | null)
      dialog = document.createElement('div')
      dialog.setAttribute('role', 'dialog')
      dialog.setAttribute('aria-modal', 'true')
      dialog.setAttribute('aria-label', ctx.i18n.t('help.title'))
      dialog.dataset.a11yHelp = 'true'
      const { style } = dialog
      style.position = 'fixed'
      style.insetBlockStart = '50%'
      style.insetInlineStart = '50%'
      style.transform = 'translate(-50%, -50%)'
      style.maxBlockSize = '70vh'
      style.overflow = 'auto'
      style.minInlineSize = '320px'
      style.padding = '24px'
      style.background = 'var(--a11y-color-bg)'
      style.color = 'var(--a11y-color-fg)'
      style.border = '1px solid var(--a11y-color-border)'
      style.borderRadius = 'var(--a11y-radius)'
      style.zIndex = 'var(--a11y-z-index)'
      style.fontSize = 'var(--a11y-font-size)'

      const title = document.createElement('h2')
      title.textContent = ctx.i18n.t('help.title')
      title.style.marginBlockStart = '0'
      dialog.append(title)

      const list = document.createElement('dl')
      for (const info of ctx.shortcuts.list()) {
        const dt = document.createElement('dt')
        dt.textContent = ctx.shortcuts.format(info)
        dt.style.fontWeight = 'bold'
        const dd = document.createElement('dd')
        dd.textContent = info.description
        dd.style.marginBlockEnd = '8px'
        list.append(dt, dd)
      }
      dialog.append(list)

      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.className = 'btn'
      closeBtn.textContent = ctx.i18n.t('help.close')
      closeBtn.addEventListener('click', close)
      dialog.append(closeBtn)

      shadow.append(dialog)
      closeBtn.focus()
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
        isOpen: () => dialog != null,
        open,
      },
      dispose: () => {
        document.removeEventListener('keydown', onKeydown, true)
        close()
        unregister()
        button.remove()
      },
    }
  },
})

/** Help panel plugin. `Ctrl+Alt+?`. */
export const help = (): ConfiguredPlugin<undefined, HelpApi> =>
  configurePlugin(helpPlugin, undefined)

declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    help: HelpApi
  }
}
