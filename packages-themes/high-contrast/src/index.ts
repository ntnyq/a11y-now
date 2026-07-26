import { defineTheme } from '@a11y-now/core'

/** Black background, white text, amber links (黑底白字). */
export const highContrast = defineTheme({
  displayName: { 'en-US': 'High Contrast', 'zh-CN': '黑底白字' },
  name: 'high-contrast',
  page: {
    bg: 'rgb(0, 0, 0)',
    fg: 'rgb(255, 255, 255)',
    link: 'rgb(255, 184, 0)',
  },
  toolbar: {
    'color-accent': 'rgb(255, 184, 0)',
    'color-bg': 'rgb(0, 0, 0)',
    'color-border': 'rgb(90, 90, 90)',
    'color-btn-active-bg': 'rgb(50, 50, 50)',
    'color-btn-active-fg': 'rgb(255, 184, 0)',
    'color-btn-hover-bg': 'rgb(35, 35, 35)',
    'color-disabled-fg': 'rgb(130, 130, 130)',
    'color-fg': 'rgb(255, 255, 255)',
  },
})

export default highContrast
