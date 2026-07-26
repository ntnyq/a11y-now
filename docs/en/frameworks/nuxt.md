# Nuxt

`@a11y-now/nuxt`

A dependency-free Nuxt module (no `@nuxt/kit`): it registers a client-only
plugin that mounts the toolbar for the chosen preset and injects `$a11yNow`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@a11y-now/nuxt'],
  a11yNow: {
    preset: 'full', // 'full' | 'reading' | 'screen-reader'
  },
})
```

```ts
// in any component or composable
const { $a11yNow } = useNuxtApp()
$a11yNow.getPlugin('zoom')?.zoomIn()
```

## Module options (configKey `a11yNow`)

| Option                     | Default | Description                                           |
| -------------------------- | ------- | ----------------------------------------------------- |
| `preset`                   | `full`  | Which built-in preset to mount                        |
| `autoMount`                | `true`  | When off, only `$a11yNow` is injected — you `mount()` |
| `respectExit`              | `true`  | Honor the user's previous "exit" choice               |
| `locale` / `storagePrefix` | —       | Passed through to `createA11yNow`                     |

Module options must be serializable (they travel to the client via
`runtimeConfig.public`). For non-serializable setups — custom plugin lists,
a remote TTS engine — skip this module and write a Nuxt client plugin using
[`@a11y-now/vue`](/en/frameworks/vue) or `a11y-now` directly.
