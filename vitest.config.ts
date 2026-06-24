import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const root = fileURLToPath(new URL('.', import.meta.url))
const moduleEntry = join(root, 'src/module')

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '~': root,
            '~~': root,
          },
        },
        test: {
          name: 'unit',
          include: [
            'test/build/**/*.{test,spec}.ts',
            'test/processors/**/*.{test,spec}.ts',
          ],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              overrides: {
                modules: [moduleEntry],
              },
            },
          },
        },
      }),
    ],
  },
})
