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
    // The other files in test/ are standalone assert scripts, not Vitest suites.
    include: ['test/duplicate-field.test.ts', 'test/choice-branching.test.ts'],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
