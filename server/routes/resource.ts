import { and, asc, eq, isNull, lte, sql } from 'drizzle-orm'
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { claim, db } from '../db/client.js'
import type { AuthedEnv } from '../session.js'
import { editedAt, parse, readJson, resolveEditTime, uuid } from '../validation.js'
import type { Guard } from './limits.js'

type OwnedTable = PgTable & {
  id: AnyPgColumn
  userId: AnyPgColumn
  updatedAt: AnyPgColumn
  deletedAt: AnyPgColumn
}

const notFound = { error: 'not_found' }

/**
 * Rotas de uma tabela editável: listar, gravar e excluir.
 *
 * - O ID vem do cliente, e o PUT é idempotente: a fila offline pode repetir.
 * - A cláusula do conflito só atualiza linhas do próprio usuário, ainda não
 *   excluídas e mais antigas que esta edição. Fora disso, nada muda e a
 *   resposta é 404, sem revelar se o ID existe.
 */
export function resource<T extends z.ZodObject>(table: OwnedTable, fields: T, guard?: Guard) {
  const body = fields.extend({ editedAt })

  return new Hono<AuthedEnv>()
    .get('/', async (c) => {
      const userId = c.get('userId')
      const [, rows] = await db.batch([
        claim(userId),
        db
          .select()
          .from(table as PgTable)
          .where(and(eq(table.userId, userId), isNull(table.deletedAt)))
          .orderBy(asc(table.id)),
      ])
      return c.json(rows)
    })
    .put('/:id', async (c) => {
      const id = parse(uuid, c.req.param('id'))
      const { editedAt: edited, ...data } = await readJson(c, body)
      const updatedAt = resolveEditTime(edited as string | undefined)
      const userId = c.get('userId')
      // Limites do plano. Só o PUT: excluir e listar nunca dependem do plano.
      await guard?.({ userId, id, data })

      const [, [row]] = await db.batch([
        claim(userId),
        db
          .insert(table)
          .values({ ...data, id, userId, updatedAt })
          .onConflictDoUpdate({
            target: table.id,
            set: { ...data, updatedAt },
            setWhere: and(eq(table.userId, userId), isNull(table.deletedAt), lte(table.updatedAt, updatedAt)),
          })
          .returning(),
      ])

      return row ? c.json(row) : c.json(notFound, 404)
    })
    .delete('/:id', async (c) => {
      const id = parse(uuid, c.req.param('id'))
      const userId = c.get('userId')
      const [, [row]] = await db.batch([
        claim(userId),
        db
          .update(table)
          .set({ deletedAt: sql`now()`, updatedAt: sql`now()` } as never)
          .where(and(eq(table.id, id), eq(table.userId, userId), isNull(table.deletedAt)))
          .returning(),
      ])

      return row ? c.body(null, 204) : c.json(notFound, 404)
    })
}
