import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { fullPreset } from 'a11y-now'
import { createApp, defineComponent, h } from 'vue'

const App = defineComponent({
  setup() {
    const a11y = useA11yNow()
    return () =>
      h('main', [
        h('h1', 'a11y-now × Vue'),
        h(
          'button',
          { onClick: () => a11y.getPlugin('zoom')?.zoomIn() },
          '放大',
        ),
        h(
          'button',
          { onClick: () => a11y.getPlugin('theme')?.cycle() },
          '换肤',
        ),
      ])
  },
})

const app = createApp(App)
app.use(A11yNowPlugin, { ...fullPreset() })
app.mount('#app')
