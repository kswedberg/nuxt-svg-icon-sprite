import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/processors.ts'],
  externals: ['consola', 'ohash', 'pathe', 'ufo', 'h3'],
})
