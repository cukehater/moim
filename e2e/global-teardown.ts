import { config } from 'dotenv'

config({ path: '.env.local' })

export default async function globalTeardown() {
  const { cleanup } = await import('./db')
  await cleanup()
}
