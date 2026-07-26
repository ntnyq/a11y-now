# Reset

`@a11y-now/plugin-reset` · Shortcut `Ctrl+Alt+C`

Restores every plugin's state to its defaults in one step.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { reset } from '@a11y-now/plugin-reset'

createA11yNow({ plugins: [reset()] }).mount()
```

## API

```ts
const api = instance.getPlugin('reset')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
