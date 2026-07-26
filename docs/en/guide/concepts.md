# Core concepts

## Architecture

```
types ← shared ← core ← plugin-* (definePlugin)
types ←──────────────── theme-* (pure token data)
core  ←──────────────── vue / react / svelte / solid / element
core + every official plugin/theme ← the a11y-now aggregate package
```

## Mounting and style isolation

The toolbar host `<a11y-now-host>` is attached under `<html>` (as a sibling
of `body`) and renders inside Shadow DOM. Page-level zoom, themes and
transforms applied to `body` can never affect the toolbar, and toolbar
styles never leak into the page.

## Zero-residue unmount

Every page mutation a plugin makes must go through `ctx.dom` (inject styles,
set variables, add class names). The kernel registers each mutation and
rolls all of them back on `unmount()`. An integration test asserts that
`document.documentElement.outerHTML` after exit is byte-for-byte identical
to the pre-mount snapshot.

## Plugin system

Every feature is a plugin package implementing the `A11yPlugin` contract:
`setup(ctx)` returns `{ api, dispose }`. The kernel handles dependency
ordering, state persistence, shortcut registration and conflict detection.

## Type safety

Cross-package type safety is built on twin module-augmentation registries:

```ts
declare module '@a11y-now/types' {
  interface A11yPluginRegistry {
    zoom: ZoomApi
  }
  interface A11yEventMap {
    'zoom:change': { scale: number }
  }
}
```

So `instance.getPlugin('zoom')` returns `ZoomApi`, and a mistyped event
name fails to compile.

## State persistence

Each plugin's state persists automatically according to its schema
(localStorage by default — replaceable or disableable), under keys like
`a11y-now:plugin:zoom`, synchronized across tabs. `resetAll()` restores
every default in one step.
