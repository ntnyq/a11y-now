# Vue 接入

`@a11y-now/vue`

```ts
import { A11yNowPlugin, useA11yNow } from '@a11y-now/vue'
import { fullPreset } from 'a11y-now'
import { createApp } from 'vue'

const app = createApp(App)
app.use(A11yNowPlugin, { ...fullPreset() })
app.mount('#app')

// 任意组件内
const a11y = useA11yNow()
a11y.getPlugin('zoom')?.zoomIn()
```

另提供 `useA11yNowEvent(event, handler)`，随组件作用域自动取消订阅。

回调参数会根据事件名推断类型，例如订阅 `theme:change` 时，载荷类型为 `{ theme: string }`。通过模块扩展注册的插件事件也支持对应的载荷推断。

工具栏会在 `app.mount()` 渲染页面后自动挂载，以便插件发现页面内容。对于异步内容，可设置 `autoMount: false`，待内容就绪后手动挂载实例。

重置会立即还原页面样式、辅助遮罩、按钮状态、语音设置及固定工具栏的预留空间，并保留原有插件 API。配色插件恢复配置的初始主题或首个注册主题；启用的自动配色随后应用系统偏好。

帮助对话框打开时，Tab 与 Shift+Tab 会在对话框内循环，背景控件暂时不可交互。按 Escape 或关闭按钮后，焦点回到打开对话框的控件，并恢复背景原有的 inert 状态。
