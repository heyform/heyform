import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // This legacy file runs as a standalone assert script, not a Vitest suite.
    exclude: [...configDefaults.exclude, 'test/theme.test.ts'],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
