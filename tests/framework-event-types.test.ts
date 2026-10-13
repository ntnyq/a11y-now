import type { useA11yNowEvent as useReactEvent } from '@a11y-now/react'
import type { A11yEventMap } from '@a11y-now/types'
import type { useA11yNowEvent as useVueEvent } from '@a11y-now/vue'
import { expectTypeOf, it } from 'vitest'

it('narrows React event handlers to the selected event payload', () => {
  expectTypeOf<
    Parameters<typeof useReactEvent<'theme:change'>>[1]
  >().toEqualTypeOf<(payload: A11yEventMap['theme:change']) => void>()
  expectTypeOf<
    Parameters<typeof useReactEvent<'speech:speak'>>[1]
  >().toEqualTypeOf<(payload: A11yEventMap['speech:speak']) => void>()
})

it('narrows Vue event handlers to the selected event payload', () => {
  expectTypeOf<
    Parameters<typeof useVueEvent<'theme:change'>>[1]
  >().toEqualTypeOf<(payload: A11yEventMap['theme:change']) => void>()
  expectTypeOf<
    Parameters<typeof useVueEvent<'speech:speak'>>[1]
  >().toEqualTypeOf<(payload: A11yEventMap['speech:speak']) => void>()
})
