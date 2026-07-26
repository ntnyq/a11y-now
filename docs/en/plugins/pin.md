# Pin

`@a11y-now/plugin-pin` · Shortcut `Ctrl+Alt+L`

Toggles whether the toolbar reserves space on the page (a top margin on body).

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { pin } from '@a11y-now/plugin-pin'

createA11yNow({ plugins: [pin()] }).mount()
```

## API

```ts
const api = instance.getPlugin('pin')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
