import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

function isRealDate(value: string): boolean {
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealDate)

export const uuid = z.uuid()
export const moment = z.iso.datetime({ offset: true })

/** Horário da edição no aparelho. É o que decide quem vence entre duas edições offline. */
export const editedAt = moment.optional()

export const dateRange = z.object({ from: isoDate, to: isoDate })

export async function readJson<T extends z.ZodType>(c: Context, schema: T): Promise<z.infer<T>> {
  const body = await c.req.json().catch(() => null)
  return parse(schema, body)
}

export function parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success) throw new HTTPException(400, { message: 'invalid_input' })
  return result.data
}

/** O relógio de um aparelho adiantado não pode vencer para sempre. */
export function resolveEditTime(value: string | undefined, now = new Date()): Date {
  if (!value) return now
  const parsed = new Date(value)
  return parsed > now ? now : parsed
}
