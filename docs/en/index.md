---
layout: home

hero:
  name: a11y-now
  text: Web accessibility toolbar
  tagline: Pluggable · Themeable · Framework-agnostic · Type-safe · Zero-residue unmount
  actions:
    - theme: brand
      text: Getting started
      link: /en/guide/getting-started
    - theme: alt
      text: Plugins
      link: /en/plugins/

features:
  - title: One-line setup
    details: createA11yNow().mount() gives you the full accessibility toolbar, or compose the @a11y-now/* packages à la carte.
  - title: Plugin kernel
    details: All twelve official features are plugins; the kernel carries zero feature code, and third-party plugins follow the same contract.
  - title: CSS-variable themes
    details: Switching themes only rewrites variable values — no stylesheet rebuilds. A theme is a zero-runtime data package.
  - title: Framework adapters
    details: Vue / React / Svelte / Solid adapters plus an <a11y-now> Web Component, with Nuxt and Next.js integrations.
  - title: Type safety
    details: Event names, plugin names, plugin APIs and theme tokens are all checked at compile time.
  - title: Zero-residue unmount
    details: Every page mutation is registered and rolled back — after exit the DOM is byte-for-byte identical, verified in a real browser.
---
