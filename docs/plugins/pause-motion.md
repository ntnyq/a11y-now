# 停止动画

`@a11y-now/plugin-pause-motion` · 快捷键 `Ctrl+Alt+X` · **可选扩展包**

为前庭障碍与注意力敏感用户冻结页面动效:注入强制版
`prefers-reduced-motion` 样式(暂停全部 CSS 动画、禁用过渡与平滑滚动),
暂停自动播放的视频,并尽力把同源 GIF 冻结为首帧静态图。关闭时逐项还原
(样式移除、autoplay 视频恢复播放、GIF 恢复原图)。

- `[data-a11y-skip]` 子树不受影响;
- 跨域 GIF 因画布污染无法截帧,保持原样(尽力而为);
- 不包含在 `a11y-now` 聚合包与 full preset 中,需单独安装。

## 使用

```ts
import { createA11yNow } from 'a11y-now'
import { pauseMotion } from '@a11y-now/plugin-pause-motion'

createA11yNow({ plugins: [pauseMotion()] }).mount()
```

## 选项

| 选项         | 默认   | 说明                      |
| ------------ | ------ | ------------------------- |
| `freezeGifs` | `true` | 是否尝试冻结同源 GIF 首帧 |

## Api

```ts
const api = instance.getPlugin('pause-motion')
api?.toggle()
api?.isEnabled()
```
