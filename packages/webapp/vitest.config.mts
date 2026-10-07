import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@heyform-inc/form-renderer': resolve(__dirname, '../form-renderer/src/index.ts')
    }
  },
  test: {
    include: ['test/duplicate-field.test.ts'],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
