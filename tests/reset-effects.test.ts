import { elderMode } from '@a11y-now/plugin-elder-mode'
import { pauseMotion } from '@a11y-now/plugin-pause-motion'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'
import { readingMask } from '@a11y-now/plugin-reading-mask'
import { textSpacing } from '@a11y-now/plugin-spacing'
import { zhConvert } from '@a11y-now/plugin-zh-convert'
import { createA11yNow, createSilentEngine } from 'a11y-now'
import { expect, it } from 'vitest'

it('resets rendered effects and controls while preserving plugin APIs', () => {
  document.body.innerHTML = '<main><p>汉语阅读</p></main>'
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({
    storage: null,
    speechEngine: createSilentEngine(),
  })
    .use(elderMode())
    .use(pauseMotion())
    .use(pinyinAnnotation())
    .use(readingMask())
    .use(textSpacing())
    .use(zhConvert())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const zoom = a11y.getPlugin('zoom')
  zoom?.zoomIn()
  a11y.getPlugin('theme')?.apply('high-contrast')
  a11y.getPlugin('pin')?.toggle()
  a11y.getPlugin('speech')?.toggleVoice()
  shadow
    ?.querySelector<HTMLButtonElement>('[data-item-id="speech-rate"]')
    ?.click()
  for (const name of [
    'big-cursor',
    'caption',
    'crosshair',
    'elder-mode',
    'pause-motion',
    'pinyin',
    'reading-mask',
    'zh-convert',
    'screen-reader',
  ] as const) {
    a11y.getPlugin(name)?.toggle()
  }
  a11y.getPlugin('spacing')?.setLevel(1)
  expect(document.querySelector('[data-a11y-now="big-cursor"]')).not.toBeNull()
  expect(shadow?.querySelector('[data-a11y-caption]')).not.toBeNull()
  expect(a11y.speech.isMuted()).toBe(true)
  a11y.getPlugin('reset')?.reset()
  a11y.resetAll()

  expect(a11y.getPlugin('zoom')).toBe(zoom)
  expect(zoom?.getScale()).toBe(1)
  expect(a11y.speech.isMuted()).toBe(false)
  expect(a11y.speech.isEnabled()).toBe(true)
  expect(a11y.speech.getRate()).toBe(1)
  expect(a11y.themes.current()?.name).toBe('default')
  expect(Object.hasOwn(document.documentElement.dataset, 'a11yTheme')).toBe(
    false,
  )
  expect(
    document.documentElement.classList.contains('a11y-screen-reader'),
  ).toBe(false)
  expect(document.querySelector('[data-a11y-now="pin"]')).not.toBeNull()
  for (const id of [
    'big-cursor',
    'elder-mode',
    'pause-motion',
    'spacing',
    'zoom',
    'theme-page',
  ]) {
    expect(document.querySelector(`[data-a11y-now="${id}"]`)).toBeNull()
  }
  expect(document.querySelector('[data-a11y-pinyin]')).toBeNull()
  expect(document.querySelector('p')?.textContent).toBe('汉语阅读')
  expect(shadow?.querySelector('[data-a11y-caption]')).toBeNull()
  expect(
    shadow?.querySelectorAll('div[style*="position: fixed"]'),
  ).toHaveLength(0)
  for (const id of [
    'big-cursor',
    'caption',
    'crosshair',
    'elder-mode',
    'pause-motion',
    'pinyin',
    'reading-mask',
    'zh-convert',
    'screen-reader',
    'spacing',
  ]) {
    expect(
      shadow
        ?.querySelector(`[data-item-id="${id}"]`)
        ?.getAttribute('aria-pressed'),
    ).toBe('false')
  }
  expect(
    shadow?.querySelector('[data-item-id="pin"]')?.getAttribute('aria-pressed'),
  ).toBe('true')
  zoom?.zoomIn()
  expect(document.querySelector('[data-a11y-now="zoom"]')).not.toBeNull()
  a11y.destroy()
  expect(document.documentElement.outerHTML).toBe(before)
})
