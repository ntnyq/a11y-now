import {
  createA11yNow,
  createMemoryStorageAdapter,
  speakableText,
} from '@a11y-now/core'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>汉字 abc</p><pre>汉</pre></main>'
})

it('annotates Han characters with ruby and reverts exactly', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(pinyinAnnotation())
  a11y.mount()
  const api = a11y.getPlugin('pinyin')

  api?.toggle()
  const annotations = document.querySelectorAll('main p rt')
  expect([...annotations].map(rt => rt.textContent)).toStrictEqual([
    'hàn',
    'zì',
  ])
  expect(annotations[0]?.getAttribute('aria-hidden')).toBe('true')
  // Non-Han text survives, skip-listed containers stay untouched.
  expect(document.querySelector('p')?.textContent).toContain('abc')
  expect(document.querySelector('pre rt')).toBeNull()

  api?.toggle()
  expect(document.querySelector('main')?.innerHTML).toBe(
    '<p>汉字 abc</p><pre>汉</pre>',
  )
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('keeps self-voicing clean of annotation text', () => {
  const a11y = createA11yNow({ storage: null }).use(pinyinAnnotation())
  a11y.mount()
  a11y.getPlugin('pinyin')?.toggle()
  const p = document.querySelector('p') as HTMLElement
  expect(speakableText(p)).toBe('汉字 abc')
  a11y.unmount()
})

it('stops annotating once the character budget is spent', () => {
  document.body.innerHTML = '<main><p>你好</p><p>世界</p></main>'
  const a11y = createA11yNow({ storage: null }).use(
    pinyinAnnotation({ limit: 1 }),
  )
  a11y.mount()
  a11y.getPlugin('pinyin')?.toggle()
  const [first, second] = document.querySelectorAll('main p')
  expect(first?.querySelector('rt')).not.toBeNull()
  expect(second?.querySelector('rt')).toBeNull()
  a11y.unmount()
})

it('persists the toggle and re-annotates on remount', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(pinyinAnnotation())
  a11y.mount()
  a11y.getPlugin('pinyin')?.toggle()
  a11y.unmount()
  expect(document.querySelector('rt')).toBeNull()

  const again = createA11yNow({ storage }).use(pinyinAnnotation())
  again.mount()
  expect(again.getPlugin('pinyin')?.isEnabled()).toBe(true)
  expect(document.querySelector('rt')).not.toBeNull()
  again.unmount()
})

it('responds to Ctrl+Alt+P', () => {
  const a11y = createA11yNow({ storage: null }).use(pinyinAnnotation())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'p' }),
  )
  expect(a11y.getPlugin('pinyin')?.isEnabled()).toBe(true)
  expect(document.querySelector('rt')).not.toBeNull()
  a11y.unmount()
})
