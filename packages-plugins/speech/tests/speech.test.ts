import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { speech } from '@a11y-now/plugin-speech'
import type { SpeechSpeakOptions } from '@a11y-now/types'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>你好世界</p></main>'
})

function engine() {
  const calls: { onEnd?: (() => void) | undefined; text: string }[] = []
  return {
    calls,
    engine: {
      available: true,
      cancel() {},
      speak(text: string, options: SpeechSpeakOptions) {
        calls.push({ onEnd: options.onEnd, text })
      },
    },
    /**
     * Speak calls that belong to the continuous queue (they carry onEnd).
     */
    segments: () => calls.filter(call => call.onEnd),
  }
}

function reading() {
  return document.querySelector('[data-a11y-reading]')?.textContent ?? null
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

it('continuous mode queues leaf blocks and reads them in turn', () => {
  document.body.innerHTML =
    '<main><h2>标题</h2><ul><li><p>第一段内容</p></li></ul><p>第二段内容</p></main>'
  const { engine: speechEngine, segments } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()

  const progress: { index: number; total: number }[] = []
  const done = vi.fn<() => void>()
  a11y.events.on('speech:reading', payload => progress.push(payload))
  a11y.events.on('speech:reading-end', done)

  a11y.getPlugin('speech')?.setMode('continuous')

  // Segment 1 speaking, highlighted, style injected.
  expect(segments().map(s => s.text)).toStrictEqual(['标题'])
  expect(a11y.getPlugin('speech')?.isReading()).toBe(true)
  expect(reading()).toBe('标题')
  expect(
    document.head.querySelector('[data-a11y-now="speech-reading"]'),
  ).not.toBeNull()
  expect(progress).toStrictEqual([{ index: 0, total: 3 }])

  // Finishing a segment advances the queue — the <li> wrapper is skipped
  // in favor of its leaf <p>.
  segments()[0]?.onEnd?.()
  expect(segments().map(s => s.text)).toStrictEqual(['标题', '第一段内容'])
  expect(reading()).toBe('第一段内容')

  segments()[1]?.onEnd?.()
  expect(reading()).toBe('第二段内容')
  expect(done).not.toHaveBeenCalled()

  // Last segment done: pass ends, page is clean again.
  segments()[2]?.onEnd?.()
  expect(done).toHaveBeenCalledTimes(1)
  expect(progress).toHaveLength(3)
  expect(reading()).toBeNull()
  expect(
    document.head.querySelector('[data-a11y-now="speech-reading"]'),
  ).toBeNull()
  expect(a11y.getPlugin('speech')?.isReading()).toBe(false)
  a11y.unmount()
})

it('stale completions from a cancelled pass are ignored', () => {
  document.body.innerHTML = '<main><p>甲段落</p><p>乙段落</p></main>'
  const { engine: speechEngine, segments } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()

  const api = a11y.getPlugin('speech')
  api?.readPage()
  const [first] = segments()
  api?.stopReading()
  expect(api?.isReading()).toBe(false)

  first?.onEnd?.()
  // The stale onEnd must not restart the queue.
  expect(segments()).toHaveLength(1)
  expect(reading()).toBeNull()
  a11y.unmount()
})

it('turning voice off or leaving continuous mode stops the pass', () => {
  document.body.innerHTML = '<main><p>甲段落</p><p>乙段落</p></main>'
  const { engine: speechEngine } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()
  const api = a11y.getPlugin('speech')
  const done = vi.fn<() => void>()
  a11y.events.on('speech:reading-end', done)

  api?.setMode('continuous')
  expect(api?.isReading()).toBe(true)
  api?.toggleVoice()
  expect(api?.isReading()).toBe(false)
  expect(done).toHaveBeenCalledTimes(1)
  expect(reading()).toBeNull()

  api?.toggleVoice()
  api?.setMode('continuous')
  expect(api?.isReading()).toBe(true)
  api?.setMode('point')
  expect(api?.isReading()).toBe(false)
  a11y.unmount()
})

it('continuousLimit clips the queued characters', () => {
  document.body.innerHTML = '<main><p>一二三四</p><p>五六七八</p></main>'
  const { engine: speechEngine, segments } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(
    speech({ continuousLimit: 5 }),
  )
  a11y.mount()
  const api = a11y.getPlugin('speech')
  api?.readPage()
  segments()[0]?.onEnd?.()
  segments()[1]?.onEnd?.()
  expect(segments().map(s => s.text)).toStrictEqual(['一二三四', '五'])
  a11y.unmount()
})

it('point mode reads hovered elements (debounced)', () => {
  vi.useFakeTimers()
  const { engine: speechEngine, calls } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()

  const p = document.querySelector('p') as HTMLElement
  p.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  vi.advanceTimersByTime(200)
  const texts = calls.map(call => call.text)
  expect(texts.some(text => text.includes('你好世界'))).toBe(true)
  a11y.unmount()
  vi.useRealTimers()
})

it('unmount mid-pass leaves no residue', () => {
  document.body.innerHTML = '<main><p>甲段落</p><p>乙段落</p></main>'
  const before = document.documentElement.outerHTML
  const { engine: speechEngine } = engine()
  const a11y = createA11yNow({ speechEngine, storage: null }).use(speech())
  a11y.mount()
  a11y.getPlugin('speech')?.readPage()
  expect(reading()).not.toBeNull()
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
