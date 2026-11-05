import { HTTPException } from 'hono/http-exception'
import Stripe from 'stripe'

let client: Stripe | undefined

/**
 * Lida só quando precisa: sem a chave (desenvolvimento, testes) o resto da API sobe normal.
 * O cliente `fetch` evita depender do `http` do Node, que não existe em todo ambiente.
 */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new HTTPException(503, { message: 'billing_unavailable' })
  return (client ??= new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }))
}
