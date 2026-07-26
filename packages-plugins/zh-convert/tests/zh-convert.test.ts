import { setTimeout as delay } from 'node:timers/promises'
import { createA11yNow } from '@a11y-now/core'
import { zhConvert } from '@a11y-now/plugin-zh-convert'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>汉语转换</p><code>汉</code></main>'
})

/**
 * MutationObserver delivery goes through happy-dom's timer queue, which can
 * lose the race against a single 0ms delay on slow runners — poll instead.
 */
const until = async (predicate: () => boolean): Promise<void> => {
  for (let i = 0; i < 100 && !predicate(); i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential polling by design
    await delay(5)
  }
}

it('converts visible text to traditional and restores it exactly', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(zhConvert())
  a11y.mount()
  const api = a11y.getPlugin('zh-convert')

  api?.toggle()
  expect(document.querySelector('p')?.textContent).toBe('漢語轉換')
  // Skip-listed containers keep the original text.
  expect(document.querySelector('code')?.textContent).toBe('汉')

  api?.toggle()
  expect(document.querySelector('p')?.textContent).toBe('汉语转换')
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('watches dynamically inserted and changed text', async () => {
  const a11y = createA11yNow({ storage: null }).use(zhConvert())
  a11y.mount()
  a11y.getPlugin('zh-convert')?.toggle()

  const added = document.createElement('p')
  added.textContent = '简体'
  document.querySelector('main')?.append(added)
  await until(() => added.textContent === '簡體')
  expect(added.textContent).toBe('簡體')

  const existing = document.querySelector('p')?.firstChild as Text
  existing.data = '发现问题'
  await until(() => document.querySelector('p')?.textContent === '發現問題')
  expect(document.querySelector('p')?.textContent).toBe('發現問題')

  a11y.getPlugin('zh-convert')?.toggle()
  expect(added.textContent).toBe('简体')
  a11y.unmount()
})

it('supports a custom converter and direction options', () => {
  const a11y = createA11yNow({ storage: null }).use(
    zhConvert({ convert: text => text.replaceAll('汉', '△') }),
  )
  a11y.mount()
  a11y.getPlugin('zh-convert')?.toggle()
  expect(document.querySelector('p')?.textContent).toBe('△语转换')
  a11y.unmount()
})

it('unmounts mid-conversion without residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(zhConvert())
  a11y.mount()
  a11y.getPlugin('zh-convert')?.toggle()
  expect(document.querySelector('p')?.textContent).toBe('漢語轉換')
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
