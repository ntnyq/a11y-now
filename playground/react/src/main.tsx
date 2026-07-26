import { fullPreset } from 'a11y-now'
import { createRoot } from 'react-dom/client'
import { A11yNowProvider, useA11yNow } from '@a11y-now/react'

const App = () => {
  const a11y = useA11yNow()
  return (
    <main>
      <h1>a11y-now × React</h1>
      <button onClick={() => a11y.getPlugin('zoom')?.zoomIn()}>放大</button>
      <button onClick={() => a11y.getPlugin('theme')?.cycle()}>换肤</button>
    </main>
  )
}

createRoot(document.querySelector('#root') as HTMLElement).render(
  <A11yNowProvider options={{ ...fullPreset() }}>
    <App />
  </A11yNowProvider>,
)
