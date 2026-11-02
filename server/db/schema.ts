import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

const moment = (name: string) => timestamp(name, { withTimezone: true })

// Tabelas do Better Auth. O formato é o que a biblioteca espera.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: moment('created_at').notNull().defaultNow(),
  updatedAt: moment('updated_at').notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: moment('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: moment('created_at').notNull().defaultNow(),
    updatedAt: moment('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: moment('access_token_expires_at'),
    refreshTokenExpiresAt: moment('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: moment('created_at').notNull().defaultNow(),
    updatedAt: moment('updated_at').notNull().defaultNow(),
  },
  (table) => [index('account_user_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: moment('expires_at').notNull(),
    createdAt: moment('created_at').notNull().defaultNow(),
    updatedAt: moment('updated_at').notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// Tabelas do app. Toda linha pertence a um usuário.

const owner = () =>
  text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })

const lifecycle = () => ({
  updatedAt: moment('updated_at').notNull().defaultNow(),
  // Exclusão suave: impede que a fila offline de outro aparelho traga o item de volta.
  deletedAt: moment('deleted_at'),
})

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    title: text('title').notNull(),
    why: text('why'),
    targetDate: date('target_date'),
    status: text('status').notNull().default('active'),
    doneAt: moment('done_at'),
    position: integer('position').notNull().default(0),
    ...lifecycle(),
  },
  // A unicidade composta permite as chaves estrangeiras que garantem o mesmo dono.
  (table) => [unique('goals_owner_key').on(table.userId, table.id)],
)

export const milestones = pgTable(
  'milestones',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    goalId: uuid('goal_id').notNull(),
    title: text('title').notNull(),
    position: integer('position').notNull().default(0),
    doneAt: moment('done_at'),
    ...lifecycle(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.goalId],
      foreignColumns: [goals.userId, goals.id],
      name: 'milestones_goal_owner_fk',
    }),
    index('milestones_goal_idx').on(table.goalId),
  ],
)

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    title: text('title').notNull(),
    icon: text('icon').notNull(),
    weekdays: smallint('weekdays')
      .array()
      .notNull()
      .default(sql`'{0,1,2,3,4,5,6}'::smallint[]`),
    startDate: date('start_date').notNull(),
    goalId: uuid('goal_id'),
    archivedAt: moment('archived_at'),
    position: integer('position').notNull().default(0),
    ...lifecycle(),
  },
  (table) => [
    unique('habits_owner_key').on(table.userId, table.id),
    foreignKey({
      columns: [table.userId, table.goalId],
      foreignColumns: [goals.userId, goals.id],
      name: 'habits_goal_owner_fk',
    }),
  ],
)

export const habitPauses = pgTable(
  'habit_pauses',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    habitId: uuid('habit_id').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    ...lifecycle(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.habitId],
      foreignColumns: [habits.userId, habits.id],
      name: 'habit_pauses_habit_owner_fk',
    }),
    check('habit_pauses_range', sql`${table.endDate} >= ${table.startDate}`),
    index('habit_pauses_habit_idx').on(table.habitId),
  ],
)

export const habitChecks = pgTable(
  'habit_checks',
  {
    habitId: uuid('habit_id').notNull(),
    date: date('date').notNull(),
    userId: owner(),
    checkedAt: moment('checked_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.habitId, table.date] }),
    foreignKey({
      columns: [table.userId, table.habitId],
      foreignColumns: [habits.userId, habits.id],
      name: 'habit_checks_habit_owner_fk',
    }),
    index('habit_checks_user_date_idx').on(table.userId, table.date),
  ],
)

export const days = pgTable(
  'days',
  {
    userId: owner(),
    date: date('date').notNull(),
    completedAt: moment('completed_at'),
    note: text('note'),
    updatedAt: moment('updated_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.date] })],
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    date: date('date').notNull(),
    title: text('title').notNull(),
    goalId: uuid('goal_id'),
    doneAt: moment('done_at'),
    position: integer('position').notNull().default(0),
    ...lifecycle(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.goalId],
      foreignColumns: [goals.userId, goals.id],
      name: 'tasks_goal_owner_fk',
    }),
    index('tasks_user_date_idx').on(table.userId, table.date),
  ],
)

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey(),
    userId: owner(),
    goalId: uuid('goal_id'),
    title: text('title').notNull().default(''),
    body: text('body').notNull().default(''),
    pinned: boolean('pinned').notNull().default(false),
    ...lifecycle(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.goalId],
      foreignColumns: [goals.userId, goals.id],
      name: 'notes_goal_owner_fk',
    }),
    index('notes_user_idx').on(table.userId),
  ],
)
