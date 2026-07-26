# Next.js

`@a11y-now/next`

The build ships its own `'use client'` boundary, so App Router server
layouts can render it directly:

```tsx
// app/layout.tsx
import { A11yNow } from '@a11y-now/next'

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        {children}
        <A11yNow preset='full' />
      </body>
    </html>
  )
}
```

## `<A11yNow />` props

| Prop                       | Default | Description                                                                            |
| -------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `preset`                   | `full`  | `'full' \| 'reading' \| 'screen-reader'`                                               |
| `respectExit`              | `true`  | Honor the user's previous "exit" choice                                                |
| `locale` / `storagePrefix` | —       | Passed through to `createA11yNow`                                                      |
| `options`                  | —       | Full `A11yNowOptions`, overrides the preset; not serializable — client components only |

## Programmatic access

When you need `useA11yNow()`, use the re-exported provider (in a client
component):

```tsx
'use client'
import { A11yNowProvider, useA11yNow } from '@a11y-now/next'

export function Providers({ children }) {
  return <A11yNowProvider options={{}}>{children}</A11yNowProvider>
}
```
