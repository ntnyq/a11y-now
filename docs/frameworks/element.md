# Web Component 接入

`@a11y-now/element`

任意技术栈（或无构建）接入：

```html
<a11y-now lang="zh-CN"></a11y-now>
<script type="module">
  import { defineA11yNowElement } from '@a11y-now/element'
  import { fullPreset } from 'a11y-now'

  defineA11yNowElement(fullPreset())
</script>
```

元素连接即挂载、断开即卸载；`no-storage` 属性可禁用持久化。
