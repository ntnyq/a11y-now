# Auto theme

`@a11y-now/plugin-auto-theme` · Shortcut `Ctrl+Alt+U` · **optional add-on**

Applies registered themes automatically from system preferences: the
high-contrast theme under `prefers-contrast: more`, otherwise dark or light
themes per `prefers-color-scheme`, reacting live to preference changes.

When the user switches themes manually (e.g. `Ctrl+Alt+T`), auto theme
steps aside and stays off; pressing the "auto theme" button again resumes
following the system.

## Usage

```ts
import { createA11yNow } from 'a11y-now'
import { autoTheme } from '@a11y-now/plugin-auto-theme'

// The mapped themes must be registered (the full preset includes the defaults below.)
createA11yNow({ plugins: [autoTheme()] }).mount()
```

## Options

| Option         | Default         | Description                                              |
| -------------- | --------------- | -------------------------------------------------------- |
| `dark`         | `deep-blue`     | Theme name applied under `prefers-color-scheme: dark`    |
| `highContrast` | `high-contrast` | Theme name applied under `prefers-contrast: more`        |
| `light`        | `default`       | Theme name applied otherwise; empty string = don't touch |

## API

```ts
const api = instance.getPlugin('auto-theme')
api?.toggle()
api?.evaluate() // re-evaluate current system preferences now
```
