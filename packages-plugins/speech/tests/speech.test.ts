import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { speech } from '@a11y-now/plugin-speech'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>你好世界</p></main>'
})

const engine = () => {
  const speak = vi.fn()
  return { engine: { available: true, cancel: () => {}, speak }, speak }
}

it('toggles voice and persists the choice', () => {
  const storage = createMemoryStorageAdapter()
  const { engine: speechEngine } = engine()
  const a11y = createA11yNow({ speechEngine, storage }).use(speech())
  a11y.mount()

  expect(a11y.speech.isEnabled()).toBe(true)
  a11y.getPlugin('speech')?.toggleVoice()
  expect(a11y.speech.isEnabled()).toBe(false)
  a11y.unmount()

  const again = createA11yNow({ speechEngine, storage }).use(speech())
  again.mount()
  expect(again.speech.isEnabled()).toBe(false)
  again.unmount()
})

it('cycles rate via Ctrl+Alt+K through the defined ladder', () => {
  const { engine: speechEngine } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()
  expect(a11y.speech.getRate()).toBe(1)
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'k' }),
  )
  expect(a11y.speech.getRate()).toBe(1.25)
  a11y.unmount()
})

it('continuous mode reads the main content', () => {
  const { engine: speechEngine, speak } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()
  a11y.getPlugin('speech')?.setMode('continuous')
  const texts = speak.mock.calls.map(call => call[0])
  expect(texts.some(text => String(text).includes('你好世界'))).toBe(true)
  a11y.unmount()
})

it('point mode reads hovered elements (debounced)', () => {
  vi.useFakeTimers()
  const { engine: speechEngine, speak } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()

  const p = document.querySelector('p') as HTMLElement
  p.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  vi.advanceTimersByTime(200)
  const texts = speak.mock.calls.map(call => call[0])
  expect(texts.some(text => String(text).includes('你好世界'))).toBe(true)
  a11y.unmount()
  vi.useRealTimers()
})

it('unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const { engine: speechEngine } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
