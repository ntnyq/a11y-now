// TypeDoc generates this gitignored module after checking the project.
// Keep clean-checkout typechecking independent of the generated output.
declare module '*typedoc-sidebar.json' {
  import type { DefaultTheme } from 'vitepress'

  const sidebar: DefaultTheme.SidebarItem[]
  export default sidebar
}
