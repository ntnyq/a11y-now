# Svelte

`@a11y-now/svelte`

```svelte
<script>
  import { provideA11yNow } from '@a11y-now/svelte'
  import { fullPreset } from 'a11y-now'

  provideA11yNow({ ...fullPreset() })
</script>
```

Child components call `useA11yNow()` to get the instance;
`a11yEventStore(instance, event)` returns a standard readable store
(subscribe with `$store` in both Svelte 4 and 5).
