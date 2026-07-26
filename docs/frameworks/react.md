# React 接入

`@a11y-now/react`

```tsx
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'
import { fullPreset } from 'a11y-now'

;<A11yNowProvider options={{ ...fullPreset() }}>
  <App />
</A11yNowProvider>

// 任意组件内
const a11y = useA11yNow()
```

另提供 `useA11yNowEvent(event, handler)` Hook。
