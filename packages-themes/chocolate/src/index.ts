import type { A11yTheme } from '@a11y-now/types'

/** Chocolate background with white text (巧克力色). */
export const chocolate = {
  displayName: { 'en-US': 'Chocolate', 'zh-CN': '巧克力色' },
  name: 'chocolate',
  page: {
    bg: 'rgb(98, 43, 43)',
    fg: 'rgb(255, 255, 255)',
    link: 'rgb(255, 255, 255)',
  },
  toolbar: {
    'color-bg': 'rgb(98, 43, 43)',
    'color-border': 'rgb(140, 90, 90)',
    'color-btn-active-bg': 'rgb(130, 70, 70)',
    'color-btn-active-fg': 'rgb(255, 255, 255)',
    'color-btn-hover-bg': 'rgb(118, 60, 60)',
    'color-disabled-fg': 'rgb(190, 160, 160)',
    'color-fg': 'rgb(255, 255, 255)',
  },
} satisfies A11yTheme

export default chocolate
