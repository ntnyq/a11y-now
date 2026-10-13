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

回调参数会根据事件名推断类型，例如订阅 `theme:change` 时，载荷类型为 `{ theme: string }`。通过模块扩展注册的插件事件也支持对应的载荷推断。
