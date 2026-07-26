# Page zoom

`@a11y-now/plugin-zoom` · Shortcut `Ctrl+Alt+= / -`

Whole-page zoom, 1.0–1.3× by default with a 0.1 step, configurable.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'

createA11yNow({ plugins: [zoom()] }).mount()
```

## API

```ts
const api = instance.getPlugin('zoom')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
