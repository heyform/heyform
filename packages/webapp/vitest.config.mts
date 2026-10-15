import { resolve } from 'node:path'
import svgr from 'vite-plugin-svgr'

import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svgr()],
  envDir: false,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@heyform-inc/form-renderer': resolve(__dirname, '../form-renderer/src/index.ts')
    }
  },
  test: {
    env: {
      VITE_HOMEPAGE_URL: 'http://localhost',
      VITE_DASHBOARD_URL: 'http://localhost'
    },
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
