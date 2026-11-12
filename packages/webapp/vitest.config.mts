import { resolve } from 'node:path'
import svgr from 'vite-plugin-svgr'

import { defineConfig } from 'vitest/config'

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
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
