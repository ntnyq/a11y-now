import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { textSpacing } from '@a11y-now/plugin-spacing'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>正文</p></main>'
})

function styleText() {
  return (
    document.head.querySelector('[data-a11y-now="spacing"]')?.textContent ?? ''
  )
}

it('cycles off → comfort (WCAG 1.4.12) → loose → off', () => {
  const a11y = createA11yNow({ storage: null }).use(textSpacing())
  a11y.mount()
  const api = a11y.getPlugin('spacing')
  expect(api?.getLevel()).toBe(0)
  expect(styleText()).toBe('')

  api?.cycle()
  expect(api?.getLevel()).toBe(1)
  expect(styleText()).toContain('line-height: 1.5')
  expect(styleText()).toContain('letter-spacing: 0.12em')
  expect(styleText()).toContain('word-spacing: 0.16em')
  expect(styleText()).toContain('margin-block-end: 2em')

  api?.cycle()
  expect(api?.getLevel()).toBe(2)
  expect(styleText()).toContain('line-height: 1.8')

  api?.cycle()
  expect(api?.getLevel()).toBe(0)
  expect(styleText()).toBe('')
  a11y.unmount()
})

it('setLevel clamps invalid input and emits spacing:change', () => {
  const a11y = createA11yNow({ storage: null }).use(textSpacing())
  a11y.mount()
  const levels: number[] = []
  const stop = a11y.events.on('spacing:change', ({ level }) => {
    levels.push(level)
  })

  const api = a11y.getPlugin('spacing')
  api?.setLevel(2)
  expect(styleText()).toContain('line-height: 1.8')
  api?.setLevel(99)
  expect(api?.getLevel()).toBe(0)
  expect(levels).toStrictEqual([2, 0])
  stop()
  a11y.unmount()
})

it('honors a custom ladder', () => {
  const a11y = createA11yNow({ storage: null }).use(
    textSpacing({
      levels: [
        {
          letterSpacing: '0.2em',
          lineHeight: 2.2,
          name: 'comfort',
          paragraphSpacing: '3em',
          wordSpacing: '0.3em',
        },
      ],
    }),
  )
  a11y.mount()
  const api = a11y.getPlugin('spacing')
  api?.cycle()
  expect(styleText()).toContain('line-height: 2.2')
  // Single-level ladder wraps straight back to off.
  api?.cycle()
  expect(api?.getLevel()).toBe(0)
  a11y.unmount()
})

it('Ctrl+Alt+S cycles, persists across remounts, no residue', () => {
  const before = document.documentElement.outerHTML
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(textSpacing())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 's' }),
  )
  expect(a11y.getPlugin('spacing')?.getLevel()).toBe(1)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)

  const again = createA11yNow({ storage }).use(textSpacing())
  again.mount()
  expect(styleText()).toContain('line-height: 1.5')
  again.unmount()
})
