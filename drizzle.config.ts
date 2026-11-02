import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// Migrar a branch principal passa DATABASE_URL pelo ambiente, sem .env.
if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
