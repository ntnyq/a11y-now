import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const TRIGGER_ID = 'a11y-now-trigger'

/**
 * The docs site runs the product itself (product as demo), but starts
 * disabled: a floating accessibility trigger toggles the toolbar via
 * `toggleEnabled()`, and the kernel persists the visitor's choice.
 */
export default {
  extends: DefaultTheme,
  async enhanceApp() {
    if (typeof window === 'undefined') {
      return
    }
    const { createA11yNow } = await import('a11y-now')
    if (document.querySelector(`#${TRIGGER_ID}`)) {
      return
    }
    const a11y = createA11yNow({ enabled: false })
    a11y.mount()

    const trigger = document.createElement('button')
    trigger.id = TRIGGER_ID
    trigger.type = 'button'
    trigger.textContent = '♿'
    trigger.style.cssText = [
      'position: fixed',
      'inset-block-end: 16px',
      'inset-inline-end: 16px',
      'inline-size: 44px',
      'block-size: 44px',
      // Longhands on purpose: the `border` shorthand would reset
      // border-color to currentcolor inline, beating the stylesheet below.
      'border-width: 1px',
      'border-style: solid',
      'border-radius: 50%',
      'font-size: 22px',
      'line-height: 1',
      'cursor: pointer',
      'box-shadow: 0 2px 8px rgb(0 0 0 / 0.15)',
      // Just below the toolbar itself so its dialogs stay on top.
      'z-index: 2147482999',
    ].join(';')

    // Colors live in a stylesheet so the trigger follows VitePress dark
    // mode, matching the toolbar's own scheme tokens.
    const triggerStyle = document.createElement('style')
    triggerStyle.textContent = [
      `#${TRIGGER_ID} { border-color: #d0d3d6; background: #ffffff; color: #1f2329; }`,
      `html.dark #${TRIGGER_ID} { border-color: #3c434b; background: #1e2227; color: #e8eaed; }`,
    ].join('\n')
    document.head.append(triggerStyle)

    const refresh = (): void => {
      const en = /^en\b/iu.test(document.documentElement.lang)
      const labels = a11y.mounted
        ? { en: 'Hide the accessibility toolbar', zh: '收起无障碍工具栏' }
        : { en: 'Show the accessibility toolbar', zh: '打开无障碍工具栏' }
      const label = en ? labels.en : labels.zh
      trigger.title = label
      trigger.setAttribute('aria-label', label)
      trigger.setAttribute('aria-pressed', String(a11y.mounted))
    }
    refresh()
    trigger.addEventListener('click', () => {
      a11y.toggleEnabled()
    })
    a11y.events.on('toolbar:mounted', refresh)
    a11y.events.on('toolbar:unmounted', refresh)
    document.body.append(trigger)
  },
} satisfies Theme
