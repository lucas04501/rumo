import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/client.js'
import { account, session, user, verification } from './db/schema.js'

const NINETY_DAYS = 60 * 60 * 24 * 90
const ONE_DAY = 60 * 60 * 24

// Cadastro fechado por padrão. Abre só de propósito, para criar a primeira conta.
export const signupOpen = process.env.ALLOW_SIGNUP === 'true'

// Na Vercel o endereço vem do ambiente, então um domínio próprio não exige mudança aqui.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
const baseURL = process.env.BETTER_AUTH_URL ?? (productionHost && `https://${productionHost}`)

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !signupOpen,
  },
  // Sessão longa: o app instalado não deve pedir senha com frequência.
  session: { expiresIn: NINETY_DAYS, updateAge: ONE_DAY },
})
