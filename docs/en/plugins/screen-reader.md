# Screen-reader mode

`@a11y-now/plugin-screen-reader` · Shortcut `Ctrl+Alt+R`

For NVDA/VoiceOver users: silences the toolbar's self-voicing and hides visual-only helper buttons.

## Usage

```ts
import { createA11yNow } from '@a11y-now/core'
import { screenReader } from '@a11y-now/plugin-screen-reader'

createA11yNow({ plugins: [screenReader()] }).mount()
```

## API

```ts
const api = instance.getPlugin('screen-reader')
```

The API type is registered via module augmentation — see the interface
definitions and JSDoc exported from the package's `src/index.ts`.
