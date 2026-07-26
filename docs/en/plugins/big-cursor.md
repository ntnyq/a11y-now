# Big cursor

`@a11y-now/plugin-big-cursor` · Shortcut `Ctrl+Alt+M`

Replaces the pointer with a large high-contrast SVG cursor.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { bigCursor } from '@a11y-now/plugin-big-cursor'

createA11yNow({ plugins: [bigCursor()] }).mount()
```

## API

```ts
const api = instance.getPlugin('big-cursor')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
