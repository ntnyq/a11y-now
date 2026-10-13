import { createA11yNow } from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

function mountToolbar() {
  const a11y = createA11yNow({ storage: null }).use(zoom())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const buttons = [...(shadow?.querySelectorAll('button') ?? [])]
  return { a11y, buttons, shadow }
}

function press(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
}

function tabStops(buttons: HTMLButtonElement[]): number[] {
  return buttons.map(button => button.tabIndex)
}

it('arrow keys rove the toolbar tab stop, wrapping at the edges', () => {
  const { a11y, buttons } = mountToolbar()
  expect(buttons.length).toBeGreaterThan(1)
  const first = buttons[0] as HTMLButtonElement

  press(first, 'ArrowRight')
  expect(tabStops(buttons)[0]).toBe(0)

  press(first, 'End')
  expect(tabStops(buttons).at(-1)).toBe(0)
  expect(tabStops(buttons)[0]).toBe(-1)

  press(first, 'Home')
  expect(tabStops(buttons)[0]).toBe(0)

  // ArrowLeft from the first button wraps to the last one.
  press(first, 'ArrowLeft')
  expect(tabStops(buttons).at(-1)).toBe(0)

  // Unrelated keys leave the roving state untouched.
  press(first, 'a')
  expect(tabStops(buttons).at(-1)).toBe(0)
  a11y.unmount()
})

it('merges message overrides and switches locales', () => {
  const a11y = createA11yNow({
    locale: 'en-US',
    messages: { 'en-US': { greet: 'Hi {name}' } },
    storage: null,
  })
  expect(a11y.i18n.t('greet', { name: 'Ada' })).toBe('Hi Ada')
  expect(a11y.i18n.t('missing.key')).toBe('missing.key')
  expect(a11y.i18n.t('toolbar.label')).toBe('Accessibility toolbar')

  a11y.i18n.setLocale('zh-CN')
  expect(a11y.i18n.getLocale()).toBe('zh-CN')
  expect(a11y.i18n.t('toolbar.label')).toBe('无障碍工具栏')
})
