# 语音朗读

`@a11y-now/plugin-speech` · 快捷键 `Ctrl+Alt+V / K / F`

声音开关、语速调节（1~3 倍）与指读/连读两种阅读方式。

## 使用

```ts
import { createA11yNow } from '@a11y-now/core'
import { speech } from '@a11y-now/plugin-speech'

createA11yNow({ plugins: [speech()] }).mount()
```

## Api

```ts
const api = instance.getPlugin('speech')
```

Api 类型经 module augmentation 注册，具体见包内 `src/index.ts` 导出的
接口定义与 JSDoc。
