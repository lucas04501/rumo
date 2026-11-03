import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não definida')

export const db = drizzle({ client: neon(url), schema })

/**
 * Primeiro item de todo `db.batch` das rotas. Dentro dessa transação, a consulta roda
 * como `rumo_app`, que pela RLS só enxerga as linhas de `userId`. É a segunda trava: o
 * filtro de cada rota continua, e isto segura o dia em que alguém esquecer um filtro.
 */
export const claim = (userId: string) =>
  db.execute(
    sql`select set_config('role', 'rumo_app', true), set_config('app.user_id', ${userId}, true)`,
  )
