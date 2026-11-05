import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { db } from './db/client.js'
import { account, rateLimit, session, subscriptions, user, verification } from './db/schema.js'
import { sendEmail } from './email.js'
import { stripe } from './stripe.js'

const NINETY_DAYS = 60 * 60 * 24 * 90
const ONE_DAY = 60 * 60 * 24
const FIVE_MINUTES = 60 * 5
const ONE_HOUR = 60 * 60

// Cadastro fechado por padrão. Só abre com `ALLOW_SIGNUP=true` no ambiente.
export const signupOpen = process.env.ALLOW_SIGNUP === 'true'

// Na Vercel o endereço vem do ambiente, então um domínio próprio não exige mudança aqui.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
export const baseURL = process.env.BETTER_AUTH_URL ?? (productionHost && `https://${productionHost}`)

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  // O limite de tentativas conta por IP. A Netlify manda o do cliente neste cabeçalho; sem ele, vale o padrão.
  advanced: { ipAddress: { ipAddressHeaders: ['x-nf-client-connection-ip', 'x-forwarded-for'] } },
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
      '/request-password-reset': { window: ONE_HOUR, max: 5 },
      '/reset-password': { window: FIVE_MINUTES, max: 8 },
      // Roda a cada abertura do app e não testa senha.
      '/get-session': false,
    },
  },
  // A senha é pedida de novo. Todas as tabelas apagam junto, em cascata pelo `user_id`.
  user: {
    deleteUser: {
      enabled: true,
      // Excluir o cliente na Stripe cancela as assinaturas na hora: ninguém é cobrado por conta apagada.
      // Se a Stripe falhar, a exclusão para: apagar só o nosso lado deixaria a cobrança viva.
      beforeDelete: async ({ id }) => {
        const [row] = await db.select({ customer: subscriptions.stripeCustomerId }).from(subscriptions).where(eq(subscriptions.userId, id))
        if (!row) return
        try {
          await stripe().customers.del(row.customer)
        } catch (error) {
          if ((error as { code?: string }).code !== 'resource_missing') throw error
        }
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: !signupOpen,
    // O link vale 1 hora e serve uma vez. Trocar a senha encerra as outras sessões.
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) =>
      sendEmail(
        user.email,
        'Redefinir sua senha do Rumo',
        `Olá, ${user.name}.\n\nPara criar uma senha nova, abra o link abaixo. Ele vale por 1 hora e funciona uma vez.\n\n${url}\n\nSe você não pediu isso, ignore este e-mail. Sua senha continua a mesma.`,
      ),
  },
  // Sessão longa: o app instalado não deve pedir senha com frequência.
  session: { expiresIn: NINETY_DAYS, updateAge: ONE_DAY },
})
