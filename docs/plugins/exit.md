# 退出服务

`@a11y-now/plugin-exit` · 快捷键 `Ctrl+Alt+E`

卸载工具栏、页面零残留，并记住用户选择。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { exit } from '@a11y-now/plugin-exit'

createA11yNow({ plugins: [exit()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('exit')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
