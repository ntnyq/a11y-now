import { createA11yNow, wasExited } from 'a11y-now'

if (!wasExited()) {
  createA11yNow().mount()
}
