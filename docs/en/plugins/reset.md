# Vue

`@a11y-now/vue`

```ts
import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { fullPreset } from 'a11y-now'
import { createApp } from 'vue'

const app = createApp(App)
app.use(A11yNowPlugin, { ...fullPreset() })
app.mount('#app')

// in any component
const a11y = useA11yNow()
a11y.getPlugin('zoom')?.zoomIn()
```

`useA11yNowEvent(event, handler)` is also provided and unsubscribes
automatically with the component scope.

The handler payload is inferred from the event name: subscribing to `theme:change` gives `{ theme: string }`. Plugin events registered through module augmentation also retain their corresponding payload types.

Automatic toolbar mounting runs after `app.mount()` renders the page, so plugins can discover its content. Set `autoMount: false` to mount the instance yourself after any asynchronous content is ready.

Reset immediately restores page styles, overlays, button states, speech settings, and pin spacing while retaining the existing plugin APIs. The theme switcher restores its configured initial theme, or the first registered theme; enabled auto-theme then reapplies the system preference.
