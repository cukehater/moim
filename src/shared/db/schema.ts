import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

export const resultVisibility = pgEnum('result_visibility', ['always', 'after_vote', 'after_close'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const meetings = pgTable(
  'meetings',
  {
    id: text('id').primaryKey(),
    title: varchar('title', { length: 80 }).notNull(),
    host: varchar('host', { length: 30 }).notNull(),
    description: varchar('description', { length: 500 }),
    location: varchar('location', { length: 100 }),
    thumbnailId: text('thumbnail_id'),
    isAnonymous: boolean('is_anonymous').notNull(),
    allowMultiple: boolean('allow_multiple').notNull(),
    resultVisibility: resultVisibility('result_visibility').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    confirmedOptionId: text('confirmed_option_id').references((): AnyPgColumn => dateOptions.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (t) => [check('meetings_ends_after_starts', sql`${t.endsAt} > ${t.startsAt}`)],
)

export const dateOptions = pgTable(
  'date_options',
  {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
  },
  (t) => [unique().on(t.meetingId, t.date)],
)

export const votes = pgTable(
  'votes',
  {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    voterToken: text('voter_token').notNull(),
    name: varchar('name', { length: 20 }),
    ...timestamps,
  },
  (t) => [unique().on(t.meetingId, t.voterToken), unique('votes_meeting_id_name_unique').on(t.meetingId, t.name)],
)

export const voteSelections = pgTable(
  'vote_selections',
  {
    voteId: text('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    optionId: text('option_id')
      .notNull()
      .references(() => dateOptions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.voteId, t.optionId] })],
)
