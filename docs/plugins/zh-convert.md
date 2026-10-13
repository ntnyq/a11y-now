# 简繁转换

`@a11y-now/plugin-zh-convert` · 快捷键 `Ctrl+Alt+J` · **可选扩展包**

将页面可见文本在简体与繁体（默认简 → 台繁）之间转换（依赖
[opencc-js](https://github.com/nk2028/opencc-js)）。关闭时精确还原原文。

- 默认带 `MutationObserver`，SPA 动态插入/修改的文本同样会被转换；
- 只转换文本节点，`aria-label` / `title` 等属性文本保持不变；
- 跳过 `script/style/textarea/code/pre` 与 `[data-a11y-skip]` 子树；
- 不包含在 `a11y-now` 聚合包与 full preset 中，需单独安装。

## 使用

```ts
import { zhConvert } from '@a11y-now/plugin-zh-convert'
import { createA11yNow } from 'a11y-now'

createA11yNow({ plugins: [zhConvert()] }).mount()
```

## 选项

| 选项          | 默认        | 说明                               |
| ------------- | ----------- | ---------------------------------- |
| `from` / `to` | `cn` / `tw` | OpenCC 方向（`cn/tw/twp/hk/t/jp`） |
| `watch`       | `true`      | 监听动态内容并转换                 |
| `convert`     | —           | 自定义转换函数，覆盖 OpenCC        |

## Api

```ts
const api = instance.getPlugin('zh-convert')
api?.toggle()
api?.isEnabled()
```
