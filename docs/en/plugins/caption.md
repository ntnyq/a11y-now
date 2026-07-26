# Caption bar

`@a11y-now/plugin-caption` · Shortcut `Ctrl+Alt+B`

An extra-large caption strip at the bottom of the page, mirroring spoken text in real time.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { caption } from '@a11y-now/plugin-caption'

createA11yNow({ plugins: [caption()] }).mount()
```

## API

```ts
const api = instance.getPlugin('caption')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
