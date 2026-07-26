# Vue 接入

`@a11y-now/vue`

```ts
import { createApp } from 'vue'
import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { fullPreset } from 'a11y-now'

const app = createApp(App)
app.use(A11yNowPlugin, { ...fullPreset() })

// 任意组件内
const a11y = useA11yNow()
a11y.getPlugin('zoom')?.zoomIn()
```

另提供 `useA11yNowEvent(event, handler)`，随组件作用域自动取消订阅。
