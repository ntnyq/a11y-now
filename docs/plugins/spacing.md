# 间距调节

`@a11y-now/plugin-spacing` · 快捷键 `Ctrl+Alt+S` · **可选扩展包**

按 WCAG 1.4.12(文本间距)提供三档循环:**关闭 → 舒适 → 宽松**。
「舒适」档就是 1.4.12 的测试指标(行高 1.5、字距 0.12em、词距 0.16em、
段距 2em),「宽松」档在此之上进一步放大,面向阅读障碍用户。样式经可回收
样式表注入,`[data-a11y-skip]` 子树不受影响。

## 使用

```ts
import { createA11yNow } from 'a11y-now'
import { textSpacing } from '@a11y-now/plugin-spacing'

createA11yNow({ plugins: [textSpacing()] }).mount()
```

## 选项

| 选项     | 默认             | 说明                                  |
| -------- | ---------------- | ------------------------------------- |
| `levels` | `SPACING_LEVELS` | 自定义档位阶梯(不含「关闭」档),可增减 |

## Api

```ts
const api = instance.getPlugin('spacing')
api?.cycle() // 循环到下一档
api?.setLevel(1) // 0 = 关闭,1 起为档位序号
api?.getLevel()
```

每次档位变化都会发出 `spacing:change { level }` 事件。
