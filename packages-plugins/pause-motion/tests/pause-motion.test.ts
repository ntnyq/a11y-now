import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { pauseMotion } from '@a11y-now/plugin-pause-motion'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>内容</p></main>'
})

function styleText() {
  return (
    document.head.querySelector('[data-a11y-now="pause-motion"]')
      ?.textContent ?? ''
  )
}

it('injects the freeze stylesheet and removes it on toggle-off', () => {
  const a11y = createA11yNow({ storage: null }).use(pauseMotion())
  a11y.mount()
  const api = a11y.getPlugin('pause-motion')

  api?.toggle()
  expect(styleText()).toContain('animation-play-state: paused')
  expect(styleText()).toContain('transition-property: none')
  expect(styleText()).toContain('data-a11y-skip')

  api?.toggle()
  expect(styleText()).toBe('')
  a11y.unmount()
})

it('pauses autoplaying videos and resumes them on disable', () => {
  const video = document.createElement('video')
  video.autoplay = true
  const skipped = document.createElement('video')
  skipped.autoplay = true
  const skipZone = document.createElement('div')
  skipZone.dataset['a11ySkip'] = ''
  skipZone.append(skipped)
  document.body.append(video, skipZone)

  const pause = vi.spyOn(video, 'pause')
  const play = vi.spyOn(video, 'play').mockResolvedValue()
  const skippedPause = vi.spyOn(skipped, 'pause')

  const a11y = createA11yNow({ storage: null }).use(pauseMotion())
  a11y.mount()
  const api = a11y.getPlugin('pause-motion')

  api?.toggle()
  expect(pause).toHaveBeenCalledTimes(1)
  expect(skippedPause).not.toHaveBeenCalled()

  api?.toggle()
  expect(play).toHaveBeenCalledTimes(1)
  a11y.unmount()
  video.remove()
  skipZone.remove()
})

it('freezes same-origin GIFs onto a still and restores the original', () => {
  const gif = document.createElement('img')
  gif.src = 'https://example.com/anim.GIF'
  Object.defineProperty(gif, 'complete', { value: true })
  Object.defineProperty(gif, 'naturalWidth', { value: 4 })
  Object.defineProperty(gif, 'naturalHeight', { value: 2 })
  document.body.append(gif)
  const original = gif.src

  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ drawImage() {} } as never)
  const toDataURL = vi
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockReturnValue('data:image/png;base64,STILL')

  const a11y = createA11yNow({ storage: null }).use(pauseMotion())
  a11y.mount()
  const api = a11y.getPlugin('pause-motion')

  api?.toggle()
  expect(gif.src).toBe('data:image/png;base64,STILL')

  api?.toggle()
  expect(gif.src).toBe(original)

  // freezeGifs: false leaves the image alone.
  const opted = createA11yNow({ storage: null }).use(
    pauseMotion({ freezeGifs: false }),
  )
  a11y.unmount()
  opted.mount()
  opted.getPlugin('pause-motion')?.toggle()
  expect(gif.src).toBe(original)
  opted.unmount()

  getContext.mockRestore()
  toDataURL.mockRestore()
  gif.remove()
})

it('Ctrl+Alt+X toggles, persists, and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(pauseMotion())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'x' }),
  )
  expect(a11y.getPlugin('pause-motion')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)

  const again = createA11yNow({ storage }).use(pauseMotion())
  again.mount()
  expect(styleText()).toContain('animation-play-state: paused')
  again.unmount()
})
