# Next.js 接入

`@a11y-now/next`

产物自带 `'use client'` 边界，App Router 的服务端布局可直接渲染：

```tsx
// app/layout.tsx
import { A11yNow } from '@a11y-now/next'

export default function RootLayout({ children }) {
  return (
    <html lang='zh-CN'>
      <body>
        {children}
        <A11yNow preset='full' />
      </body>
    </html>
  )
}
```

## `<A11yNow />` props

| Prop                       | 默认   | 说明                                                               |
| -------------------------- | ------ | ------------------------------------------------------------------ |
| `preset`                   | `full` | `'full' \| 'reading' \| 'screen-reader'`                           |
| `respectExit`              | `true` | 尊重用户上次「退出服务」的选择                                     |
| `locale` / `storagePrefix` | —      | 透传给 `createA11yNow`                                             |
| `options`                  | —      | 完整 `A11yNowOptions`，覆盖 preset；不可序列化，仅限客户端组件传入 |

## 程序化访问

需要 `useA11yNow()` 时，改用复导出的 Provider（客户端组件中）：

```tsx
'use client'
import { A11yNowProvider, useA11yNow } from '@a11y-now/next'

export function Providers({ children }) {
  return <A11yNowProvider options={{}}>{children}</A11yNowProvider>
}
```
