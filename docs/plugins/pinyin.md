# 拼音标注

`@a11y-now/plugin-pinyin` · 快捷键 `Ctrl+Alt+P` · **可选扩展包**

为正文中的汉字添加 `<ruby>` 拼音注音（依赖 [pinyin-pro](https://github.com/zh-lx/pinyin-pro)，
多音字按词消歧）。关闭时逐节点还原原始文本，不留痕迹。

- `rt` 注音带 `aria-hidden`，读屏软件与指读均不会重复朗读拼音；
- 跳过 `script/style/textarea/ruby/code/pre` 与 `[data-a11y-skip]` 子树；
- 不包含在 `a11y-now` 聚合包与 full preset 中，需单独安装。

## 使用

```ts
import { createA11yNow } from 'a11y-now'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'

createA11yNow({ plugins: [pinyinAnnotation()] }).mount()
```

## 选项

| 选项    | 默认                                    | 说明                           |
| ------- | --------------------------------------- | ------------------------------ |
| `root`  | `main, article, [role="main"]` → `body` | 标注根节点选择器               |
| `limit` | `10000`                                 | 单次标注的汉字数上限，`0` 不限 |

## Api

```ts
const api = instance.getPlugin('pinyin')
api?.toggle()
api?.isEnabled()
```
