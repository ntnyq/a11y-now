# Help

`@a11y-now/plugin-help` · Shortcut `Ctrl+Alt+?`

A visual shortcut panel listing every currently registered shortcut.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { help } from '@a11y-now/plugin-help'

createA11yNow({ plugins: [help()] }).mount()
```

## API

```ts
const api = instance.getPlugin('help')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
