# Solid

`@a11y-now/solid`

```tsx
import { A11yNowContext, createA11yNowSolid } from '@a11y-now/solid'
import { fullPreset } from 'a11y-now'

const instance = createA11yNowSolid({ ...fullPreset() })

<A11yNowContext.Provider value={instance}>
  <App />
</A11yNowContext.Provider>
```

`createA11yEventSignal(instance, event)` returns a signal that tracks the
event.
