import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:3100'
const serverURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9157'

export default defineConfig({
  testDir: './test/browser',
  testMatch: '**/*.e2e.ts',
  outputDir: '../../coverage-e2e/browser',
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 3100 --strictPort',
    url: baseURL,
    env: {
      VITE_HOMEPAGE_URL: baseURL,
      VITE_DASHBOARD_URL: baseURL,
      VITE_PROXY_TARGET: serverURL,
      VITE_COOKIE_DOMAIN: '127.0.0.1',
      VITE_GRAPHQL_API_URL: '/graphql',
      VITE_CDN_UPLOAD_URL: '/api',
      VITE_VERIFY_USER_EMAIL: 'false',
      VITE_ENABLE_GOOGLE_FONTS: 'false'
    }
  }
})
