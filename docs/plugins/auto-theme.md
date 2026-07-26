# 自动配色

`@a11y-now/plugin-auto-theme` · 快捷键 `Ctrl+Alt+U` · **可选扩展包**

跟随系统偏好自动应用已注册主题：`prefers-contrast: more` 时应用高对比
主题，否则按 `prefers-color-scheme` 在暗色/浅色主题间切换，并实时响应
系统偏好变化。

用户手动切换配色（如 `Ctrl+Alt+T`）时自动配色让位并保持关闭，重新点击
「自动配色」按钮即可恢复跟随。

## 使用

```ts
import { createA11yNow } from 'a11y-now'
import { autoTheme } from '@a11y-now/plugin-auto-theme'

// 需保证映射到的主题已注册（full preset 已包含下列默认主题）
createA11yNow({ plugins: [autoTheme()] }).mount()
```

## 选项

| 选项           | 默认            | 说明                                        |
| -------------- | --------------- | ------------------------------------------- |
| `dark`         | `deep-blue`     | `prefers-color-scheme: dark` 时应用的主题名 |
| `highContrast` | `high-contrast` | `prefers-contrast: more` 时应用的主题名     |
| `light`        | `default`       | 其余情况应用的主题名，空字符串表示不干预    |

## Api

```ts
const api = instance.getPlugin('auto-theme')
api?.toggle()
api?.evaluate() // 立即按当前系统偏好重算
```
