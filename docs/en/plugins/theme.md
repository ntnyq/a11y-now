# Theme switcher

`@a11y-now/plugin-theme` · Shortcut `Ctrl+Alt+T`

Cycles through the registered theme packages — pure CSS-variable operations.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { themeSwitcher } from '@a11y-now/plugin-theme'

createA11yNow({ plugins: [themeSwitcher()] }).mount()
```

## API

```ts
const api = instance.getPlugin('theme')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
