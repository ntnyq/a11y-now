# Write a theme

A theme is a **zero-runtime data package** (official packages are named
`@a11y-now/theme-*`), defined with `defineTheme` from `@a11y-now/core`:

```ts
import { defineTheme } from '@a11y-now/core'

export const nightOwl = defineTheme({
  displayName: { 'en-US': 'Night Owl', 'zh-CN': '夜枭' },
  name: 'night-owl',
  page: {
    bg: 'rgb(1, 22, 39)',
    fg: 'rgb(214, 222, 235)',
    link: 'rgb(130, 170, 255)',
  },
  toolbar: {
    'color-bg': 'rgb(1, 22, 39)',
    'color-fg': 'rgb(214, 222, 235)',
  },
})
```

## defineTheme

`defineTheme` is a pure type helper (an identity function): token keys and
value types are checked at compile time — an extra or missing token fails
immediately, mirroring `definePlugin`. For a single-file theme just inline
the object; when publishing a standalone theme package, put
`@a11y-now/core` in **devDependencies** and add
`deps: { alwaysBundle: [/^@a11y-now\//u] }` to your tsdown config — the identity
function gets inlined and tree-shaken, leaving a zero-dependency artifact
with self-contained type declarations (the five official theme packages
ship exactly this way, each only a few dozen lines).

## Usage

```ts
createA11yNow({ plugins: [themeSwitcher()], themes: [defaultTheme, nightOwl] })
// or
instance.useTheme(nightOwl)
```

## Runtime mechanics

- Toolbar tokens are written to the shadow `:host` inline style (`--a11y-<key>`);
- Page tokens are written to `documentElement` (`--a11y-page-<key>`),
  together with a `data-a11y-theme` attribute matched by one reclaimable
  fallback stylesheet;
- Switching and restoring are pure variable operations — **no stylesheet rebuilds**;
- Sites can exclude elements from page recoloring with the `data-a11y-skip`
  attribute or the theme's `skipSelectors` (CAPTCHAs, charts, brand images…).

See the [themes and token reference](/en/themes/).
