import { setTimeout as delay } from 'node:timers/promises'
import {
  createRemoteTTSEngine,
  createSilentEngine,
  createWebSpeechEngine,
} from '@a11y-now/core'
import { afterEach, expect, it, vi } from 'vitest'

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = []
  paused = false
  playbackRate = 1
  played = false
  src: string

  constructor(src: string) {
    super()
    this.src = src
    FakeAudio.instances.push(this)
  }

  pause(): void {
    this.paused = true
  }

  play(): Promise<void> {
    this.played = true
    return Promise.resolve()
  }

  removeAttribute(): void {
    this.src = ''
  }
}

function flush(): Promise<void> {
  return delay(0)
}

afterEach(() => {
  FakeAudio.instances = []
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup(fetchImpl: typeof fetch) {
  vi.stubGlobal('Audio', FakeAudio)
  return createRemoteTTSEngine({
    endpoint: '/api/tts',
    fetchImpl,
    headers: { authorization: 'Bearer token' },
    resolveAudio: () => Promise.resolve('blob:mock'),
  })
}

it('POSTs the utterance and plays the resolved audio', async () => {
  const fetchImpl = vi.fn<() => Promise<Response>>(() =>
    Promise.resolve(new Response('audio')),
  )
  const engine = setup(fetchImpl as unknown as typeof fetch)
  expect(engine.available).toBe(true)

  const onEnd = vi.fn<() => void>()
  engine.speak('你好', { locale: 'zh-CN', onEnd, rate: 1.5 })
  await flush()

  expect(fetchImpl).toHaveBeenCalledTimes(1)
  const [url, init] = fetchImpl.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ]
  expect(url).toBe('/api/tts')
  expect(init.method).toBe('POST')
  expect(JSON.parse(String(init.body))).toStrictEqual({
    locale: 'zh-CN',
    rate: 1.5,
    text: '你好',
  })
  expect((init.headers as Record<string, string>)['authorization']).toBe(
    'Bearer token',
  )

  const audio = FakeAudio.instances[0] as FakeAudio
  expect(audio.src).toBe('blob:mock')
  expect(audio.played).toBe(true)
  expect(audio.playbackRate).toBe(1.5)

  expect(onEnd).not.toHaveBeenCalled()
  audio.dispatchEvent(new Event('ended'))
  expect(onEnd).toHaveBeenCalledTimes(1)
})

it('a new speak supersedes an in-flight fetch', async () => {
  const fetchImpl = vi.fn<
    (input: unknown, init?: RequestInit) => Promise<Response>
  >(async (input, init) => {
    const body = JSON.parse(String(init?.body)) as { text: string }
    if (body.text === 'first') {
      // Keep the first request in flight until after the second speaks.
      await delay(10)
    }
    return new Response('audio')
  })
  const engine = setup(fetchImpl as unknown as typeof fetch)

  const firstEnd = vi.fn<() => void>()
  engine.speak('first', { locale: 'zh-CN', onEnd: firstEnd, rate: 1 })
  engine.speak('second', { locale: 'zh-CN', rate: 1 })
  await delay(30)

  // Only the second utterance ever reaches playback.
  expect(FakeAudio.instances).toHaveLength(1)
  expect(firstEnd).not.toHaveBeenCalled()
})

it('cancel stops playback and later completions are ignored', async () => {
  const fetchImpl = vi.fn<() => Promise<Response>>(() =>
    Promise.resolve(new Response('audio')),
  )
  const engine = setup(fetchImpl as unknown as typeof fetch)
  const onEnd = vi.fn<() => void>()
  engine.speak('text', { locale: 'zh-CN', onEnd, rate: 1 })
  await flush()

  const audio = FakeAudio.instances[0] as FakeAudio
  engine.cancel()
  expect(audio.paused).toBe(true)
  audio.dispatchEvent(new Event('ended'))
  expect(onEnd).not.toHaveBeenCalled()
})

it('reports failures once and still signals onEnd', async () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const fetchImpl = vi.fn<() => Promise<Response>>(() =>
    Promise.resolve(new Response('nope', { status: 500 })),
  )
  const engine = setup(fetchImpl as unknown as typeof fetch)

  const onEnd = vi.fn<() => void>()
  engine.speak('a', { locale: 'zh-CN', onEnd, rate: 1 })
  await flush()
  engine.speak('b', { locale: 'zh-CN', onEnd, rate: 1 })
  await flush()

  expect(onEnd).toHaveBeenCalledTimes(2)
  expect(warnSpy).toHaveBeenCalledTimes(1)
  expect(FakeAudio.instances).toHaveLength(0)
})

it('silent engine reports instant completion', async () => {
  const engine = createSilentEngine()
  const onEnd = vi.fn<() => void>()
  engine.speak('text', { locale: 'zh-CN', onEnd, rate: 1 })
  expect(onEnd).not.toHaveBeenCalled()
  await flush()
  expect(onEnd).toHaveBeenCalledTimes(1)
})

it('web speech engine is unavailable without speechSynthesis', () => {
  // happy-dom exposes no speechSynthesis global.
  expect(createWebSpeechEngine().available).toBe(false)
})

class FakeUtterance extends EventTarget {
  lang = ''
  rate = 1
  text: string

  constructor(text: string) {
    super()
    this.text = text
  }
}

it('web speech engine speaks and reports completion once', () => {
  const synth = {
    cancel: vi.fn<() => void>(),
    speak: vi.fn<(utterance: FakeUtterance) => void>(),
  }
  vi.stubGlobal('speechSynthesis', synth)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)

  const engine = createWebSpeechEngine()
  expect(engine.available).toBe(true)

  const onEnd = vi.fn<() => void>()
  engine.speak('你好', { locale: 'zh-CN', onEnd, rate: 2 })
  expect(synth.cancel).toHaveBeenCalledTimes(1)
  const utterance = synth.speak.mock.calls[0]?.[0] as FakeUtterance
  expect(utterance.text).toBe('你好')
  expect(utterance.lang).toBe('zh-CN')
  expect(utterance.rate).toBe(2)

  // Browsers may emit both `end` and `error` — completion fires once.
  utterance.dispatchEvent(new Event('end'))
  utterance.dispatchEvent(new Event('error'))
  expect(onEnd).toHaveBeenCalledTimes(1)

  // Empty text is a no-op; onEnd-less utterances skip listener wiring.
  engine.speak('', { locale: 'zh-CN', rate: 1 })
  expect(synth.speak).toHaveBeenCalledTimes(1)
  engine.speak('again', { locale: 'zh-CN', rate: 1 })
  expect(synth.speak).toHaveBeenCalledTimes(2)

  engine.cancel()
  expect(synth.cancel).toHaveBeenCalledTimes(3)
})
