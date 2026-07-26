# Exit

`@a11y-now/plugin-exit` · Shortcut `Ctrl+Alt+E`

Unmounts the toolbar with zero page residue and remembers the user's choice.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { exit } from '@a11y-now/plugin-exit'

createA11yNow({ plugins: [exit()] }).mount()
```

## API

```ts
const api = instance.getPlugin('exit')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
