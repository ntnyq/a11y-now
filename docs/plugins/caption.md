# 大字幕

`@a11y-now/plugin-caption` · 快捷键 `Ctrl+Alt+B`

页面底部特大字号字幕条，实时镜像朗读文本。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { caption } from '@a11y-now/plugin-caption'

createA11yNow({ plugins: [caption()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('caption')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
