import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '@/shared/config'
import * as schema from './schema'

export const db = drizzle(neon(env.DATABASE_URL), { schema })
