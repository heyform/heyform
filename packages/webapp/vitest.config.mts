import { resolve } from 'node:path'
import svgr from 'vite-plugin-svgr'

import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svgr()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@heyform-inc/form-renderer': resolve(__dirname, '../form-renderer/src/index.ts')
    }
  },
  test: {
    // These legacy files run as standalone assert scripts, not Vitest suites.
    exclude: [
      ...configDefaults.exclude,
      'test/form-presentation.test.ts',
      'test/file-upload.test.ts'
    ],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
