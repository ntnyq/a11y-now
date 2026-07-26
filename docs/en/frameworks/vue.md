# Vue

`@a11y-now/vue`

```ts
import { createApp } from 'vue'
import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { fullPreset } from 'a11y-now'

const app = createApp(App)
app.use(A11yNowPlugin, { ...fullPreset() })

// in any component
const a11y = useA11yNow()
a11y.getPlugin('zoom')?.zoomIn()
```

`useA11yNowEvent(event, handler)` is also provided and unsubscribes
automatically with the component scope.
