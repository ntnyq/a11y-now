import type { A11yTheme } from '@a11y-now/types'

/** Forest green background with white text (森林绿). */
export const forest = {
  displayName: { 'en-US': 'Forest', 'zh-CN': '森林绿' },
  name: 'forest',
  page: {
    bg: 'rgb(34, 139, 34)',
    fg: 'rgb(255, 255, 255)',
    link: 'rgb(255, 255, 255)',
  },
  toolbar: {
    'color-bg': 'rgb(34, 139, 34)',
    'color-border': 'rgb(90, 170, 90)',
    'color-btn-active-bg': 'rgb(60, 160, 60)',
    'color-btn-active-fg': 'rgb(255, 255, 255)',
    'color-btn-hover-bg': 'rgb(48, 152, 48)',
    'color-disabled-fg': 'rgb(170, 205, 170)',
    'color-fg': 'rgb(255, 255, 255)',
  },
} satisfies A11yTheme

export default forest
