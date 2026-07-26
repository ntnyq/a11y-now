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

## The toolbar's own accessibility

An accessibility toolbar has to be accessible itself: a `role="toolbar"`
/ `role="group"` structure, arrow-key roving tabindex, `aria-pressed`
states, `aria-live` announcements, focus management plus a focusable
scroll region in the help dialog, and WCAG AA contrast for every
text/background pair in both color schemes.

That claim is backed by a real-browser audit: the e2e suite
(`tests/browser/axe.test.ts`, run in CI on every push) scans the whole
page with **axe-core's default full rule set (WCAG A/AA + best
practices, no rules disabled)** — a clean page stays at **zero
violations** after mounting the toolbar, after switching to the dark
scheme, and with the help dialog open. In other words: adopting a11y-now
adds nothing to your own site's axe / Lighthouse findings.

Automated scans only cover machine-checkable issue types; the real
screen-reader experience (VoiceOver / NVDA) is verified manually, with
conclusions updated release by release.
