import { defineA11yNowElement } from '@a11y-now/element'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = ''
})

it('connecting <a11y-now> mounts, disconnecting unmounts', () => {
  defineA11yNowElement()
  const el = document.createElement('a11y-now')
  el.setAttribute('no-storage', '')
  document.body.append(el)

  expect(document.querySelector('a11y-now-host')).not.toBeNull()

  el.remove()
  expect(document.querySelector('a11y-now-host')).toBeNull()
})

it('define is idempotent and respects the lang attribute', () => {
  const first = defineA11yNowElement()
  const second = defineA11yNowElement()
  expect(first).toBe(second)

  const el = document.createElement('a11y-now') as InstanceType<typeof first>
  el.setAttribute('lang', 'en-US')
  el.setAttribute('no-storage', '')
  document.body.append(el)
  expect(el.instance?.i18n.getLocale()).toBe('en-US')
  el.remove()
})
