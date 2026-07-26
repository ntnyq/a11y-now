# Svelte 接入

`@a11y-now/svelte`

```svelte
<script>
  import { provideA11yNow } from '@a11y-now/svelte'
  import { fullPreset } from 'a11y-now'

  provideA11yNow({ ...fullPreset() })
</script>
```

子组件用 `useA11yNow()` 获取实例；`a11yEventStore(instance, event)`
返回标准 readable store（Svelte 4/5 均可用 `$store` 订阅）。
