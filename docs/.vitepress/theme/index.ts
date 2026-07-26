import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

/**
 * The docs site runs the product itself: the full a11y-now toolbar is
 * mounted on every page (product as demo). `wasExited` keeps the user's
 * previous "exit" choice.
 */
export default {
  extends: DefaultTheme,
  async enhanceApp() {
    if (typeof window === 'undefined') {
      return
    }
    const { createA11yNow, wasExited } = await import('a11y-now')
    if (!wasExited() && !document.querySelector('a11y-now-host')) {
      createA11yNow().mount()
    }
  },
} satisfies Theme
