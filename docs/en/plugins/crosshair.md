# Crosshair

`@a11y-now/plugin-crosshair` · Shortcut `Ctrl+Alt+N`

A reading guide line that follows the mouse, helping low-vision users stay on the right row.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { crosshair } from '@a11y-now/plugin-crosshair'

createA11yNow({ plugins: [crosshair()] }).mount()
```

## API

```ts
const api = instance.getPlugin('crosshair')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
