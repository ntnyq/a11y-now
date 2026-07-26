# Region navigation

`@a11y-now/plugin-region-nav` · Shortcut `Alt+1 ~ Alt+6`

Scans the page and sorts content into six region types — viewport, navigation, interactive, service, list and main content — with live counts and cyclic traversal.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { regionNav } from '@a11y-now/plugin-region-nav'

createA11yNow({ plugins: [regionNav()] }).mount()
```

## API

```ts
const api = instance.getPlugin('region-nav')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
