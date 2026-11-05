import { and, eq, isNull } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { loadPlan } from '../billing.js'
import { claim, db } from '../db/client.js'
import { habits } from '../db/schema.js'
import { limitsOf } from '../plan.js'

/** O servidor é a trava. O app esconde o botão, mas só isto vale. */
const planRequired = () => new HTTPException(402, { message: 'plan_required' })

export type Guard = (input: { userId: string; id: string; data: Record<string, unknown> }) => Promise<void>

/**
 * Hábito novo, ou arquivado que volta a ficar ativo, só entra se houver vaga.
 * Editar um hábito que já está ativo nunca é recusado, mesmo acima do limite.
 */
export const habitRoom: Guard = async ({ userId, id, data }) => {
  const { maxHabits } = limitsOf((await loadPlan(userId)).tier)
  if (maxHabits === null) return

  const becomesActive = data.archivedAt == null
  if (!becomesActive) return

  const [, rows] = await db.batch([
    claim(userId),
    db
      .select({ id: habits.id, archivedAt: habits.archivedAt })
      .from(habits)
      .where(and(eq(habits.userId, userId), isNull(habits.deletedAt))),
  ])
  const active = rows.filter((row) => !row.archivedAt)
  const wasActive = active.some((row) => row.id === id)
  // Dois aparelhos criando ao mesmo tempo podem passar de 3 por um hábito: é aceitável.
  if (!wasActive && active.length >= maxHabits) throw planRequired()
}

/** As áreas do Pro ficam em leitura no grátis. Excluir continua liberado: ninguém fica preso a dados. */
export const proOpen = async ({ userId }: { userId: string }) => {
  if (!limitsOf((await loadPlan(userId)).tier).proAreas) throw planRequired()
}
