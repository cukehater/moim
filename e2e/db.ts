import { neon } from '@neondatabase/serverless'
import { encode } from 'next-auth/jwt'

const sql = neon(process.env.DATABASE_URL!)
const DAY = 86_400_000

/** 테스트 데이터는 id가 'e2e'로 시작하거나 제목이 '[E2E]'로 시작 → 끝나면 일괄 삭제 */
export const PREFIX = 'e2e'

type Seed = {
  id: string
  title?: string
  closed?: boolean
  anonymous?: boolean
  multiple?: boolean
  /** [이름, 고른 후보 인덱스[]] */
  votes?: [string, number[]][]
  dates?: string[]
}

export async function seedMeeting({
  id,
  title = '[E2E] 테스트 모임',
  closed = false,
  anonymous = false,
  multiple = true,
  votes = [],
  dates = ['2027-01-09', '2027-01-10', '2027-01-16'],
}: Seed) {
  const now = Date.now()
  await sql`delete from meetings where id = ${id}`
  await sql`insert into meetings (id, title, host, location, is_anonymous, allow_multiple, result_visibility, starts_at, ends_at, closed_at)
    values (${id}, ${title}, '모임장', '강남역', ${anonymous}, ${multiple}, 'always',
      ${new Date(now - DAY)}, ${new Date(now + 3 * DAY)}, ${closed ? new Date(now - 1000) : null})`
  for (const [i, d] of dates.entries()) {
    await sql`insert into date_options (id, meeting_id, date) values (${`${id}o${i}`}, ${id}, ${d})`
  }
  for (const [k, [name, picks]] of votes.entries()) {
    const voteId = `${id}v${k}`
    await sql`insert into votes (id, meeting_id, voter_token, name, created_at)
      values (${voteId}, ${id}, ${`${id}-tok${k}`}, ${anonymous ? null : name}, ${new Date(now - 60_000 + k * 1000)})`
    for (const p of picks) await sql`insert into vote_selections (vote_id, option_id) values (${voteId}, ${`${id}o${p}`})`
  }
  return { optionId: (i: number) => `${id}o${i}`, voterToken: (k: number) => `${id}-tok${k}` }
}

export async function getMeetingRow(id: string) {
  const [row] = await sql`select * from meetings where id = ${id}`
  return row
}

export async function cleanup() {
  await sql`delete from meetings where id like ${PREFIX + '%'} or title like '[E2E]%'`
}

/** 운영자(ADMIN_EMAIL) Auth.js 세션 쿠키 */
export async function adminSessionCookie() {
  const value = await encode({
    token: { email: process.env.ADMIN_EMAIL, name: 'e2e' },
    secret: process.env.AUTH_SECRET!,
    salt: 'authjs.session-token',
  })
  return { name: 'authjs.session-token', value, domain: 'localhost', path: '/' }
}
