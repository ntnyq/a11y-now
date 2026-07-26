import { defineTheme } from '@a11y-now/core'

/** Deep blue background with white text (深蓝白). */
export const deepBlue = defineTheme({
  displayName: { 'en-US': 'Deep Blue', 'zh-CN': '深蓝白' },
  name: 'deep-blue',
  page: {
    bg: 'rgb(0, 51, 92)',
    fg: 'rgb(255, 255, 255)',
    link: 'rgb(255, 255, 255)',
  },
  toolbar: {
    'color-bg': 'rgb(0, 51, 92)',
    'color-border': 'rgb(60, 104, 141)',
    'color-btn-active-bg': 'rgb(28, 82, 129)',
    'color-btn-active-fg': 'rgb(255, 255, 255)',
    'color-btn-hover-bg': 'rgb(18, 70, 114)',
    'color-disabled-fg': 'rgb(140, 165, 186)',
    'color-fg': 'rgb(255, 255, 255)',
  },
})

export default deepBlue
