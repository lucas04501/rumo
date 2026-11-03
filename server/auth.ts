import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/client.js'
import { account, rateLimit, session, user, verification } from './db/schema.js'

const NINETY_DAYS = 60 * 60 * 24 * 90
const ONE_DAY = 60 * 60 * 24
const FIVE_MINUTES = 60 * 5
const ONE_HOUR = 60 * 60

// Cadastro fechado por padrão. Só abre com `ALLOW_SIGNUP=true` no ambiente.
export const signupOpen = process.env.ALLOW_SIGNUP === 'true'

// Na Vercel o endereço vem do ambiente, então um domínio próprio não exige mudança aqui.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
const baseURL = process.env.BETTER_AUTH_URL ?? (productionHost && `https://${productionHost}`)

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, rateLimit },
  }),
  // Na Vercel cada instância tem a sua memória, então o limite só vale de verdade no banco.
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    storage: 'database',
    customRules: {
      '/sign-in/email': { window: FIVE_MINUTES, max: 8 },
      '/sign-up/email': { window: ONE_HOUR, max: 5 },
      '/delete-user': { window: FIVE_MINUTES, max: 5 },
      // Roda a cada abertura do app e não testa senha.
      '/get-session': false,
    },
  },
  // A senha é pedida de novo. Todas as tabelas apagam junto, em cascata pelo `user_id`.
  user: { deleteUser: { enabled: true } },
  emailAndPassword: {
    enabled: true,
    disableSignUp: !signupOpen,
  },
  // Sessão longa: o app instalado não deve pedir senha com frequência.
  session: { expiresIn: NINETY_DAYS, updateAge: ONE_DAY },
})
