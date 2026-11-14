import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.local' })

// 모든 테스트가 같은 DB를 쓰므로 순서대로 하나씩 실행
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['iPhone 13'],
    browserName: 'chromium',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
