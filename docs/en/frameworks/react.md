# React

`@a11y-now/react`

```tsx
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'
import { fullPreset } from 'a11y-now'

;<A11yNowProvider options={{ ...fullPreset() }}>
  <App />
</A11yNowProvider>

// in any component
const a11y = useA11yNow()
```

A `useA11yNowEvent(event, handler)` hook is also provided.

The handler payload is inferred from the event name: subscribing to `theme:change` gives `{ theme: string }`. Plugin events registered through module augmentation also retain their corresponding payload types.
