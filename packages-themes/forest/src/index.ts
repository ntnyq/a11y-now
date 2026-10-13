import { defineTheme } from '@a11y-now/core'

/**
 * Forest green background with white text (森林绿).
 */
export const forest = defineTheme({
  displayName: { 'en-US': 'Forest', 'zh-CN': '森林绿' },
  name: 'forest',
  page: {
    bg: 'rgb(24, 105, 36)',
    fg: 'rgb(255, 255, 255)',
    link: 'rgb(255, 255, 255)',
  },
  toolbar: {
    'color-accent': 'rgb(255, 255, 255)',
    'color-bg': 'rgb(24, 105, 36)',
    'color-border': 'rgb(90, 170, 90)',
    'color-btn-active-bg': 'rgb(32, 116, 44)',
    'color-btn-active-fg': 'rgb(255, 255, 255)',
    'color-btn-hover-bg': 'rgb(28, 112, 40)',
    'color-disabled-fg': 'rgb(170, 205, 170)',
    'color-fg': 'rgb(255, 255, 255)',
  },
})

export default forest
