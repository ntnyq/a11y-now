# Web Component

`@a11y-now/element`

Works with any stack (or no build at all):

```html
<a11y-now lang="en"></a11y-now>
<script type="module">
  import { defineA11yNowElement } from '@a11y-now/element'
  import { fullPreset } from 'a11y-now'

  defineA11yNowElement(fullPreset())
</script>
```

The element mounts on connect and unmounts on disconnect; the `no-storage`
attribute disables persistence.
